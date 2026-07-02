"use client";

import { useState, useTransition } from "react";
import { convertirEnPedido } from "@/features/orders/actions";

/**
 * Botón "Convertir en pedido" con estado de envío (evita el doble clic) y
 * muestra el error de negocio (p.ej. stock insuficiente) sin romper la página.
 * El éxito redirige desde el server action.
 */
export function ConvertirPedidoBoton({ cotizacionId }: { cotizacionId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function convertir() {
    setError(null);
    startTransition(async () => {
      const res = await convertirEnPedido(cotizacionId);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button type="button" onClick={convertir} disabled={pending} className="btn-funky px-4 py-2 text-sm">
        {pending ? "Convirtiendo…" : "Convertir en pedido"}
      </button>
      {error && (
        <p role="alert" className="max-w-xs text-right text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
