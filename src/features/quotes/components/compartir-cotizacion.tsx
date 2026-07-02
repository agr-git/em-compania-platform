"use client";

import { useEffect, useState } from "react";
import { formatCOP } from "@/lib/format";

/**
 * Acciones para compartir la cotización con el cliente EN EL MOMENTO:
 * enviar por WhatsApp (wa.me con mensaje prellenado + enlace público),
 * copiar el enlace, o abrir la vista imprimible/PDF. El enlace público
 * (`/c/<share_token>`) no requiere que el cliente tenga cuenta.
 */
export function CompartirCotizacion({
  shareToken,
  cliente,
  total,
}: {
  shareToken: string;
  cliente: string;
  total: number;
}) {
  const [copiado, setCopiado] = useState(false);
  // El origin solo se conoce en cliente; se resuelve tras montar para que el
  // primer render (SSR y cliente) coincida con la ruta relativa (sin hydration mismatch).
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  const rutaPublica = `/c/${shareToken}`;
  const urlPublica = origin ? `${origin}${rutaPublica}` : rutaPublica;

  const mensaje = `Hola${cliente && cliente !== "—" ? ` ${cliente}` : ""}, aquí está tu cotización de E.M. Compañía por ${formatCOP(
    total,
  )}. Puedes verla y descargarla aquí: ${urlPublica}`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(urlPublica);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles: el usuario puede copiar del campo visible.
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-brand-border bg-brand-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">Compartir con el cliente</span>
        <span className="text-[11px] text-neutral-500">enlace sin necesidad de cuenta</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white"
          style={{ background: "#25D366" }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M17.5 14.4c-.3-.2-1.7-.8-2-.9-.3-.1-.5-.2-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.5-.3zM12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2z" />
          </svg>
          Enviar por WhatsApp
        </a>
        <button
          type="button"
          onClick={copiar}
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium hover:bg-neutral-50"
        >
          {copiado ? "✓ Copiado" : "Copiar enlace"}
        </button>
        <a
          href={rutaPublica}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium hover:bg-neutral-50"
        >
          Ver / Imprimir
        </a>
      </div>
    </div>
  );
}
