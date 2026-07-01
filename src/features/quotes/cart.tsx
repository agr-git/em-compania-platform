"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface ItemCarrito {
  producto_id: string;
  codigo: string;
  descripcion: string;
  precio_unitario: number;
}

interface CarritoCtx {
  items: ItemCarrito[];
  tiene: (id: string) => boolean;
  agregar: (i: ItemCarrito) => void;
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
      if (raw) inicial = JSON.parse(raw) as ItemCarrito[];
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación única desde localStorage al montar
    setItems(inicial);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- marca de "listo" tras hidratar
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

  const agregar = useCallback((i: ItemCarrito) => {
    setItems((prev) => (prev.some((x) => x.producto_id === i.producto_id) ? prev : [...prev, i]));
  }, []);
  const quitar = useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.producto_id !== id));
  }, []);
  const limpiar = useCallback(() => setItems([]), []);
  const tiene = useCallback((id: string) => items.some((x) => x.producto_id === id), [items]);

  return <Ctx.Provider value={{ items, tiene, agregar, quitar, limpiar }}>{children}</Ctx.Provider>;
}

export function useCarrito() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCarrito debe usarse dentro de CarritoProvider");
  return c;
}
