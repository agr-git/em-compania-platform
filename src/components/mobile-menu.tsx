"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { NavItem } from "@/components/app-header";

export function MobileMenu({ nav, usuario }: { nav: NavItem[]; usuario: string }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    function cerrar(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", cerrar);
    document.addEventListener("touchstart", cerrar);
    return () => {
      document.removeEventListener("mousedown", cerrar);
      document.removeEventListener("touchstart", cerrar);
    };
  }, [abierto]);

  const btn =
    "rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900";

  return (
    <div ref={ref} className="relative sm:hidden">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className={`${btn} cursor-pointer active:scale-95 transition-transform`}
      >
        Menú
      </button>
      {abierto && (
        <div className="card-funky absolute right-0 z-20 mt-2 flex w-48 flex-col gap-1 p-2">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setAbierto(false)}
              className="nav-item-active rounded px-2 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {n.label}
            </Link>
          ))}
          <span className="truncate border-t border-neutral-200 px-2 pt-1.5 text-[11px] text-neutral-400">
            {usuario}
          </span>
        </div>
      )}
    </div>
  );
}
