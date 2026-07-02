"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireRol, type PerfilActual } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { crearClienteSchema, type CrearClienteInput } from "./schema";

export interface CrearClienteState {
  ok?: boolean;
  error?: string;
}

async function insertarCliente(
  actor: PerfilActual,
  input: CrearClienteInput,
): Promise<{ id: string } | { error: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clientes")
    .insert({
      nombre: input.nombre,
      nit: input.nit || null,
      descuento_default: input.descuento_default,
      activo: true,
    })
    .select("id")
    .single();
  if (error) return { error: "No se pudo crear el cliente." };

  await supabase.from("audit_log").insert({
    actor_id: actor.id,
    accion: "crear_cliente",
    entidad: "cliente",
    entidad_id: data.id,
    payload: { nombre: input.nombre, descuento_default: input.descuento_default },
  });

  revalidatePath("/admin/clientes");
  revalidatePath("/cotizaciones/nueva");
  return { id: data.id };
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

  const res = await insertarCliente(admin, parsed.data);
  if ("error" in res) return { error: res.error };
  return { ok: true };
}

export interface ClienteCreado {
  id: string;
  nombre: string;
  descuento_default: number;
}

/**
 * Alta rápida de cliente desde el armador de cotización (vendedor o admin).
 * Devuelve el cliente creado para seleccionarlo sin recargar.
 */
export async function crearClienteRapido(
  input: CrearClienteInput,
): Promise<{ cliente?: ClienteCreado; error?: string }> {
  const actor = await requireRol("vendedor", "administrador");

  const parsed = crearClienteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const res = await insertarCliente(actor, parsed.data);
  if ("error" in res) return { error: res.error };
  return {
    cliente: {
      id: res.id,
      nombre: parsed.data.nombre,
      descuento_default: parsed.data.descuento_default,
    },
  };
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
