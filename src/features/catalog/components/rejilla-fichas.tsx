import { formatCOP } from "@/lib/format";
import { CATEGORIAS, type ProductoBusqueda } from "../types";
import { AgregarCarrito } from "./agregar-carrito";
import { ProductoAvatar } from "./producto-avatar";
import { StockBadge } from "./stock-badge";

/** Vista "Rejilla de fichas": tablero de tarjetas con viñeta por familia. */
export function RejillaFichas({ productos }: { productos: ProductoBusqueda[] }) {
  if (productos.length === 0) {
    return <p className="py-12 text-center text-sm text-neutral-500">Sin resultados.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {productos.map((p) => {
        const cat = CATEGORIAS[p.categoria];
        return (
          <div
            key={p.id}
            className="flex flex-col gap-3 rounded-2xl border-[1.5px] border-brand-ink bg-brand-cream p-4 shadow-[3px_3px_0_var(--brand-ink)] transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-3">
              <ProductoAvatar categoria={p.categoria} />
              <StockBadge cantidad={p.cantidad_disponible} />
            </div>
            <div className="flex flex-col gap-1">
              {cat && (
                <span
                  className="text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: cat.color }}
                >
                  {cat.corto}
                </span>
              )}
              <span className="font-mono text-xs text-neutral-500">{p.codigo_contable}</span>
              <p className="text-sm font-medium leading-snug text-neutral-900">{p.descripcion}</p>
            </div>
            <div className="mt-auto flex items-center justify-between gap-2">
              <span className="text-base font-semibold tabular-nums">{formatCOP(p.precio_lista)}</span>
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
        );
      })}
    </div>
  );
}
