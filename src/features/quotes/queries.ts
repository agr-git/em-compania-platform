import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ClienteOption {
  id: string;
  nombre: string;
  descuento_default: number;
}

export async function getClientes(): Promise<ClienteOption[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nombre, descuento_default")
    .eq("activo", true)
    .order("nombre");
  if (error) throw error;
  return (data ?? []).map((c) => ({
    id: c.id as string,
    nombre: c.nombre as string,
    descuento_default: Number(c.descuento_default),
  }));
}

export interface ItemDetalle {
  id: string;
  codigo_contable_snap: string;
  descripcion_snap: string;
  cantidad: number;
  precio_unitario: number;
  descuento_pct: number;
  total_linea: number;
}

export interface CotizacionDetalle {
  id: string;
  estado: string;
  subtotal: number;
  total: number;
  created_at: string;
  cliente_nombre: string;
  items: ItemDetalle[];
  pedido: { id: string; estado: string; wo_order_id: string | null } | null;
}

export async function getCotizacion(id: string): Promise<CotizacionDetalle | null> {
  const supabase = await createSupabaseServerClient();

  const { data: cot, error } = await supabase
    .from("cotizaciones")
    .select("id, estado, subtotal, total, created_at, clientes(nombre)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!cot) return null;

  const { data: items } = await supabase
    .from("cotizacion_items")
    .select("id, codigo_contable_snap, descripcion_snap, cantidad, precio_unitario, descuento_pct, total_linea")
    .eq("cotizacion_id", id)
    .order("descripcion_snap");

  const { data: pedido } = await supabase
    .from("pedidos")
    .select("id, estado, wo_order_id")
    .eq("cotizacion_id", id)
    .maybeSingle();

  const clienteRaw = (cot as unknown as { clientes?: { nombre: string } | { nombre: string }[] | null })
    .clientes;
  const cliente = Array.isArray(clienteRaw) ? clienteRaw[0] : clienteRaw;

  return {
    id: cot.id as string,
    estado: cot.estado as string,
    subtotal: Number(cot.subtotal),
    total: Number(cot.total),
    created_at: cot.created_at as string,
    cliente_nombre: cliente?.nombre ?? "—",
    items: (items ?? []).map((i) => ({
      id: i.id as string,
      codigo_contable_snap: i.codigo_contable_snap as string,
      descripcion_snap: i.descripcion_snap as string,
      cantidad: Number(i.cantidad),
      precio_unitario: Number(i.precio_unitario),
      descuento_pct: Number(i.descuento_pct),
      total_linea: Number(i.total_linea),
    })),
    pedido: pedido
      ? { id: pedido.id as string, estado: pedido.estado as string, wo_order_id: (pedido.wo_order_id as string) ?? null }
      : null,
  };
}
