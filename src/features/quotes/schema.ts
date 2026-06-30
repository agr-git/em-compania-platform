import { z } from "zod";

export const lineaInputSchema = z.object({
  producto_id: z.string().uuid(),
  cantidad: z.number().positive().max(100000),
  descuento_pct: z.number().min(0).max(100),
});

export const crearCotizacionSchema = z.object({
  cliente_id: z.string().uuid(),
  lineas: z.array(lineaInputSchema).min(1, "Agrega al menos un producto"),
});

export type LineaInput = z.infer<typeof lineaInputSchema>;
export type CrearCotizacionInput = z.infer<typeof crearCotizacionSchema>;
