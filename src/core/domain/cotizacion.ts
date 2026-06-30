/**
 * Lógica de dominio PURA de cotización/pedido (sin I/O). Cálculo de líneas y totales.
 * El descuento es por línea (se inicializa con el del cliente, editable).
 */
export interface LineaCalculo {
  cantidad: number;
  precioUnitario: number;
  descuentoPct: number;
}

function redondear(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Total de una línea: cantidad × precio − descuento%. */
export function totalLinea(l: LineaCalculo): number {
  const bruto = l.cantidad * l.precioUnitario;
  const descuento = bruto * (l.descuentoPct / 100);
  return redondear(bruto - descuento);
}

export interface Totales {
  subtotal: number;
  descuento: number;
  total: number;
}

/** Totales de la cotización/pedido a partir de sus líneas. */
export function calcularTotales(lineas: LineaCalculo[]): Totales {
  const subtotal = lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0);
  const total = lineas.reduce((s, l) => s + totalLinea(l), 0);
  return {
    subtotal: redondear(subtotal),
    descuento: redondear(subtotal - total),
    total: redondear(total),
  };
}
