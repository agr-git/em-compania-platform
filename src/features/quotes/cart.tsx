"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface ItemCarrito {
  producto_id: string;
  codigo: string;
  descripcion: string;
  precio_unitario: number;
  cantidad: number;
}

interface CarritoCtx {
  items: ItemCarrito[];
  tiene: (id: string) => boolean;
  cantidadDe: (id: string) => number;
  agregar: (i: Omit<ItemCarrito, "cantidad"> & { cantidad?: number }) => void;
  setCantidad: (id: string, cantidad: number) => void;
  quitar: (id: string) => void;
  limpiar: () => void;
}

const Ctx = createContext<CarritoCtx | null>(null);
const KEY = "emc_carrito";

/** Carrito de selección para cotizar desde el catálogo. Persiste en localStorage. */
export function CarritoProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let inicial: ItemCarrito[] = [];
    try {
      const raw = localStorage.getItem(KEY);
      // Carritos guardados antes de existir `cantidad` no la traen: normalizar a 1.
      if (raw)
        inicial = (JSON.parse(raw) as ItemCarrito[]).map((i) => ({
          ...i,
          cantidad: Math.max(1, Number(i.cantidad) || 1),
        }));
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación única desde localStorage al montar
    setItems(inicial);
    setListo(true);
  }, []);

  useEffect(() => {
    if (!listo) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, listo]);

  const agregar = useCallback((i: Omit<ItemCarrito, "cantidad"> & { cantidad?: number }) => {
    setItems((prev) =>
      prev.some((x) => x.producto_id === i.producto_id)
        ? prev
        : [...prev, { ...i, cantidad: Math.max(1, i.cantidad ?? 1) }],
    );
  }, []);
  const setCantidad = useCallback((id: string, cantidad: number) => {
    setItems((prev) =>
      cantidad <= 0
        ? prev.filter((x) => x.producto_id !== id)
        : prev.map((x) => (x.producto_id === id ? { ...x, cantidad: Math.floor(cantidad) } : x)),
    );
  }, []);
  const quitar = useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.producto_id !== id));
  }, []);
  const limpiar = useCallback(() => setItems([]), []);
  const tiene = useCallback((id: string) => items.some((x) => x.producto_id === id), [items]);
  const cantidadDe = useCallback(
    (id: string) => items.find((x) => x.producto_id === id)?.cantidad ?? 0,
    [items],
  );

  return (
    <Ctx.Provider value={{ items, tiene, cantidadDe, agregar, setCantidad, quitar, limpiar }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCarrito() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCarrito debe usarse dentro de CarritoProvider");
  return c;
}
