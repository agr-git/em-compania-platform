"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { crearUsuarioSchema } from "./schema";

export interface CrearUsuarioState {
  ok?: boolean;
  error?: string;
}

export async function crearUsuario(
  _prev: CrearUsuarioState | null,
  formData: FormData,
): Promise<CrearUsuarioState> {
  const admin = await requireAdmin();

  const parsed = crearUsuarioSchema.safeParse({
    nombre_completo: formData.get("nombre_completo"),
    email: formData.get("email"),
    password: formData.get("password"),
    rol: formData.get("rol"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  // Auth Admin API (service_role): crea el usuario confirmado.
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { nombre_completo: parsed.data.nombre_completo },
  });
  if (error || !data.user) {
    return { error: error?.message?.includes("already") ? "Ese correo ya existe." : "No se pudo crear el usuario." };
  }

  const { error: errProfile } = await sb.from("profiles").insert({
    id: data.user.id,
    rol: parsed.data.rol,
    nombre_completo: parsed.data.nombre_completo,
    email: parsed.data.email,
    activo: true,
  });
  if (errProfile) {
    // Rollback del usuario de auth si el perfil falla.
    await sb.auth.admin.deleteUser(data.user.id);
    return { error: "No se pudo crear el perfil del usuario." };
  }

  const supabase = await createSupabaseServerClient();
  await supabase.from("audit_log").insert({
    actor_id: admin.id,
    accion: "crear_usuario",
    entidad: "profile",
    entidad_id: data.user.id,
    payload: { rol: parsed.data.rol, email: parsed.data.email },
  });

  revalidatePath("/admin");
  return { ok: true };
}

/** Activa o desactiva un usuario (no se borra histórico). */
export async function setUsuarioActivo(userId: string, activo: boolean) {
  const admin = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("profiles").update({ activo }).eq("id", userId);
  if (error) throw error;

  await supabase.from("audit_log").insert({
    actor_id: admin.id,
    accion: activo ? "activar_usuario" : "desactivar_usuario",
    entidad: "profile",
    entidad_id: userId,
  });

  revalidatePath("/admin");
}
