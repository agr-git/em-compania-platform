"use client";

import { useCarrito, type ItemCarrito } from "@/features/quotes/cart";

/**
 * Botón "Cotizar" en cada producto. Una vez agregado se vuelve un stepper
 * −/+ para fijar la cantidad ahí mismo, sin ir a la pestaña de cotización.
 * Bajar a 0 lo quita del carrito. Bloqueado si está agotado.
 */
export function AgregarCarrito({
  item,
  agotado = false,
}: {
  item: Omit<ItemCarrito, "cantidad">;
  agotado?: boolean;
}) {
  const { tiene, cantidadDe, agregar, setCantidad } = useCarrito();
  const dentro = tiene(item.producto_id);
  const cantidad = cantidadDe(item.producto_id);

  if (agotado) {
    return (
      <span className="cursor-not-allowed rounded-full border-[1.5px] border-neutral-300 px-3 py-1 text-xs font-semibold whitespace-nowrap text-neutral-400">
        Agotado
      </span>
    );
  }

  if (!dentro) {
    return (
      <button
        type="button"
        onClick={() => agregar(item)}
        className="rounded-full border-[1.5px] border-brand-ink bg-brand-cream px-3 py-1 text-xs font-semibold whitespace-nowrap hover:bg-neutral-100"
      >
        + Cotizar
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border-[1.5px] border-brand-ink bg-brand-green px-1 py-0.5 text-brand-cream">
      <button
        type="button"
        aria-label="Restar una unidad"
        onClick={() => setCantidad(item.producto_id, cantidad - 1)}
        className="grid size-6 place-items-center rounded-full text-sm font-bold hover:bg-black/10"
      >
        −
      </button>
      <input
        type="number"
        min={1}
        aria-label="Cantidad a cotizar"
        value={cantidad}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v) && v >= 1) setCantidad(item.producto_id, v);
        }}
        className="w-9 [appearance:textfield] bg-transparent text-center text-xs font-bold tabular-nums outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label="Sumar una unidad"
        onClick={() => setCantidad(item.producto_id, cantidad + 1)}
        className="grid size-6 place-items-center rounded-full text-sm font-bold hover:bg-black/10"
      >
        +
      </button>
    </span>
  );
}
