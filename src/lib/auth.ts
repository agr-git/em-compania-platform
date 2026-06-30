import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Rol = "vendedor" | "contable" | "administrador";

export interface PerfilActual {
  id: string;
  rol: Rol;
  nombre_completo: string;
  email: string;
}

export async function getCurrentProfile(): Promise<PerfilActual | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, rol, nombre_completo, email")
    .eq("id", user.id)
    .single();
  if (!data) return null;

  return {
    id: data.id as string,
    rol: data.rol as Rol,
    nombre_completo: data.nombre_completo as string,
    email: data.email as string,
  };
}

/** Ruta de inicio según el rol (RBAC de navegación). */
export function rutaPorRol(rol: Rol | string): string {
  return rol === "vendedor" ? "/catalogo" : "/contable";
}
