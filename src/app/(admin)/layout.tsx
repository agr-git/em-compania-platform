import Link from "next/link";
import { Brand } from "@/components/brand/logo";
import { logout } from "@/features/auth/actions";
import { getCurrentProfile } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const perfil = await getCurrentProfile();
  const nombre = perfil ? `${perfil.nombre_completo} · ${perfil.rol}` : "";

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-3 dark:border-neutral-800">
        <div className="flex items-center gap-6">
          <Brand />
          <nav className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
            <Link href="/admin" className="hover:text-neutral-900 dark:hover:text-neutral-100">
              Usuarios
            </Link>
            <Link href="/contable" className="hover:text-neutral-900 dark:hover:text-neutral-100">
              Pedidos
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
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
