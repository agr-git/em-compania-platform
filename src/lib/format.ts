const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/** Formatea un número como pesos colombianos (sin decimales). */
export function formatCOP(value: number): string {
  return copFormatter.format(value);
}
