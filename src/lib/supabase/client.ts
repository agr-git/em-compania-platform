/**
 * Cliente Supabase para el NAVEGADOR (componentes "use client").
 * Útil para suscripciones Realtime (ej. panel contable en vivo).
 */
import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/config";

export function createSupabaseBrowserClient() {
  return createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
}
