"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { rutaPorRol } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export interface LoginState {
  error?: string;
}

export async function login(_prev: LoginState | null, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Correo o contraseña inválidos." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: "Credenciales incorrectas." };
  }

  // Ruteo por rol: vendedor → catálogo; contable/admin → panel de pedidos.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let destino = "/catalogo";
  if (user) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("rol, activo")
      .eq("id", user.id)
      .single();
    if (prof && prof.activo === false) {
      await supabase.auth.signOut();
      return { error: "Usuario inactivo. Contacta al administrador." };
    }
    if (prof?.rol) destino = rutaPorRol(prof.rol as string);
  }
  redirect(destino);
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
