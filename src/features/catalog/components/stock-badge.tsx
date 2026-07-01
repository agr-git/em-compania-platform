/** Indicador de existencias, compartido por tabla y rejilla. */
export function StockBadge({ cantidad }: { cantidad: number }) {
  if (cantidad <= 0) {
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Agotado</span>
    );
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
