import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ClienteFila {
  id: string;
  nombre: string;
  nit: string | null;
  descuento_default: number;
  activo: boolean;
}

export async function getClientesAdmin(): Promise<ClienteFila[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nombre, nit, descuento_default, activo")
    .order("nombre");
  if (error) throw error;
  return (data ?? []).map((c) => ({
    id: c.id as string,
    nombre: c.nombre as string,
    nit: (c.nit as string) ?? null,
    descuento_default: Number(c.descuento_default),
    activo: c.activo as boolean,
  }));
}
