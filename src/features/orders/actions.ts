"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { construirIdempotencyKey } from "@/core/domain/idempotency";
import type { CrearPedidoWO, RenglonWO } from "@/core/ports/world-office.port";
import { getContainer } from "@/lib/container";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Convierte una cotización en pedido y lo envía a World Office.
 *
 * 1) El vendedor crea el pedido + líneas (RLS valida que es suyo).
 * 2) El "worker del sistema" (service_role) procesa el outbox inline:
 *    encola con idempotency_key, llama WorldOfficePort.crearPedido (mock en el
 *    concurso), marca el pedido enviado_wo, notifica al contable y audita.
 * Un reintento con la misma cotización reusa el pedido existente → no duplica.
 */
export async function convertirEnPedido(cotizacionId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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

  // 1) Pedido + líneas como vendedor (RLS).
  const { data: pedido, error: errPed } = await supabase
    .from("pedidos")
    .insert({
      cotizacion_id: cot.id,
      vendedor_id: user.id,
      cliente_id: cot.cliente_id,
      estado: "creado",
      total: Number(cot.total),
    })
    .select("id")
    .single();
  if (errPed) throw errPed;

  const { error: errPedItems } = await supabase
    .from("pedido_items")
    .insert(items.map((i) => ({ ...i, pedido_id: pedido.id })));
  if (errPedItems) throw errPedItems;

  // 2) Worker del sistema (service_role bypassa RLS).
  const admin = createSupabaseAdminClient();
  const idEmpresa = process.env.WORLD_OFFICE_ID_EMPRESA || "EMC-DEMO";
  const numero = String(pedido.id).slice(0, 8);
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
      vendedor: user.email ?? "",
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
    actor_id: user.id,
    accion: "enviar_wo",
    entidad: "pedido",
    entidad_id: pedido.id,
    payload: { idempotencyKey },
  });

  redirect(`/pedidos/${pedido.id}`);
}

/**
 * Convierte un pedido en factura (lo ejecuta contabilidad). Orden obligatorio:
 * contabilizar → facturar electrónicamente (la API rechaza facturar sin
 * contabilizar: DOCUMENTO_NO_CONTABILIZADO). En el concurso lo simula el mock.
 */
export async function facturarPedido(pedidoId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pedido } = await supabase
    .from("pedidos")
    .select("id, wo_order_id, estado")
    .eq("id", pedidoId)
    .maybeSingle();
  if (!pedido || !pedido.wo_order_id) throw new Error("El pedido no está en World Office.");
  if (pedido.estado === "facturado") {
    revalidatePath("/contable");
    return;
  }

  const { worldOffice } = getContainer();
  await worldOffice.contabilizarDocumento(pedido.wo_order_id as string);
  const factura = await worldOffice.facturarElectronico(pedido.wo_order_id as string);

  // El contable puede UPDATE pedidos (RLS pedidos_contable_update).
  const { error } = await supabase.from("pedidos").update({ estado: "facturado" }).eq("id", pedidoId);
  if (error) throw error;

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    accion: "facturar",
    entidad: "pedido",
    entidad_id: pedidoId,
    payload: { cufe: factura.cufe },
  });

  revalidatePath("/contable");
}
