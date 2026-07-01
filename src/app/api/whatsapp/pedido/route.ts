import { NextResponse } from "next/server";
import { z } from "zod";
import { calcularTotales, totalLinea } from "@/core/domain/cotizacion";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Ingesta de pedidos por WhatsApp (canal Kapso). WhatsApp = "otra cara" del mismo
 * backend: crea una COTIZACIÓN borrador (revisable por un vendedor), no un pedido.
 * Autenticado con token propio (WHATSAPP_INGEST_TOKEN), no con sesión de usuario.
 *
 * Body: { telefono?, items: [{ consulta, cantidad }] }
 * El agente extrae { consulta (texto/código del producto), cantidad } y aquí se
 * resuelve el producto con la búsqueda dual y se arma la cotización.
 */
const bodySchema = z.object({
  telefono: z.string().optional(),
  items: z
    .array(
      z.object({
        consulta: z.string().min(1),
        cantidad: z.coerce.number().positive().max(10000).default(1),
      }),
    )
    .min(1),
});

export async function POST(req: Request) {
  const token = process.env.WHATSAPP_INGEST_TOKEN;
  if (!token || req.headers.get("authorization") !== `Bearer ${token}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const sb = createSupabaseAdminClient();

  const { data: cliente } = await sb
    .from("clientes")
    .select("id, descuento_default")
    .eq("nombre", "Canal WhatsApp")
    .maybeSingle();
  if (!cliente) return NextResponse.json({ error: "Cliente 'Canal WhatsApp' no configurado" }, { status: 500 });

  const vendedorEmail = process.env.WHATSAPP_VENDEDOR_EMAIL || "vendedor@emcompania.test";
  const { data: vendedor } = await sb.from("profiles").select("id").eq("email", vendedorEmail).maybeSingle();
  if (!vendedor) return NextResponse.json({ error: "Vendedor por defecto no encontrado" }, { status: 500 });

  const descuento = Number(cliente.descuento_default);
  const lineas: {
    producto_id: string;
    codigo_contable_snap: string;
    descripcion_snap: string;
    cantidad: number;
    precio_unitario: number;
    descuento_pct: number;
    total_linea: number;
  }[] = [];
  const noEncontrados: string[] = [];

  for (const it of parsed.data.items) {
    const { data: match } = await sb.rpc("buscar_productos", {
      termino: it.consulta,
      limite: 1,
      desplazamiento: 0,
    });
    const p = (match ?? [])[0];
    if (!p) {
      noEncontrados.push(it.consulta);
      continue;
    }
    const precio = Number(p.precio_lista);
    lineas.push({
      producto_id: p.id,
      codigo_contable_snap: p.codigo_contable,
      descripcion_snap: p.descripcion,
      cantidad: it.cantidad,
      precio_unitario: precio,
      descuento_pct: descuento,
      total_linea: totalLinea({ cantidad: it.cantidad, precioUnitario: precio, descuentoPct: descuento }),
    });
  }

  if (lineas.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No se reconoció ningún producto.", no_encontrados: noEncontrados },
      { status: 200 },
    );
  }

  const totales = calcularTotales(
    lineas.map((l) => ({ cantidad: l.cantidad, precioUnitario: l.precio_unitario, descuentoPct: l.descuento_pct })),
  );

  const { data: cot, error } = await sb
    .from("cotizaciones")
    .insert({
      vendedor_id: vendedor.id,
      cliente_id: cliente.id,
      estado: "enviada",
      subtotal: totales.subtotal,
      total: totales.total,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: "No se pudo crear la cotización" }, { status: 500 });

  await sb.from("cotizacion_items").insert(lineas.map((l) => ({ ...l, cotizacion_id: cot.id })));
  await sb.from("audit_log").insert({
    actor_id: vendedor.id,
    accion: "cotizacion_whatsapp",
    entidad: "cotizacion",
    entidad_id: cot.id,
    payload: { telefono: parsed.data.telefono ?? null, no_encontrados: noEncontrados },
  });

  return NextResponse.json({
    ok: true,
    cotizacion_id: cot.id,
    total: totales.total,
    lineas: lineas.map((l) => ({
      codigo: l.codigo_contable_snap,
      descripcion: l.descripcion_snap,
      cantidad: l.cantidad,
      total: l.total_linea,
    })),
    no_encontrados: noEncontrados,
  });
}
