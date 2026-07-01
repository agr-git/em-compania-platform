import { AppHeader } from "@/components/app-header";
import { CarritoProvider } from "@/features/quotes/cart";
import { getCurrentProfile } from "@/lib/auth";

export default async function VendedorLayout({ children }: { children: React.ReactNode }) {
  const perfil = await getCurrentProfile();
  const usuario = perfil ? `${perfil.nombre_completo} · ${perfil.rol}` : "";

  return (
    <CarritoProvider>
      <div className="min-h-screen">
        <AppHeader
          nav={[
            { href: "/catalogo", label: "Catálogo" },
            { href: "/cotizaciones/nueva", label: "Nueva cotización" },
          ]}
          usuario={usuario}
        />
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </CarritoProvider>
  );
}
