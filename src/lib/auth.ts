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
  if (rol === "vendedor") return "/catalogo";
  if (rol === "administrador") return "/admin";
  return "/contable";
}

/** Lanza si el usuario actual no es administrador. Usar al inicio de acciones admin. */
export async function requireAdmin(): Promise<PerfilActual> {
  return requireRol("administrador");
}

/** Lanza si el usuario actual no tiene alguno de los roles dados. */
export async function requireRol(...roles: Rol[]): Promise<PerfilActual> {
  const perfil = await getCurrentProfile();
  if (!perfil || !roles.includes(perfil.rol)) {
    throw new Error(`Acceso denegado: requiere rol ${roles.join(" o ")}.`);
  }
  return perfil;
}
