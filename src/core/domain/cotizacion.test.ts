import { describe, expect, it } from "vitest";
import { calcularTotales, totalLinea } from "./cotizacion";

describe("totalLinea", () => {
  it("aplica cantidad × precio − descuento%", () => {
    expect(totalLinea({ cantidad: 2, precioUnitario: 1000, descuentoPct: 10 })).toBe(1800);
  });
  it("sin descuento devuelve el bruto", () => {
    expect(totalLinea({ cantidad: 3, precioUnitario: 500, descuentoPct: 0 })).toBe(1500);
  });
});

describe("calcularTotales", () => {
  it("suma subtotal, descuento y total de varias líneas", () => {
    const t = calcularTotales([
      { cantidad: 2, precioUnitario: 1000, descuentoPct: 10 }, // bruto 2000, total 1800
      { cantidad: 1, precioUnitario: 500, descuentoPct: 0 }, //  bruto 500,  total 500
    ]);
    expect(t).toEqual({ subtotal: 2500, descuento: 200, total: 2300 });
  });
});
