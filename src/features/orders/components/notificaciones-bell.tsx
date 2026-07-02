"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  cargarNotificaciones,
  marcarNotificacionesLeidas,
  type NotificacionItem,
} from "@/features/orders/notificaciones";
import { formatCOP } from "@/lib/format";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const fechaFmt = new Intl.DateTimeFormat("es-CO", { dateStyle: "short", timeStyle: "short" });

/**
 * Campana de notificaciones en vivo del contable/admin. Escucha `pedidos` y
 * `notificaciones` por Supabase Realtime: cuando entra un pedido nuevo, sube el
 * contador y lanza un toast. Abrir la campana marca todo como leído. La lista se
 * lee siempre del servidor (respeta RLS).
 */
export function NotificacionesBell() {
  const [items, setItems] = useState<NotificacionItem[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [abierto, setAbierto] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const conocidas = useRef<Set<string>>(new Set());
  const iniciado = useRef(false);

  const refrescar = useCallback(async (conToast: boolean) => {
    try {
      const { items, noLeidas } = await cargarNotificaciones();
      if (conToast && iniciado.current) {
        const nueva = items.find((i) => !conocidas.current.has(i.id));
        if (nueva) {
          setToast(`Nuevo pedido de ${nueva.cliente_nombre} · ${formatCOP(nueva.total)}`);
          setTimeout(() => setToast(null), 5000);
        }
      }
      conocidas.current = new Set(items.map((i) => i.id));
      iniciado.current = true;
      setItems(items);
      setNoLeidas(noLeidas);
    } catch {
      // silencioso: la campana es auxiliar
    }
  }, []);

  useEffect(() => {
    refrescar(false);

    const supabase = createSupabaseBrowserClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) supabase.realtime.setAuth(session.access_token);
      channel = supabase
        .channel("notif-contable")
        .on("postgres_changes", { event: "*", schema: "public", table: "notificaciones" }, () =>
          refrescar(true),
        )
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "pedidos" }, () =>
          refrescar(true),
        )
        .subscribe();
    })();

    // Fallback de liveness por si el socket no engancha.
    const intervalo = setInterval(() => refrescar(true), 15000);
    return () => {
      clearInterval(intervalo);
      if (channel) supabase.removeChannel(channel);
    };
  }, [refrescar]);

  async function toggle() {
    const abrir = !abierto;
    setAbierto(abrir);
    if (abrir && noLeidas > 0) {
      setNoLeidas(0);
      await marcarNotificacionesLeidas();
      setItems((prev) => prev.map((i) => ({ ...i, leida: true })));
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={`Notificaciones${noLeidas ? `: ${noLeidas} sin leer` : ""}`}
        className="relative grid size-8 place-items-center rounded-md border border-neutral-300 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {noLeidas > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid min-w-4 place-items-center rounded-full bg-brand-primary px-1 text-[10px] font-bold text-brand-primary-foreground">
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <>
          <button
            type="button"
            aria-label="Cerrar"
            className="fixed inset-0 z-20 cursor-default"
            onClick={() => setAbierto(false)}
          />
          <div className="card-funky absolute right-0 z-30 mt-2 flex w-80 max-w-[90vw] flex-col overflow-hidden">
            <div className="border-b border-brand-border bg-brand-surface px-4 py-2 text-sm font-semibold">
              Pedidos recientes
            </div>
            <ul className="max-h-96 divide-y divide-brand-border overflow-y-auto">
              {items.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-neutral-500">Sin notificaciones aún.</li>
              )}
              {items.map((n) => (
                <li key={n.id} className={n.leida ? "" : "bg-brand-primary/5"}>
                  <Link
                    href={`/pedidos/${n.pedido_id}`}
                    onClick={() => setAbierto(false)}
                    className="block px-4 py-2.5 text-sm hover:bg-neutral-50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-neutral-900">{n.cliente_nombre}</span>
                      <span className="tabular-nums text-neutral-700">{formatCOP(n.total)}</span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2 text-xs text-neutral-500">
                      <span>{n.vendedor_nombre}</span>
                      <span>{fechaFmt.format(new Date(n.created_at))}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {toast && (
        <div className="fixed right-4 top-16 z-50 flex items-center gap-2 rounded-lg border border-brand-border bg-white px-4 py-3 text-sm shadow-lg">
          <span className="grid size-6 place-items-center rounded-full bg-brand-green text-white">✓</span>
          <span className="font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
