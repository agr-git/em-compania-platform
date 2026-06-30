import { z } from "zod";

export const crearUsuarioSchema = z.object({
  nombre_completo: z.string().min(2, "Nombre muy corto"),
  email: z.string().email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  rol: z.enum(["vendedor", "contable", "administrador"]),
});

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;
