"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { construirIdempotencyKey } from "@/core/domain/idempotency";
import type { CrearPedidoWO, RenglonWO } from "@/core/ports/world-office.port";
import { requireRol } from "@/lib/auth";
import { getContainer } from "@/lib/container";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ConvertirResultado {
  error?: string;
}

/**
 * Convierte una cotización en pedido y lo envía a World Office.
 *
 * 1) Guard de rol (vendedor/admin) + validación de stock en el punto de commit.
 * 2) El vendedor crea el pedido + líneas (RLS valida que es suyo). Un índice
 *    único sobre `cotizacion_id` garantiza **un pedido por cotización** incluso
 *    ante doble clic; el conflicto (23505) se resuelve redirigiendo al existente.
 * 3) El "worker del sistema" (service_role) procesa el outbox inline: encola con
 *    idempotency_key **derivada de la cotización** (estable entre reintentos),
 *    llama WorldOfficePort.crearPedido (mock en el concurso), marca el pedido
 *    enviado_wo, notifica al contable y audita.
 *
 * Devuelve `{error}` si algo bloquea el commit (p.ej. stock insuficiente);
 * en éxito hace `redirect` al pedido.
 */
export async function convertirEnPedido(cotizacionId: string): Promise<ConvertirResultado> {
  const perfil = await requireRol("vendedor", "administrador");
  const supabase = await createSupabaseServerClient();

  // Idempotencia a nivel de cotización: si ya hay pedido, no se crea otro.
  const { data: existente } = await supabase
    .from("pedidos")
    .select("id")
    .eq("cotizacion_id", cotizacionId)
    .maybeSingle();
  if (existente) redirect(`/pedidos/${existente.id}`);

  const { data: cot, error: errCot } = await supabase
    .from("cotizaciones")
    .select("id, cliente_id, total")
    .eq("id", cotizacionId)
    .single();
  if (errCot) throw errCot;

  const { data: items, error: errItems } = await supabase
    .from("cotizacion_items")
    .select("producto_id, codigo_contable_snap, descripcion_snap, cantidad, precio_unitario, descuento_pct, total_linea")
    .eq("cotizacion_id", cotizacionId);
  if (errItems) throw errItems;
  if (!items || items.length === 0) throw new Error("La cotización no tiene líneas.");

  // Validación de stock: un pedido compromete inventario y va a World Office.
  // (Cotizar sí se permite sin stock —es una oferta—; convertir en pedido, no.)
  const productoIds = items.map((i) => i.producto_id);
  const { data: inv } = await supabase
    .from("inventario")
    .select("producto_id, cantidad_disponible")
    .in("producto_id", productoIds);
  const disponible = new Map<string, number>();
  for (const row of inv ?? []) {
    const id = row.producto_id as string;
    disponible.set(id, (disponible.get(id) ?? 0) + Number(row.cantidad_disponible));
  }
  const faltantes = items
    .filter((i) => Number(i.cantidad) > (disponible.get(i.producto_id as string) ?? 0))
    .map((i) => `${i.descripcion_snap} (pides ${Number(i.cantidad)}, hay ${disponible.get(i.producto_id as string) ?? 0})`);
  if (faltantes.length > 0) {
    return { error: `Stock insuficiente para convertir en pedido: ${faltantes.join("; ")}.` };
  }

  // 1) Pedido como vendedor (RLS). El índice único evita duplicados por carrera.
  const { data: pedido, error: errPed } = await supabase
    .from("pedidos")
    .insert({
      cotizacion_id: cot.id,
      vendedor_id: perfil.id,
      cliente_id: cot.cliente_id,
      estado: "creado",
      total: Number(cot.total),
    })
    .select("id")
    .single();
  if (errPed) {
    // 23505 = otra pestaña/clic ganó la carrera; redirige al pedido ya creado.
    if (errPed.code === "23505") {
      const { data: ya } = await supabase
        .from("pedidos")
        .select("id")
        .eq("cotizacion_id", cot.id)
        .maybeSingle();
      if (ya) redirect(`/pedidos/${ya.id}`);
    }
    throw errPed;
  }

  const { error: errPedItems } = await supabase
    .from("pedido_items")
    .insert(items.map((i) => ({ ...i, pedido_id: pedido.id })));
  if (errPedItems) throw errPedItems;

  // 2) Worker del sistema (service_role bypassa RLS).
  const admin = createSupabaseAdminClient();
  const idEmpresa = process.env.WORLD_OFFICE_ID_EMPRESA || "EMC-DEMO";
  // Número derivado de la COTIZACIÓN (estable): un reintento produce la misma
  // idempotency_key → World Office nunca ve dos documentos distintos.
  const numero = String(cot.id).slice(0, 8);
  const idempotencyKey = construirIdempotencyKey({
    prefijo: "PED",
    numero,
    idEmpresa,
    documentoTipo: "FV",
  });

  const renglones: RenglonWO[] = items.map((i) => ({
    inventarioId: i.codigo_contable_snap as string, // en prod: wo_inventario_id
    unidadMedidaId: "UND",
    cantidad: Number(i.cantidad),
    precioUnitario: Number(i.precio_unitario),
    descuentoPct: Number(i.descuento_pct),
  }));

  const payload: CrearPedidoWO = {
    idempotencyKey,
    documentoTipo: "FV",
    prefijo: "PED",
    terceroId: cot.cliente_id as string,
    monedaId: "COP",
    formaPagoId: "CONTADO",
    bodegaId: "PRINCIPAL",
    renglones,
  };

  await admin.from("wo_outbox").insert({
    pedido_id: pedido.id,
    idempotency_key: idempotencyKey,
    payload,
    estado: "pending",
    intentos: 1,
  });

  const { worldOffice, notifications } = getContainer();
  try {
    const resultado = await worldOffice.crearPedido(payload);
    await admin.from("pedidos").update({ estado: "enviado_wo", wo_order_id: resultado.woOrderId }).eq("id", pedido.id);
    await admin
      .from("wo_outbox")
      .update({ estado: "sent", sent_at: new Date().toISOString() })
      .eq("idempotency_key", idempotencyKey);

    const destinatario = process.env.NOTIFICATION_TO_CONTABLE || "contable@emcompania.test";
    await admin.from("notificaciones").insert({
      pedido_id: pedido.id,
      tipo: "pedido_nuevo",
      destinatario,
      estado: "pending",
    });
    await notifications.enviar({
      tipo: "pedido_nuevo",
      destinatario,
      pedidoId: String(pedido.id),
      vendedor: perfil.email,
      cliente: String(cot.cliente_id),
      total: Number(cot.total),
    });
    await admin
      .from("notificaciones")
      .update({ estado: "enviada", enviado_at: new Date().toISOString() })
      .eq("pedido_id", pedido.id);
  } catch (e) {
    await admin.from("pedidos").update({ estado: "error" }).eq("id", pedido.id);
    await admin
      .from("wo_outbox")
      .update({ estado: "failed", last_error: e instanceof Error ? e.message : String(e) })
      .eq("idempotency_key", idempotencyKey);
  }

  await supabase.from("cotizaciones").update({ estado: "convertida" }).eq("id", cot.id);
  await admin.from("audit_log").insert({
    actor_id: perfil.id,
    accion: "enviar_wo",
    entidad: "pedido",
    entidad_id: pedido.id,
    payload: { idempotencyKey },
  });

  redirect(`/pedidos/${pedido.id}`);
}

/**
 * Reintenta el envío a World Office de un pedido en estado 'error'. Reusa la
 * MISMA idempotency_key del outbox → World Office trata el reintento como el
 * mismo documento (nunca duplica). Lo dispara el vendedor dueño o un admin.
 */
export async function reintentarEnvioWO(pedidoId: string): Promise<ConvertirResultado> {
  const perfil = await requireRol("vendedor", "administrador");
  const admin = createSupabaseAdminClient();

  const { data: pedido } = await admin
    .from("pedidos")
    .select("id, estado, vendedor_id")
    .eq("id", pedidoId)
    .maybeSingle();
  if (!pedido) return { error: "Pedido no encontrado." };
  if (perfil.rol === "vendedor" && pedido.vendedor_id !== perfil.id) {
    return { error: "No puedes reintentar un pedido de otro vendedor." };
  }
  if (pedido.estado !== "error") {
    revalidatePath(`/pedidos/${pedidoId}`);
    return {};
  }

  const { data: outbox } = await admin
    .from("wo_outbox")
    .select("idempotency_key, payload")
    .eq("pedido_id", pedidoId)
    .maybeSingle();
  if (!outbox) return { error: "No hay payload en el outbox para reintentar." };

  const { worldOffice } = getContainer();
  try {
    const resultado = await worldOffice.crearPedido(outbox.payload as CrearPedidoWO);
    await admin
      .from("pedidos")
      .update({ estado: "enviado_wo", wo_order_id: resultado.woOrderId })
      .eq("id", pedidoId);
    await admin
      .from("wo_outbox")
      .update({ estado: "sent", sent_at: new Date().toISOString(), last_error: null })
      .eq("idempotency_key", outbox.idempotency_key);
    await admin.from("audit_log").insert({
      actor_id: perfil.id,
      accion: "reintentar_wo",
      entidad: "pedido",
      entidad_id: pedidoId,
      payload: { idempotencyKey: outbox.idempotency_key },
    });
  } catch (e) {
    await admin
      .from("wo_outbox")
      .update({ estado: "failed", last_error: e instanceof Error ? e.message : String(e) })
      .eq("idempotency_key", outbox.idempotency_key);
    return { error: "El reintento falló. Revisa el estado del outbox." };
  }

  revalidatePath(`/pedidos/${pedidoId}`);
  return {};
}

/**
 * Convierte un pedido en factura (lo ejecuta contabilidad). Orden obligatorio:
 * contabilizar → facturar electrónicamente (la API rechaza facturar sin
 * contabilizar: DOCUMENTO_NO_CONTABILIZADO). En el concurso lo simula el mock.
 */
export interface FacturarResultado {
  ok?: boolean;
  cufe?: string;
  error?: string;
}

export async function facturarPedido(pedidoId: string): Promise<FacturarResultado> {
  const user = await requireRol("contable", "administrador");
  const supabase = await createSupabaseServerClient();

  const { data: pedido } = await supabase
    .from("pedidos")
    .select("id, wo_order_id, estado")
    .eq("id", pedidoId)
    .maybeSingle();
  if (!pedido || !pedido.wo_order_id) return { error: "El pedido no está en World Office." };
  if (pedido.estado === "facturado") {
    revalidatePath("/contable");
    return { ok: true, cufe: "ya-facturado" };
  }

  const { worldOffice } = getContainer();
  try {
    await worldOffice.contabilizarDocumento(pedido.wo_order_id as string);
    const factura = await worldOffice.facturarElectronico(pedido.wo_order_id as string);

    const { error } = await supabase.from("pedidos").update({ estado: "facturado" }).eq("id", pedidoId);
    if (error) return { error: "No se pudo actualizar el estado del pedido." };

    await supabase.from("audit_log").insert({
      actor_id: user.id,
      accion: "facturar",
      entidad: "pedido",
      entidad_id: pedidoId,
      payload: { cufe: factura.cufe },
    });

    return { ok: true, cufe: factura.cufe };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al facturar en World Office." };
  }
}
