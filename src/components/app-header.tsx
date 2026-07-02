import Link from "next/link";
import { Brand } from "@/components/brand/logo";
import { MobileMenu } from "@/components/mobile-menu";
import { logout } from "@/features/auth/actions";

export interface NavItem {
  href: string;
  label: string;
}

export function AppHeader({
  nav,
  usuario,
  extra,
}: {
  nav: NavItem[];
  usuario: string;
  extra?: React.ReactNode;
}) {
  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Brand />
          <nav className="hidden items-center gap-4 text-sm text-neutral-600 sm:flex dark:text-neutral-400">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="nav-item-active hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {extra}
          <span className="hidden text-xs text-neutral-500 sm:inline">{usuario}</span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium hover:bg-neutral-100 active:scale-95 transition-transform dark:border-neutral-700 dark:hover:bg-neutral-900"
            >
              Salir
            </button>
          </form>

          {nav.length > 0 && <MobileMenu nav={nav} usuario={usuario} />}
        </div>
      </div>
    </header>
  );
}
