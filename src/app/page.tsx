import { redirect } from "next/navigation";

// El acceso es por rol tras login; la raíz lleva al catálogo (el middleware
// redirige a /login si no hay sesión).
export default function Home() {
  redirect("/catalogo");
}
