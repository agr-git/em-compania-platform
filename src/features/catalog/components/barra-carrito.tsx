"use client";

import Link from "next/link";
import { useCarrito } from "@/features/quotes/cart";

/** Barra flotante que aparece al seleccionar productos → crear cotización. */
export function BarraCarrito() {
  const { items, limpiar } = useCarrito();
  if (items.length === 0) return null;

  return (
    <div className="card-funky fixed inset-x-0 bottom-4 z-30 mx-auto flex w-[min(92%,640px)] items-center justify-between gap-3 px-4 py-3">
      <span className="text-sm font-semibold">
        {items.length} producto{items.length !== 1 ? "s" : ""} en la cotización
      </span>
      <div className="flex items-center gap-3">
        <button type="button" onClick={limpiar} className="text-xs text-neutral-500 hover:underline">
          Vaciar
        </button>
        <Link href="/cotizaciones/nueva" className="btn-funky px-4 py-1.5 text-xs">
          Crear cotización →
        </Link>
      </div>
    </div>
  );
}
