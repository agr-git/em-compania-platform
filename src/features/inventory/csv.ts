import { z } from "zod";

/** Parser CSV mínimo pero robusto: soporta campos entre comillas con comas y comillas escapadas. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((x) => x.trim() !== ""));
}

/** Esquema de una fila del CSV de inventario (flexible con datos de cliente). */
export const filaCsvSchema = z.object({
  codigo_contable: z.string().trim().min(1),
  descripcion: z.string().trim().min(2),
  categoria: z.string().trim().min(1),
  unidad: z.string().trim().min(1).default("UND"),
  precio_lista: z.coerce.number().nonnegative(),
  stock: z.coerce.number().nonnegative().optional(),
});

export type FilaCsv = z.infer<typeof filaCsvSchema>;

export const COLUMNAS_CSV = [
  "codigo_contable",
  "descripcion",
  "categoria",
  "unidad",
  "precio_lista",
  "stock",
] as const;
