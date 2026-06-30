import "server-only";

import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/config";

/**
 * Cliente Supabase con service_role: BYPASSA RLS. Representa al "worker" del
 * sistema (procesar el outbox, marcar el pedido enviado, registrar auditoría).
 * NUNCA debe llegar al navegador. Úsalo solo en código de servidor.
 */
export function createSupabaseAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY ausente: requerido para el procesamiento del outbox.");
  }
  return createClient(publicEnv.supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
