import { AppHeader } from "@/components/app-header";
import { getCurrentProfile } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const perfil = await getCurrentProfile();
  const usuario = perfil ? `${perfil.nombre_completo} · ${perfil.rol}` : "";

  return (
    <div className="min-h-screen">
      <AppHeader
        nav={[
          { href: "/admin", label: "Usuarios" },
          { href: "/admin/clientes", label: "Clientes" },
          { href: "/admin/inventario", label: "Inventario" },
          { href: "/contable", label: "Pedidos" },
        ]}
        usuario={usuario}
      />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
