"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

/** Input de búsqueda que sincroniza el término con la URL (?q=) con debounce. */
export function SearchBox({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const [pending, startTransition] = useTransition();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (value.trim()) params.set("q", value);
      else params.delete("q");
      params.delete("pagina"); // nueva búsqueda → volver a la página 1
      startTransition(() => router.replace(`${pathname}?${params.toString()}`));
    }, 250);
    return () => clearTimeout(t);
  }, [value, pathname, router, searchParams]);

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Busca por descripción o código… (ej. 'siete octavos', '7/8', 0100178)"
        className="w-full rounded-lg border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-100"
        aria-label="Buscar producto"
      />
      {pending && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
          buscando…
        </span>
      )}
    </div>
  );
}
