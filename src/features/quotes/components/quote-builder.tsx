"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { calcularTotales, totalLinea } from "@/core/domain/cotizacion";
import type { ProductoBusqueda } from "@/features/catalog/types";
import { crearClienteRapido } from "@/features/clients/actions";
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
  stock_disponible: number | null;
}

const inputCls =
  "rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900";

export function QuoteBuilder({ clientes: clientesIniciales }: { clientes: ClienteOption[] }) {
  const [clientes, setClientes] = useState(clientesIniciales);
  const [clienteId, setClienteId] = useState(clientesIniciales[0]?.id ?? "");
  const descuentoCliente = clientes.find((c) => c.id === clienteId)?.descuento_default ?? 0;
  const [descuentoGlobal, setDescuentoGlobal] = useState(descuentoCliente);

  const [lineas, setLineas] = useState<Linea[]>([]);
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<ProductoBusqueda[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Alta rápida de cliente (sin salir de la cotización).
  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(clientesIniciales.length === 0);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: "", nit: "", descuento: "0" });
  const [errorCliente, setErrorCliente] = useState<string | null>(null);
  const [creandoCliente, startCliente] = useTransition();

  // Prefill desde el carrito del catálogo (una sola vez), respetando cantidades.
  const { items: itemsCarrito } = useCarrito();
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
            cantidad: it.cantidad,
            descuento_pct: descuentoCliente,
            stock_disponible: null,
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

  function cambiarCliente(id: string) {
    setClienteId(id);
    const desc = clientes.find((c) => c.id === id)?.descuento_default ?? 0;
    setDescuentoGlobal(desc);
    setDescuentoInput(String(desc));
    setLineas((prev) => prev.map((l) => ({ ...l, descuento_pct: desc })));
  }

  const [descuentoInput, setDescuentoInput] = useState(String(descuentoCliente));

  function aplicarDescuentoGlobal(raw: string) {
    setDescuentoInput(raw);
    const num = raw === "" ? 0 : Number(raw);
    if (Number.isNaN(num)) return;
    const desc = Math.min(100, Math.max(0, num));
    setDescuentoGlobal(desc);
    setLineas((prev) => prev.map((l) => ({ ...l, descuento_pct: desc })));
  }

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
        descuento_pct: descuentoGlobal,
        stock_disponible: p.cantidad_disponible,
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

  function guardarCliente() {
    setErrorCliente(null);
    startCliente(async () => {
      const res = await crearClienteRapido({
        nombre: nuevoCliente.nombre,
        nit: nuevoCliente.nit,
        descuento_default: Number(nuevoCliente.descuento) || 0,
      });
      if (res.error || !res.cliente) {
        setErrorCliente(res.error ?? "No se pudo crear el cliente.");
        return;
      }
      const c = res.cliente;
      setClientes((prev) => [...prev, c].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setClienteId(c.id);
      setDescuentoGlobal(c.descuento_default);
      setDescuentoInput(String(c.descuento_default));
      setLineas((prev) => prev.map((l) => ({ ...l, descuento_pct: c.descuento_default })));
      setNuevoCliente({ nombre: "", nit: "", descuento: "0" });
      setMostrarNuevoCliente(false);
    });
  }

  const totales = calcularTotales(
    lineas.map((l) => ({ cantidad: l.cantidad, precioUnitario: l.precio_unitario, descuentoPct: l.descuento_pct })),
  );

  function guardar() {
    setError(null);
    startTransition(async () => {
      try {
        // El carrito NO se vacía aquí: solo se limpia al llegar a la cotización
        // creada (ver LimpiarCarrito en la página de detalle). Si el guardado
        // falla, el vendedor conserva sus líneas y puede reintentar.
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
      {/* Cliente + descuento global */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex w-full max-w-md flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">Cliente</span>
          <select
            value={clienteId}
            onChange={(e) => cambiarCliente(e.target.value)}
            className={inputCls}
          >
            {clientes.length === 0 && <option value="">— crea tu primer cliente —</option>}
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} — descuento {c.descuento_default}%
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">Descuento % (todas las líneas)</span>
          <input
            type="number"
            min={0}
            max={100}
            step="0.5"
            value={descuentoInput}
            onChange={(e) => aplicarDescuentoGlobal(e.target.value)}
            onBlur={() => setDescuentoInput(String(descuentoGlobal))}
            className={`${inputCls} w-28 text-right`}
          />
        </label>
        <button
          type="button"
          onClick={() => setMostrarNuevoCliente((v) => !v)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-100 active:scale-95 transition-transform dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          {mostrarNuevoCliente ? "Cancelar" : "+ Nuevo cliente"}
        </button>
      </div>

      {/* Alta rápida de cliente */}
      {mostrarNuevoCliente && (
        <div className="flex flex-col gap-3 rounded-lg border border-dashed border-neutral-300 p-4 dark:border-neutral-700">
          <p className="text-sm font-semibold">Nuevo cliente (queda guardado con su descuento)</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              value={nuevoCliente.nombre}
              onChange={(e) => setNuevoCliente((p) => ({ ...p, nombre: e.target.value }))}
              placeholder="Razón social / nombre"
              className={inputCls}
            />
            <input
              value={nuevoCliente.nit}
              onChange={(e) => setNuevoCliente((p) => ({ ...p, nit: e.target.value }))}
              placeholder="NIT (opcional)"
              className={inputCls}
            />
            <input
              value={nuevoCliente.descuento}
              onChange={(e) => setNuevoCliente((p) => ({ ...p, descuento: e.target.value }))}
              type="number"
              min={0}
              max={100}
              step="0.5"
              placeholder="Descuento %"
              className={inputCls}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={guardarCliente}
              disabled={creandoCliente || nuevoCliente.nombre.trim().length < 2}
              className="btn-funky px-4 py-2 text-sm disabled:opacity-50"
            >
              {creandoCliente ? "Guardando…" : "Guardar cliente"}
            </button>
            {errorCliente && <span className="text-sm text-red-600">{errorCliente}</span>}
          </div>
        </div>
      )}

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
            {resultados.map((p) => {
              const agotado = p.cantidad_disponible <= 0;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={agotado}
                    onClick={() => agregar(p)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-800"
                  >
                    <span>
                      <span className="font-mono text-xs text-neutral-500">{p.codigo_contable}</span>{" "}
                      {p.descripcion}
                    </span>
                    <span className="shrink-0 tabular-nums text-neutral-500">
                      {agotado ? "Agotado" : formatCOP(p.precio_lista)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Líneas — overflow-x-auto: en móvil la tabla se desliza, no se recorta */}
      {lineas.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full min-w-[560px] text-left text-sm">
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
              {lineas.map((l, i) => {
                const sinStock =
                  l.stock_disponible !== null && l.cantidad > l.stock_disponible;
                return (
                  <tr key={l.producto_id}>
                    <td className="px-3 py-2">
                      <span className="font-mono text-xs text-neutral-500">{l.codigo}</span> {l.descripcion}
                      {sinStock && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                          solo {l.stock_disponible} en stock
                        </span>
                      )}
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
                        className="text-xs text-red-600 hover:underline active:opacity-50 transition-opacity"
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                );
              })}
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
          disabled={pending || lineas.length === 0 || !clienteId}
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
