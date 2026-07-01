"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { calcularTotales, totalLinea } from "@/core/domain/cotizacion";
import type { ProductoBusqueda } from "@/features/catalog/types";
import { formatCOP } from "@/lib/format";
import { useCarrito } from "@/features/quotes/cart";
import { buscarProductosAction, crearCotizacion } from "../actions";
import type { ClienteOption } from "../queries";

interface Linea {
  producto_id: string;
  codigo: string;
  descripcion: string;
  precio_unitario: number;
  cantidad: number;
  descuento_pct: number;
}

export function QuoteBuilder({ clientes }: { clientes: ClienteOption[] }) {
  const [clienteId, setClienteId] = useState(clientes[0]?.id ?? "");
  const descuentoCliente = clientes.find((c) => c.id === clienteId)?.descuento_default ?? 0;

  const [lineas, setLineas] = useState<Linea[]>([]);
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<ProductoBusqueda[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Prefill desde el carrito del catálogo (una sola vez).
  const { items: itemsCarrito, limpiar } = useCarrito();
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || itemsCarrito.length === 0) return;
    prefilled.current = true;
    setLineas((prev) =>
      prev.length > 0
        ? prev
        : itemsCarrito.map((it) => ({
            producto_id: it.producto_id,
            codigo: it.codigo,
            descripcion: it.descripcion,
            precio_unitario: it.precio_unitario,
            cantidad: 1,
            descuento_pct: descuentoCliente,
          })),
    );
  }, [itemsCarrito, descuentoCliente]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q.trim()) {
        setResultados([]);
        return;
      }
      const r = await buscarProductosAction(q);
      setResultados(r.slice(0, 6));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  function agregar(p: ProductoBusqueda) {
    if (lineas.some((l) => l.producto_id === p.id)) return;
    setLineas((prev) => [
      ...prev,
      {
        producto_id: p.id,
        codigo: p.codigo_contable,
        descripcion: p.descripcion,
        precio_unitario: p.precio_lista,
        cantidad: 1,
        descuento_pct: descuentoCliente,
      },
    ]);
    setQ("");
    setResultados([]);
  }

  function actualizar(i: number, campo: "cantidad" | "descuento_pct", valor: number) {
    setLineas((prev) => prev.map((l, idx) => (idx === i ? { ...l, [campo]: valor } : l)));
  }

  function eliminar(i: number) {
    setLineas((prev) => prev.filter((_, idx) => idx !== i));
  }

  const totales = calcularTotales(
    lineas.map((l) => ({ cantidad: l.cantidad, precioUnitario: l.precio_unitario, descuentoPct: l.descuento_pct })),
  );

  function guardar() {
    setError(null);
    startTransition(async () => {
      try {
        limpiar(); // vaciar el carrito: la cotización queda persistida al redirigir
        await crearCotizacion({
          cliente_id: clienteId,
          lineas: lineas.map((l) => ({
            producto_id: l.producto_id,
            cantidad: l.cantidad,
            descuento_pct: l.descuento_pct,
          })),
        });
      } catch {
        setError("No se pudo guardar la cotización. Revisa los datos.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Cliente */}
      <label className="flex max-w-md flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-700 dark:text-neutral-300">Cliente</span>
        <select
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
        >
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre} — descuento {c.descuento_default}%
            </option>
          ))}
        </select>
      </label>

      {/* Buscador de productos */}
      <div className="relative max-w-xl">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Agrega productos: busca por descripción o código…"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
        />
        {resultados.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
            {resultados.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => agregar(p)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <span>
                    <span className="font-mono text-xs text-neutral-500">{p.codigo_contable}</span>{" "}
                    {p.descripcion}
                  </span>
                  <span className="shrink-0 tabular-nums text-neutral-500">{formatCOP(p.precio_lista)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Líneas */}
      {lineas.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900">
              <tr>
                <th className="px-3 py-2 font-medium">Producto</th>
                <th className="px-3 py-2 text-right font-medium">Precio</th>
                <th className="px-3 py-2 text-right font-medium">Cant.</th>
                <th className="px-3 py-2 text-right font-medium">Desc.%</th>
                <th className="px-3 py-2 text-right font-medium">Total</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {lineas.map((l, i) => (
                <tr key={l.producto_id}>
                  <td className="px-3 py-2">
                    <span className="font-mono text-xs text-neutral-500">{l.codigo}</span> {l.descripcion}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCOP(l.precio_unitario)}</td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      min={1}
                      value={l.cantidad}
                      onChange={(e) => actualizar(i, "cantidad", Math.max(1, Number(e.target.value)))}
                      className="w-16 rounded border border-neutral-300 px-2 py-1 text-right dark:border-neutral-700 dark:bg-neutral-900"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={l.descuento_pct}
                      onChange={(e) =>
                        actualizar(i, "descuento_pct", Math.min(100, Math.max(0, Number(e.target.value))))
                      }
                      className="w-16 rounded border border-neutral-300 px-2 py-1 text-right dark:border-neutral-700 dark:bg-neutral-900"
                    />
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatCOP(
                      totalLinea({
                        cantidad: l.cantidad,
                        precioUnitario: l.precio_unitario,
                        descuentoPct: l.descuento_pct,
                      }),
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => eliminar(i)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-neutral-500">Aún no has agregado productos.</p>
      )}

      {/* Totales + guardar */}
      <div className="flex items-end justify-between">
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          <div>Subtotal: {formatCOP(totales.subtotal)}</div>
          <div>Descuento: −{formatCOP(totales.descuento)}</div>
          <div className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Total: {formatCOP(totales.total)}
          </div>
        </div>
        <button
          type="button"
          onClick={guardar}
          disabled={pending || lineas.length === 0}
          className="btn-funky px-5 py-2.5"
        >
          {pending ? "Guardando…" : "Guardar cotización"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
