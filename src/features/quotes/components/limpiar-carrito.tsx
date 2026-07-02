"use client";

import { useEffect } from "react";
import { useCarrito } from "@/features/quotes/cart";

/**
 * Vacía el carrito al montar. Se coloca en la página de la cotización YA creada:
 * así el carrito solo se limpia tras un guardado exitoso, no antes (si el
 * guardado falla, el vendedor conserva su selección).
 */
export function LimpiarCarrito() {
  const { limpiar } = useCarrito();
  useEffect(() => {
    limpiar();
  }, [limpiar]);
  return null;
}
