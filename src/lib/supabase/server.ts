/**
 * Cliente Supabase para el SERVIDOR (Server Components, Server Actions, route handlers).
 * Respeta RLS según la sesión del usuario. Las lecturas/escrituras de negocio van por aquí.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/lib/config";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Invocado desde un Server Component: el middleware refresca la sesión.
        }
      },
    },
  });
}
