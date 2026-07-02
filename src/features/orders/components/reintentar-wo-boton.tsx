"use client";

import { useState, useTransition } from "react";
import { reintentarEnvioWO } from "@/features/orders/actions";

/** Reintenta el envío a World Office de un pedido en estado 'error'. */
export function ReintentarWOBoton({ pedidoId }: { pedidoId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function reintentar() {
    setError(null);
    startTransition(async () => {
      const res = await reintentarEnvioWO(pedidoId);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <button type="button" onClick={reintentar} disabled={pending} className="btn-funky px-3 py-1.5 text-xs">
        {pending ? "Reintentando…" : "Reintentar envío a WO"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
