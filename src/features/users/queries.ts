import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface UsuarioFila {
  id: string;
  rol: string;
  nombre_completo: string;
  email: string;
  activo: boolean;
  created_at: string;
  pedidos: number;
}

/** Lista todos los usuarios con cuántos pedidos creó cada uno. Solo admin (RLS). */
export async function getUsuarios(): Promise<UsuarioFila[]> {
  const supabase = await createSupabaseServerClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, rol, nombre_completo, email, activo, created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;

  const { data: pedidos } = await supabase.from("pedidos").select("vendedor_id");
  const conteo = new Map<string, number>();
  for (const p of pedidos ?? []) {
    const v = p.vendedor_id as string;
    conteo.set(v, (conteo.get(v) ?? 0) + 1);
  }

  return (profiles ?? []).map((p) => ({
    id: p.id as string,
    rol: p.rol as string,
    nombre_completo: p.nombre_completo as string,
    email: p.email as string,
    activo: p.activo as boolean,
    created_at: p.created_at as string,
    pedidos: conteo.get(p.id as string) ?? 0,
  }));
}
