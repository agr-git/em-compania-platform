"use client";

import { useCarrito, type ItemCarrito } from "@/features/quotes/cart";

/** Botón "Cotizar" en cada producto: agrega/quita del carrito de cotización. */
export function AgregarCarrito({ item }: { item: ItemCarrito }) {
  const { tiene, agregar, quitar } = useCarrito();
  const dentro = tiene(item.producto_id);

  return (
    <button
      type="button"
      onClick={() => (dentro ? quitar(item.producto_id) : agregar(item))}
      className={`rounded-full border-[1.5px] border-brand-ink px-3 py-1 text-xs font-semibold whitespace-nowrap ${
        dentro ? "bg-brand-green text-brand-cream" : "bg-brand-cream hover:bg-neutral-100"
      }`}
    >
      {dentro ? "✓ En cotización" : "+ Cotizar"}
    </button>
  );
}
