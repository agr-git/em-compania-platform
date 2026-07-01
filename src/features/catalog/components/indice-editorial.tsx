import { formatCOP } from "@/lib/format";
import { CATEGORIAS, type ProductoBusqueda } from "../types";
import { ProductoAvatar } from "./producto-avatar";
import { StockBadge } from "./stock-badge";

const ORDEN = ["sellos_mecanicos", "capacitores", "refrigeracion"];

/**
 * Vista "Índice editorial": acordeón por familia (usa <details> nativo → colapsa
 * la lista larga, ideal en móvil). Cada familia muestra su conteo y sus productos.
 */
export function IndiceEditorial({ productos }: { productos: ProductoBusqueda[] }) {
  if (productos.length === 0) {
    return <p className="py-12 text-center text-sm text-neutral-500">Sin resultados.</p>;
  }

  const porFamilia = new Map<string, ProductoBusqueda[]>();
  for (const p of productos) {
    const arr = porFamilia.get(p.categoria) ?? [];
    arr.push(p);
    porFamilia.set(p.categoria, arr);
  }
  const familias = [...porFamilia.keys()].sort(
    (a, b) => (ORDEN.indexOf(a) + 1 || 99) - (ORDEN.indexOf(b) + 1 || 99),
  );

  return (
    <div className="flex flex-col gap-3">
      {familias.map((cat, i) => {
        const meta = CATEGORIAS[cat] ?? { label: cat, corto: cat, color: "var(--brand-ink)" };
        const items = porFamilia.get(cat)!;
        return (
          <details
            key={cat}
            open={i === 0}
            className="card-funky overflow-hidden [&_summary]:list-none"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 select-none">
              <span className="flex items-center gap-3">
                <ProductoAvatar categoria={cat} size={36} />
                <span className="font-semibold" style={{ color: meta.color }}>
                  {meta.label}
                </span>
              </span>
              <span className="text-xs text-neutral-500">{items.length} productos ▾</span>
            </summary>
            <ul className="divide-y divide-neutral-200 border-t border-neutral-200">
              {items.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 bg-brand-cream px-4 py-2 text-sm"
                >
                  <span className="min-w-0">
                    <span className="font-mono text-xs text-neutral-500">{p.codigo_contable}</span>{" "}
                    <span className="text-neutral-900">{p.descripcion}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="tabular-nums">{formatCOP(p.precio_lista)}</span>
                    <StockBadge cantidad={p.cantidad_disponible} />
                  </span>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </div>
  );
}
