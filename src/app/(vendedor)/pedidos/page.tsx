import Link from "next/link";
import { Paginacion } from "@/components/paginacion";
import { getMisPedidos } from "@/features/orders/queries";
import { formatCOP } from "@/lib/format";

const POR_PAGINA = 20;
const fechaFmt = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" });

const ESTADO: Record<string, { t: string; c: string }> = {
  creado: { t: "Creado", c: "bg-neutral-100 text-neutral-700" },
  enviado_wo: { t: "Enviado a WO", c: "bg-emerald-100 text-emerald-700" },
  facturado: { t: "Facturado", c: "bg-blue-100 text-blue-700" },
  error: { t: "Error", c: "bg-red-100 text-red-700" },
};

export default async function MisPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const { pagina: paginaStr } = await searchParams;
  const pagina = Math.max(1, Number(paginaStr) || 1);
  const { pedidos, total } = await getMisPedidos(pagina, POR_PAGINA);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Mis pedidos</h1>
        <p className="text-sm text-neutral-500">{total} pedido(s) · recientes primero</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900">
            <tr>
              <th className="px-3 py-2 font-medium">Fecha</th>
              <th className="px-3 py-2 font-medium">Cliente</th>
              <th className="px-3 py-2 font-medium">WO</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 text-right font-medium">Total</th>
              <th className="px-3 py-2 text-right font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {pedidos.map((p) => {
              const e = ESTADO[p.estado] ?? { t: p.estado, c: "bg-neutral-100 text-neutral-700" };
              return (
                <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                  <td className="px-3 py-2 text-neutral-500">{fechaFmt.format(new Date(p.created_at))}</td>
                  <td className="px-3 py-2">{p.cliente_nombre}</td>
                  <td className="px-3 py-2 font-mono text-xs text-neutral-500">{p.wo_order_id ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${e.c}`}>{e.t}</span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCOP(p.total)}</td>
                  <td className="px-3 py-2 text-right">
                    <Link href={`/pedidos/${p.id}`} className="text-xs text-brand-blue hover:underline active:opacity-50 transition-opacity">
                      Ver
                    </Link>
                  </td>
                </tr>
              );
            })}
            {pedidos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-12 text-center text-sm text-neutral-500">
                  Aún no tienes pedidos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Paginacion pagina={pagina} porPagina={POR_PAGINA} total={total} etiqueta="pedidos" />
    </div>
  );
}
