import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { NotificacionesBell } from "@/features/orders/components/notificaciones-bell";
import { getCurrentProfile, rutaPorRol } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const perfil = await getCurrentProfile();
  if (!perfil) redirect("/login");
  if (perfil.rol !== "administrador") redirect(rutaPorRol(perfil.rol));
  const usuario = `${perfil.nombre_completo} · ${perfil.rol}`;

  return (
    <div className="min-h-screen">
      <AppHeader
        nav={[
          { href: "/admin/tablero", label: "Tablero" },
          { href: "/admin", label: "Usuarios" },
          { href: "/admin/clientes", label: "Clientes" },
          { href: "/admin/inventario", label: "Inventario" },
          { href: "/contable", label: "Pedidos" },
        ]}
        usuario={usuario}
        extra={<NotificacionesBell />}
      />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
