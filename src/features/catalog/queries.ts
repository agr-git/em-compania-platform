import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProductoBusqueda } from "./types";

/**
 * Búsqueda dual (por descripción O por código). Delega en la función SQL
 * buscar_productos, que respeta RLS (catálogo legible por authenticated).
 */
export async function buscarProductos(termino: string): Promise<ProductoBusqueda[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("buscar_productos", { termino: termino ?? "" });
  if (error) throw error;
  return (data ?? []) as ProductoBusqueda[];
}
