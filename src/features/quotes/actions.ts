"use server";

import { redirect } from "next/navigation";
import { calcularTotales, totalLinea } from "@/core/domain/cotizacion";
import { buscarProductos } from "@/features/catalog/queries";
import type { ProductoBusqueda } from "@/features/catalog/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { crearCotizacionSchema, type CrearCotizacionInput } from "./schema";

/** Búsqueda de productos para el armador de cotización (reutiliza el catálogo). */
export async function buscarProductosAction(q: string): Promise<ProductoBusqueda[]> {
  const { productos } = await buscarProductos(q, 1, 8);
  return productos;
}

export async function crearCotizacion(input: CrearCotizacionInput) {
  const parsed = crearCotizacionSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Snapshots congelados desde la BD: jamás se confía en el cliente para precio/código.
  const ids = parsed.lineas.map((l) => l.producto_id);
  const { data: productos, error: errProd } = await supabase
    .from("productos")
    .select("id, codigo_contable, descripcion, precio_lista")
    .in("id", ids);
  if (errProd) throw errProd;
  const porId = new Map((productos ?? []).map((p) => [p.id as string, p]));

  const items = parsed.lineas.map((l) => {
    const p = porId.get(l.producto_id);
    if (!p) throw new Error(`Producto no encontrado: ${l.producto_id}`);
    const precio = Number(p.precio_lista);
    return {
      producto_id: l.producto_id,
      codigo_contable_snap: p.codigo_contable as string,
      descripcion_snap: p.descripcion as string,
      cantidad: l.cantidad,
      precio_unitario: precio,
      descuento_pct: l.descuento_pct,
      total_linea: totalLinea({ cantidad: l.cantidad, precioUnitario: precio, descuentoPct: l.descuento_pct }),
    };
  });

  const totales = calcularTotales(
    items.map((i) => ({ cantidad: i.cantidad, precioUnitario: i.precio_unitario, descuentoPct: i.descuento_pct })),
  );

  const { data: cot, error: errCot } = await supabase
    .from("cotizaciones")
    .insert({
      vendedor_id: user.id,
      cliente_id: parsed.cliente_id,
      estado: "enviada",
      subtotal: totales.subtotal,
      total: totales.total,
    })
    .select("id")
    .single();
  if (errCot) throw errCot;

  const { error: errItems } = await supabase
    .from("cotizacion_items")
    .insert(items.map((i) => ({ ...i, cotizacion_id: cot.id })));
  if (errItems) throw errItems;

  redirect(`/cotizaciones/${cot.id}`);
}
