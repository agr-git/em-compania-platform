import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface VentaVendedor {
  nombre: string;
  pedidos: number;
  total: number;
}

export interface TopProducto {
  codigo: string;
  descripcion: string;
  unidades: number;
  veces: number;
}

export interface MetricasTablero {
  cotizaciones_total: number;
  cotizaciones_convertidas: number;
  pedidos_total: number;
  total_vendido: number;
  facturados: number;
  clientes_activos: number;
  pedidos_por_estado: Record<string, number>;
  ventas_por_vendedor: VentaVendedor[];
  top_productos: TopProducto[];
}

/**
 * Métricas agregadas del negocio para el panel del administrador. Un solo viaje
 * a Postgres (RPC `metricas_tablero`, security-definer con guard es_admin()).
 */
export async function getMetricasTablero(): Promise<MetricasTablero> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("metricas_tablero");
  if (error) throw error;

  const d = (data ?? {}) as Partial<MetricasTablero>;
  return {
    cotizaciones_total: Number(d.cotizaciones_total ?? 0),
    cotizaciones_convertidas: Number(d.cotizaciones_convertidas ?? 0),
    pedidos_total: Number(d.pedidos_total ?? 0),
    total_vendido: Number(d.total_vendido ?? 0),
    facturados: Number(d.facturados ?? 0),
    clientes_activos: Number(d.clientes_activos ?? 0),
    pedidos_por_estado: (d.pedidos_por_estado ?? {}) as Record<string, number>,
    ventas_por_vendedor: (d.ventas_por_vendedor ?? []).map((v) => ({
      nombre: v.nombre,
      pedidos: Number(v.pedidos),
      total: Number(v.total),
    })),
    top_productos: (d.top_productos ?? []).map((t) => ({
      codigo: t.codigo,
      descripcion: t.descripcion,
      unidades: Number(t.unidades),
      veces: Number(t.veces),
    })),
  };
}
