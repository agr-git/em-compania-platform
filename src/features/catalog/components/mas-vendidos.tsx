import { formatCOP } from "@/lib/format";
import { getMasVendidos } from "../queries";
import { AgregarCarrito } from "./agregar-carrito";
import { ProductoAvatar } from "./producto-avatar";

/** Rail horizontal de "los más vendidos" para acceso rápido. */
export async function MasVendidos() {
  const items = await getMasVendidos(8);
  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold tracking-tight">🔥 Los más vendidos</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {items.map((p) => (
          <div
            key={p.id}
            className="card-funky flex w-60 shrink-0 flex-col gap-2 p-3"
          >
            <div className="flex items-center justify-between">
              <ProductoAvatar categoria={p.categoria} size={36} />
              <span className="rounded-full bg-brand-primary px-2 py-0.5 text-[11px] font-semibold text-brand-primary-foreground">
                {p.vendido} vendidos
              </span>
            </div>
            <span className="font-mono text-xs text-neutral-500">{p.codigo_contable}</span>
            <p className="line-clamp-2 text-sm leading-snug text-neutral-900">{p.descripcion}</p>
            <div className="mt-auto flex items-center justify-between gap-2">
              <span className="text-sm font-semibold tabular-nums">{formatCOP(p.precio_lista)}</span>
              <AgregarCarrito
                agotado={p.cantidad_disponible <= 0}
                item={{
                  producto_id: p.id,
                  codigo: p.codigo_contable,
                  descripcion: p.descripcion,
                  precio_unitario: p.precio_lista,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
