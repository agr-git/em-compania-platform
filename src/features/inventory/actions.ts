"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { COLUMNAS_CSV, filaCsvSchema, parseCsv } from "./csv";

export interface ImportarCsvState {
  ok?: boolean;
  procesados?: number;
  errores?: string[];
  error?: string;
}

export async function importarInventarioCsv(
  _prev: ImportarCsvState | null,
  formData: FormData,
): Promise<ImportarCsvState> {
  const admin = await requireAdmin();

  const archivo = formData.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Selecciona un archivo CSV." };
  }

  const filas = parseCsv(await archivo.text());
  if (filas.length < 2) {
    return { error: "El CSV no tiene filas de datos (¿falta el encabezado?)." };
  }

  // Mapa de columnas por nombre de encabezado (tolerante a orden).
  const encabezado = filas[0].map((h) => h.trim().toLowerCase());
  const idx = (col: string) => encabezado.indexOf(col);
  const iCodigo = idx("codigo_contable");
  const iDesc = idx("descripcion");
  const iCat = idx("categoria");
  if (iCodigo < 0 || iDesc < 0 || iCat < 0) {
    return { error: `Faltan columnas obligatorias. Encabezado esperado: ${COLUMNAS_CSV.join(", ")}.` };
  }
  const iUnidad = idx("unidad");
  const iPrecio = idx("precio_lista");
  const iStock = idx("stock");

  const errores: string[] = [];
  const productos: {
    codigo_contable: string;
    descripcion: string;
    categoria: string;
    unidad: string;
    precio_lista: number;
    activo: boolean;
  }[] = [];
  const stocks = new Map<string, number>();

  for (let f = 1; f < filas.length; f++) {
    const fila = filas[f];
    const parsed = filaCsvSchema.safeParse({
      codigo_contable: fila[iCodigo],
      descripcion: fila[iDesc],
      categoria: fila[iCat],
      unidad: iUnidad >= 0 ? fila[iUnidad] || "UND" : "UND",
      precio_lista: iPrecio >= 0 ? fila[iPrecio] : "0",
      stock: iStock >= 0 ? fila[iStock] : undefined,
    });
    if (!parsed.success) {
      errores.push(`Fila ${f + 1}: ${parsed.error.issues[0]?.message ?? "inválida"}`);
      continue;
    }
    const { stock, ...prod } = parsed.data;
    productos.push({ ...prod, activo: true });
    if (stock !== undefined) stocks.set(prod.codigo_contable, stock);
  }

  if (productos.length === 0) {
    return { error: "Ninguna fila válida.", errores: errores.slice(0, 10) };
  }

  const sb = createSupabaseAdminClient();
  const { data: insertados, error: errProd } = await sb
    .from("productos")
    .upsert(productos, { onConflict: "codigo_contable" })
    .select("id, codigo_contable");
  if (errProd) return { error: "Error al guardar productos.", errores: [errProd.message] };

  const filasInventario = (insertados ?? [])
    .filter((r) => stocks.has(r.codigo_contable as string))
    .map((r) => ({
      producto_id: r.id as string,
      bodega: "PRINCIPAL",
      cantidad_disponible: stocks.get(r.codigo_contable as string)!,
    }));
  if (filasInventario.length > 0) {
    const { error: errInv } = await sb
      .from("inventario")
      .upsert(filasInventario, { onConflict: "producto_id,bodega" });
    if (errInv) return { error: "Productos cargados, pero falló el inventario.", errores: [errInv.message] };
  }

  const supabase = await createSupabaseServerClient();
  await supabase.from("audit_log").insert({
    actor_id: admin.id,
    accion: "importar_inventario_csv",
    entidad: "producto",
    payload: { procesados: productos.length, errores: errores.length },
  });

  revalidatePath("/admin/inventario");
  return { ok: true, procesados: productos.length, errores: errores.slice(0, 10) };
}
