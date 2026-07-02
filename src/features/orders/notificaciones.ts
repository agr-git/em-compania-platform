"use server";

import { requireRol } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface NotificacionItem {
  id: string;
  pedido_id: string;
  created_at: string;
  leida: boolean;
  cliente_nombre: string;
  vendedor_nombre: string;
  total: number;
}

export interface NotificacionesResultado {
  items: NotificacionItem[];
  noLeidas: number;
}

function unwrap<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

/** Notificaciones de pedidos nuevos para el contable/admin (recientes primero). */
export async function cargarNotificaciones(limite = 15): Promise<NotificacionesResultado> {
  await requireRol("contable", "administrador");
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("notificaciones")
    .select(
      "id, pedido_id, created_at, leida_at, pedidos(total, cliente:clientes(nombre), vendedor:profiles(nombre_completo))",
    )
    .eq("tipo", "pedido_nuevo")
    .order("created_at", { ascending: false })
    .limit(limite);
  if (error) throw error;

  type Raw = {
    id: string;
    pedido_id: string;
    created_at: string;
    leida_at: string | null;
    pedidos?:
      | {
          total: number | string;
          cliente?: { nombre: string } | { nombre: string }[] | null;
          vendedor?: { nombre_completo: string } | { nombre_completo: string }[] | null;
        }
      | {
          total: number | string;
          cliente?: { nombre: string } | { nombre: string }[] | null;
          vendedor?: { nombre_completo: string } | { nombre_completo: string }[] | null;
        }[]
      | null;
  };

  const items: NotificacionItem[] = ((data ?? []) as unknown as Raw[]).map((r) => {
    const pedido = unwrap(r.pedidos);
    return {
      id: r.id,
      pedido_id: r.pedido_id,
      created_at: r.created_at,
      leida: r.leida_at !== null,
      cliente_nombre: unwrap(pedido?.cliente)?.nombre ?? "—",
      vendedor_nombre: unwrap(pedido?.vendedor)?.nombre_completo ?? "—",
      total: Number(pedido?.total ?? 0),
    };
  });

  const noLeidas = items.filter((i) => !i.leida).length;
  return { items, noLeidas };
}

/** Marca como leídas todas las notificaciones pendientes (al abrir la campana). */
export async function marcarNotificacionesLeidas(): Promise<void> {
  await requireRol("contable", "administrador");
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("notificaciones")
    .update({ leida_at: new Date().toISOString() })
    .is("leida_at", null)
    .eq("tipo", "pedido_nuevo");
}
