import Link from "next/link";
import { Brand } from "@/components/brand/logo";
import { logout } from "@/features/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function VendedorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let nombre = user?.email ?? "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nombre_completo, rol")
      .eq("id", user.id)
      .single();
    if (profile) nombre = `${profile.nombre_completo} · ${profile.rol}`;
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-3 dark:border-neutral-800">
        <div className="flex items-center gap-6">
          <Brand />
          <nav className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
            <Link href="/catalogo" className="hover:text-neutral-900 dark:hover:text-neutral-100">
              Catálogo
            </Link>
            <Link href="/cotizaciones/nueva" className="hover:text-neutral-900 dark:hover:text-neutral-100">
              Nueva cotización
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-neutral-500">{nombre}</span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
            >
              Salir
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">{children}</main>
    </div>
  );
}
