import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ItemDetalle } from "@/features/quotes/queries";

function unwrap<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

export interface VendedorOption {
  id: string;
  nombre: string;
}

export async function getVendedores(): Promise<VendedorOption[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, nombre_completo")
    .eq("rol", "vendedor")
    .eq("activo", true)
    .order("nombre_completo");
  return (data ?? []).map((p) => ({ id: p.id as string, nombre: p.nombre_completo as string }));
}

export interface PedidoFila {
  id: string;
  estado: string;
  wo_order_id: string | null;
  total: number;
  created_at: string;
  cliente_nombre: string;
  vendedor_nombre: string;
}

/** Todos los pedidos (recientes primero), opcionalmente filtrados por vendedor. Solo contable/admin (RLS). */
export async function getPedidosContable(vendedorId?: string): Promise<PedidoFila[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("pedidos")
    .select("id, estado, wo_order_id, total, created_at, cliente:clientes(nombre), vendedor:profiles(nombre_completo)")
    .order("created_at", { ascending: false });
  if (vendedorId) query = query.eq("vendedor_id", vendedorId);

  const { data, error } = await query;
  if (error) throw error;

  type Raw = {
    id: string;
    estado: string;
    wo_order_id: string | null;
    total: number | string;
    created_at: string;
    cliente?: { nombre: string } | { nombre: string }[] | null;
    vendedor?: { nombre_completo: string } | { nombre_completo: string }[] | null;
  };

  return ((data ?? []) as unknown as Raw[]).map((row) => ({
    id: row.id,
    estado: row.estado,
    wo_order_id: row.wo_order_id ?? null,
    total: Number(row.total),
    created_at: row.created_at,
    cliente_nombre: unwrap(row.cliente)?.nombre ?? "—",
    vendedor_nombre: unwrap(row.vendedor)?.nombre_completo ?? "—",
  }));
}

export interface PedidoDetalle {
  id: string;
  estado: string;
  wo_order_id: string | null;
  total: number;
  created_at: string;
  cliente_nombre: string;
  items: ItemDetalle[];
}

export async function getPedido(id: string): Promise<PedidoDetalle | null> {
  const supabase = await createSupabaseServerClient();

  const { data: pedido, error } = await supabase
    .from("pedidos")
    .select("id, estado, wo_order_id, total, created_at, clientes(nombre)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!pedido) return null;

  const { data: items } = await supabase
    .from("pedido_items")
    .select("id, codigo_contable_snap, descripcion_snap, cantidad, precio_unitario, descuento_pct, total_linea")
    .eq("pedido_id", id)
    .order("descripcion_snap");

  const clienteRaw = (pedido as unknown as { clientes?: { nombre: string } | { nombre: string }[] | null })
    .clientes;
  const cliente = Array.isArray(clienteRaw) ? clienteRaw[0] : clienteRaw;

  return {
    id: pedido.id as string,
    estado: pedido.estado as string,
    wo_order_id: (pedido.wo_order_id as string) ?? null,
    total: Number(pedido.total),
    created_at: pedido.created_at as string,
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
  };
}
