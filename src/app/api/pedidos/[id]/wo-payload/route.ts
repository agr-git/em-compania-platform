import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Descarga el payload exacto que se enviaría a World Office (crearPedido).
 * Entregable del concurso: "estructuras que alimentarían a World Office".
 * Verifica propiedad con la sesión del usuario (RLS) y lee el payload del
 * outbox con service_role (el vendedor no tiene SELECT sobre wo_outbox).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("No autorizado", { status: 401 });

  // RLS: el usuario solo ve un pedido si es suyo (vendedor) o si es contable/admin.
  const { data: pedido } = await supabase.from("pedidos").select("id").eq("id", id).maybeSingle();
  if (!pedido) return new NextResponse("No encontrado", { status: 404 });

  const admin = createSupabaseAdminClient();
  const { data: outbox } = await admin.from("wo_outbox").select("payload").eq("pedido_id", id).maybeSingle();
  if (!outbox) return new NextResponse("Sin payload", { status: 404 });

  return new NextResponse(JSON.stringify(outbox.payload, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="wo-pedido-${id}.json"`,
    },
  });
}
