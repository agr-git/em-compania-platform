"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Mantiene el panel "en vivo". Vía principal: Supabase Realtime sobre `pedidos`
 * (autenticando el socket con el token del usuario para que RLS deje pasar los
 * eventos). Fallback: un refresh ligero cada 10s por si el socket no conecta.
 * En ambos casos se hace router.refresh() → el refetch respeta RLS.
 */
export function PedidosRealtime() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) supabase.realtime.setAuth(session.access_token);

      channel = supabase
        .channel("pedidos-contable")
        .on("postgres_changes", { event: "*", schema: "public", table: "pedidos" }, () => {
          router.refresh();
        })
        .subscribe();
    })();

    // Fallback de liveness.
    const intervalo = setInterval(() => router.refresh(), 10000);

    return () => {
      clearInterval(intervalo);
      if (channel) supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
