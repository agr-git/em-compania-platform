/**
 * Seed del catálogo de muestra (IA) → tablas `productos` + `inventario`.
 * Ver docs/CATALOG-GENERATION.md. Usa el service_role (bypassa RLS).
 *
 * - Sin credenciales en el entorno → DRY-RUN: valida el catálogo y reporta, sin escribir.
 * - Con credenciales → upsert idempotente (onConflict por codigo_contable).
 *
 * Ejecutar: `pnpm db:seed`  (carga .env.local si existe).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// Carga .env.local si la runtime lo soporta (Node 20.12+/23). No falla si no existe.
(process as unknown as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(".env.local");

const __dirname = dirname(fileURLToPath(import.meta.url));

const productoSchema = z.object({
  codigo_contable: z.string().regex(/^0[123]\d{5}$/, "código fuera del esquema 01/02/03xxxxx"),
  descripcion: z.string().min(5),
  categoria: z.enum(["sellos_mecanicos", "capacitores", "refrigeracion"]),
  unidad: z.string().min(1),
  precio_lista: z.number().positive(),
});

const catalogoSchema = z.array(productoSchema).min(1);

function cargarCatalogo() {
  const raw = readFileSync(join(__dirname, "catalogo.json"), "utf8");
  const catalogo = catalogoSchema.parse(JSON.parse(raw));

  const codigos = new Set<string>();
  for (const p of catalogo) {
    if (codigos.has(p.codigo_contable)) {
      throw new Error(`código duplicado en el catálogo: ${p.codigo_contable}`);
    }
    codigos.add(p.codigo_contable);
  }
  return catalogo;
}

/** Stock determinista (sin azar): algunos agotados y bajos para lucir el indicador. */
function stockPara(index: number): number {
  if (index % 9 === 0) return 0; // agotado
  if (index % 5 === 0) return 4; // bajo
  return 30;
}

async function main() {
  const catalogo = cargarCatalogo();
  const porFamilia = catalogo.reduce<Record<string, number>>((acc, p) => {
    acc[p.categoria] = (acc[p.categoria] ?? 0) + 1;
    return acc;
  }, {});
  console.info(`[db:seed] catálogo válido: ${catalogo.length} productos`, porFamilia);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey || url.includes("example.supabase.co")) {
    console.info(
      "[db:seed] DRY-RUN: faltan credenciales reales (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY). " +
        "Catálogo validado pero NO escrito. Completa .env.local y vuelve a correr.",
    );
    return;
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const filasProducto = catalogo.map((p) => ({ ...p, activo: true }));
  const { data: insertados, error: errProd } = await supabase
    .from("productos")
    .upsert(filasProducto, { onConflict: "codigo_contable" })
    .select("id, codigo_contable");
  if (errProd) throw errProd;

  const idPorCodigo = new Map(insertados!.map((r) => [r.codigo_contable, r.id]));
  const filasInventario = catalogo.map((p, i) => ({
    producto_id: idPorCodigo.get(p.codigo_contable)!,
    bodega: "PRINCIPAL",
    cantidad_disponible: stockPara(i),
  }));
  const { error: errInv } = await supabase
    .from("inventario")
    .upsert(filasInventario, { onConflict: "producto_id,bodega" });
  if (errInv) throw errInv;

  console.info(`[db:seed] OK: ${insertados!.length} productos + existencias cargados.`);
}

main().catch((err) => {
  console.error("[db:seed] error:", err);
  process.exit(1);
});
