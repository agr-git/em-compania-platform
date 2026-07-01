"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Paginación compartida (catálogo, pedidos…). Estado en la URL (?pagina). */
export function Paginacion({
  pagina,
  porPagina,
  total,
  etiqueta = "resultados",
}: {
  pagina: number;
  porPagina: number;
  total: number;
  etiqueta?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const paginas = Math.max(1, Math.ceil(total / porPagina));
  if (paginas <= 1) return null;

  function ir(p: number) {
    const q = new URLSearchParams(searchParams);
    if (p <= 1) q.delete("pagina");
    else q.set("pagina", String(p));
    router.replace(`${pathname}?${q.toString()}`);
  }

  const btn =
    "rounded-full border-[1.5px] border-brand-ink px-3 py-1 text-xs font-semibold disabled:opacity-40";

  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-neutral-500">
        Página {pagina} de {paginas} · {total} {etiqueta}
      </span>
      <div className="flex gap-2">
        <button type="button" disabled={pagina <= 1} onClick={() => ir(pagina - 1)} className={btn}>
          Anterior
        </button>
        <button
          type="button"
          disabled={pagina >= paginas}
          onClick={() => ir(pagina + 1)}
          className={btn}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
