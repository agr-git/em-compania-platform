import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ItemPublico {
  codigo: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento_pct: number;
  total_linea: number;
}

export interface CotizacionPublica {
  numero: string;
  estado: string;
  subtotal: number;
  total: number;
  created_at: string;
  cliente: { nombre: string; nit: string | null };
  vendedor: { nombre: string; email: string };
  items: ItemPublico[];
}

/**
 * Lee una cotización por su `share_token` vía RPC security-definer
 * (`cotizacion_publica`). No requiere sesión: el token uuid ES la llave de
 * acceso. Devuelve solo lo que el cliente debe ver.
 */
export async function getCotizacionPublica(token: string): Promise<CotizacionPublica | null> {
  // Valida forma de UUID antes de tocar la BD (evita errores de tipo en el RPC).
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("cotizacion_publica", { p_token: token });
  if (error || !data) return null;

  const c = data as {
    numero: string;
    estado: string;
    subtotal: number | string;
    total: number | string;
    created_at: string;
    cliente: { nombre: string; nit: string | null };
    vendedor: { nombre: string; email: string };
    items: Array<{
      codigo: string;
      descripcion: string;
      cantidad: number | string;
      precio_unitario: number | string;
      descuento_pct: number | string;
      total_linea: number | string;
    }>;
  };

  return {
    numero: c.numero,
    estado: c.estado,
    subtotal: Number(c.subtotal),
    total: Number(c.total),
    created_at: c.created_at,
    cliente: c.cliente,
    vendedor: c.vendedor,
    items: (c.items ?? []).map((i) => ({
      codigo: i.codigo,
      descripcion: i.descripcion,
      cantidad: Number(i.cantidad),
      precio_unitario: Number(i.precio_unitario),
      descuento_pct: Number(i.descuento_pct),
      total_linea: Number(i.total_linea),
    })),
  };
}
