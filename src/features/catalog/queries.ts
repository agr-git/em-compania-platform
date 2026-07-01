import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProductoBusqueda, ResultadoBusqueda } from "./types";

/**
 * Búsqueda dual PAGINADA (por descripción O por código). Delega en la función
 * SQL buscar_productos (respeta RLS). Devuelve la página + el total.
 */
export async function buscarProductos(
  termino: string,
  pagina = 1,
  porPagina = 24,
): Promise<ResultadoBusqueda> {
  const supabase = await createSupabaseServerClient();
  const desplazamiento = (Math.max(1, pagina) - 1) * porPagina;

  const { data, error } = await supabase.rpc("buscar_productos", {
    termino: termino ?? "",
    limite: porPagina,
    desplazamiento,
  });
  if (error) throw error;

  const rows = (data ?? []) as (ProductoBusqueda & { total: number })[];
  const total = rows[0]?.total ?? 0;
  const productos = rows.map(({ total: _t, ...p }) => p);
  return { productos, total };
}
