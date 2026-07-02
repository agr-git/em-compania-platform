import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getContainer } from "@/lib/container";
import { formatCOP } from "@/lib/format";

/**
 * Cron semanal: genera un digesto con métricas de pedidos y lo envía al admin.
 * Vercel Cron lo invoca cada lunes a las 7am COT (vercel.json).
 * Protegido con CRON_SECRET para que no se pueda invocar externamente.
 */
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const sb = createSupabaseAdminClient();
  const ahora = new Date();
  const hace7Dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
  const periodo = `${hace7Dias.toLocaleDateString("es-CO")} – ${ahora.toLocaleDateString("es-CO")}`;

  const { data: pedidosSemana } = await sb
    .from("pedidos")
    .select("id, estado, total, created_at, vendedor_id, cliente:clientes(nombre), vendedor:profiles(nombre_completo)")
    .gte("created_at", hace7Dias.toISOString())
    .order("created_at", { ascending: false });

  const pedidos = (pedidosSemana ?? []) as unknown as {
    id: string;
    estado: string;
    total: number | string;
    created_at: string;
    vendedor_id: string;
    cliente?: { nombre: string } | { nombre: string }[] | null;
    vendedor?: { nombre_completo: string } | { nombre_completo: string }[] | null;
  }[];

  const totalPedidos = pedidos.length;
  const facturados = pedidos.filter((p) => p.estado === "facturado");
  const pendientes = pedidos.filter((p) => p.estado === "enviado_wo" || p.estado === "creado");
  const errores = pedidos.filter((p) => p.estado === "error");

  const ingresoTotal = pedidos.reduce((s, p) => s + Number(p.total), 0);
  const ingresoFacturado = facturados.reduce((s, p) => s + Number(p.total), 0);

  const vendedorMap = new Map<string, { nombre: string; pedidos: number; ingreso: number }>();
  for (const p of pedidos) {
    const vRaw = p.vendedor;
    const v = Array.isArray(vRaw) ? vRaw[0] : vRaw;
    const nombre = v?.nombre_completo ?? "—";
    const entry = vendedorMap.get(p.vendedor_id) ?? { nombre, pedidos: 0, ingreso: 0 };
    entry.pedidos++;
    entry.ingreso += Number(p.total);
    vendedorMap.set(p.vendedor_id, entry);
  }
  const topVendedores = [...vendedorMap.values()]
    .sort((a, b) => b.ingreso - a.ingreso)
    .slice(0, 5);

  const { data: pedidosViejos } = await sb
    .from("pedidos")
    .select("id, estado, created_at, cliente:clientes(nombre)")
    .in("estado", ["enviado_wo", "error"])
    .order("created_at", { ascending: true })
    .limit(10);

  const pedidosAtencionUrgente = ((pedidosViejos ?? []) as unknown as {
    id: string;
    estado: string;
    created_at: string;
    cliente?: { nombre: string } | { nombre: string }[] | null;
  }[]).map((p) => {
    const cRaw = p.cliente;
    const c = Array.isArray(cRaw) ? cRaw[0] : cRaw;
    return {
      id: p.id,
      cliente: c?.nombre ?? "—",
      estado: p.estado,
      antiguedadDias: Math.floor((ahora.getTime() - new Date(p.created_at).getTime()) / (24 * 60 * 60 * 1000)),
    };
  });

  const destinatario = process.env.DIGEST_EMAIL || process.env.NOTIFICATION_TO_CONTABLE || "admin@emcompania.test";
  const { notifications } = getContainer();

  await notifications.enviar({
    tipo: "digesto_semanal",
    destinatario,
    periodo,
    totalPedidos,
    pedidosFacturados: facturados.length,
    pedidosPendientes: pendientes.length,
    pedidosError: errores.length,
    ingresoTotal,
    ingresoFacturado,
    topVendedores,
    pedidosAtencionUrgente,
  });

  await sb.from("audit_log").insert({
    actor_id: null,
    accion: "digesto_semanal",
    entidad: "sistema",
    entidad_id: null,
    payload: {
      periodo,
      totalPedidos,
      facturados: facturados.length,
      pendientes: pendientes.length,
      errores: errores.length,
      ingresoTotal,
      ingresoFacturado,
      topVendedores: topVendedores.map((v) => `${v.nombre}: ${formatCOP(v.ingreso)}`),
    },
  });

  return NextResponse.json({
    ok: true,
    periodo,
    resumen: {
      totalPedidos,
      facturados: facturados.length,
      pendientes: pendientes.length,
      errores: errores.length,
      ingresoTotal: formatCOP(ingresoTotal),
      ingresoFacturado: formatCOP(ingresoFacturado),
      topVendedores,
      atencionUrgente: pedidosAtencionUrgente.length,
    },
  });
}
