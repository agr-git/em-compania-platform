import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ItemDetalle } from "@/features/quotes/queries";

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
