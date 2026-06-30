import type { ProductoBusqueda } from "../types";

const cop = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function StockBadge({ cantidad }: { cantidad: number }) {
  if (cantidad <= 0) {
    return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Agotado</span>;
  }
  if (cantidad <= 5) {
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
        Bajo · {cantidad}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
      {cantidad} disp.
    </span>
  );
}

export function ResultsTable({ productos }: { productos: ProductoBusqueda[] }) {
  if (productos.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-neutral-500">
        Sin resultados. Prueba por descripción o por código.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900">
          <tr>
            <th className="px-4 py-2 font-medium">Código</th>
            <th className="px-4 py-2 font-medium">Descripción</th>
            <th className="px-4 py-2 text-right font-medium">Precio</th>
            <th className="px-4 py-2 text-right font-medium">Stock</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {productos.map((p) => (
            <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
              <td className="px-4 py-2 font-mono text-neutral-600 dark:text-neutral-400">
                {p.codigo_contable}
              </td>
              <td className="px-4 py-2 text-neutral-900 dark:text-neutral-100">{p.descripcion}</td>
              <td className="px-4 py-2 text-right tabular-nums">{cop.format(p.precio_lista)}</td>
              <td className="px-4 py-2 text-right">
                <StockBadge cantidad={p.cantidad_disponible} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
