"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { facturarPedido } from "@/features/orders/actions";

export function FacturarPedidoBoton({
  pedidoId,
  woOrderId,
}: {
  pedidoId: string;
  woOrderId: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ejecutar() {
    setError(null);
    setPending(true);
    (window as unknown as Record<string, number>).__facturaSuppressUntil = Date.now() + 6000;
    try {
      const res = await facturarPedido(pedidoId);
      if (res.ok) {
        router.push(`${window.location.pathname}?facturado=${woOrderId || "1"}`);
      } else {
        setError(res.error ?? "Error al facturar.");
        setPending(false);
      }
    } catch {
      setError("Error inesperado al facturar.");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={ejecutar}
        disabled={pending}
        className="btn-funky px-3 py-1.5 text-xs"
      >
        {pending ? "Facturando…" : "Convertir en factura"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

export function FacturaExitoBanner({ woOrderId }: { woOrderId: string }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
      <span className="text-sm font-semibold text-emerald-800">Factura generada exitosamente</span>
      <p className="text-xs text-emerald-700">
        Pedido <span className="font-mono">{woOrderId}</span> contabilizado y facturado en World Office.
      </p>
    </div>
  );
}
