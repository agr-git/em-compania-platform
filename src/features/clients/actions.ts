"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { crearClienteSchema } from "./schema";

export interface CrearClienteState {
  ok?: boolean;
  error?: string;
}

export async function crearCliente(
  _prev: CrearClienteState | null,
  formData: FormData,
): Promise<CrearClienteState> {
  const admin = await requireAdmin();

  const parsed = crearClienteSchema.safeParse({
    nombre: formData.get("nombre"),
    nit: formData.get("nit"),
    descuento_default: formData.get("descuento_default"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clientes")
    .insert({
      nombre: parsed.data.nombre,
      nit: parsed.data.nit || null,
      descuento_default: parsed.data.descuento_default,
      activo: true,
    })
    .select("id")
    .single();
  if (error) return { error: "No se pudo crear el cliente." };

  await supabase.from("audit_log").insert({
    actor_id: admin.id,
    accion: "crear_cliente",
    entidad: "cliente",
    entidad_id: data.id,
    payload: { nombre: parsed.data.nombre },
  });

  revalidatePath("/admin/clientes");
  return { ok: true };
}

export async function setClienteActivo(clienteId: string, activo: boolean) {
  const admin = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("clientes").update({ activo }).eq("id", clienteId);
  if (error) throw error;

  await supabase.from("audit_log").insert({
    actor_id: admin.id,
    accion: activo ? "activar_cliente" : "desactivar_cliente",
    entidad: "cliente",
    entidad_id: clienteId,
  });

  revalidatePath("/admin/clientes");
}
