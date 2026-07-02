import Link from "next/link";
import { Brand } from "@/components/brand/logo";
import { logout } from "@/features/auth/actions";

export interface NavItem {
  href: string;
  label: string;
}

/**
 * Cabecera compartida por los 3 roles. Nav visible en desktop; en móvil se
 * colapsa en un menú (<details> nativo). El nombre del usuario se oculta en
 * pantallas chicas para no desbordar.
 */
export function AppHeader({
  nav,
  usuario,
  extra,
}: {
  nav: NavItem[];
  usuario: string;
  extra?: React.ReactNode;
}) {
  const btn =
    "rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900";

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Brand />
          <nav className="hidden items-center gap-4 text-sm text-neutral-600 sm:flex dark:text-neutral-400">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="hover:text-neutral-900 dark:hover:text-neutral-100">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {extra}
          <span className="hidden text-xs text-neutral-500 sm:inline">{usuario}</span>
          <form action={logout}>
            <button type="submit" className={btn}>
              Salir
            </button>
          </form>

          {nav.length > 0 && (
            <details className="relative sm:hidden [&_summary]:list-none">
              <summary className={`${btn} cursor-pointer`}>Menú</summary>
              <div className="card-funky absolute right-0 z-20 mt-2 flex w-48 flex-col gap-1 p-2">
                {nav.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    className="rounded px-2 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    {n.label}
                  </Link>
                ))}
                <span className="truncate border-t border-neutral-200 px-2 pt-1.5 text-[11px] text-neutral-400">
                  {usuario}
                </span>
              </div>
            </details>
          )}
        </div>
      </div>
    </header>
  );
}
