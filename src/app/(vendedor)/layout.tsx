import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { CarritoProvider } from "@/features/quotes/cart";
import { getCurrentProfile, rutaPorRol } from "@/lib/auth";

export default async function VendedorLayout({ children }: { children: React.ReactNode }) {
  const perfil = await getCurrentProfile();
  if (!perfil) redirect("/login");
  // Solo vendedor (y admin, con control total) operan el panel de ventas.
  if (perfil.rol !== "vendedor" && perfil.rol !== "administrador") redirect(rutaPorRol(perfil.rol));
  const usuario = `${perfil.nombre_completo} · ${perfil.rol}`;

  return (
    <CarritoProvider>
      <div className="min-h-screen">
        <AppHeader
          nav={[
            { href: "/catalogo", label: "Catálogo" },
            { href: "/cotizaciones", label: "Cotizaciones" },
            { href: "/pedidos", label: "Pedidos" },
            { href: "/cotizaciones/nueva", label: "Nueva" },
          ]}
          usuario={usuario}
        />
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </CarritoProvider>
  );
}
