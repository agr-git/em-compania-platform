import { z } from "zod";

export const crearClienteSchema = z.object({
  nombre: z.string().trim().min(2, "Nombre muy corto"),
  nit: z.string().trim().optional(),
  descuento_default: z.coerce.number().min(0, "0–100").max(100, "0–100").default(0),
});

export type CrearClienteInput = z.infer<typeof crearClienteSchema>;
