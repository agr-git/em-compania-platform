import { redirect } from "next/navigation";
import { getCurrentProfile, rutaPorRol } from "@/lib/auth";

// La raíz enruta según el rol (el proxy ya redirige a /login si no hay sesión).
export default async function Home() {
  const perfil = await getCurrentProfile();
  redirect(perfil ? rutaPorRol(perfil.rol) : "/login");
}
