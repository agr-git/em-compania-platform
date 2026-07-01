import Link from "next/link";
import { facturarPedido } from "@/features/orders/actions";
import { FiltroVendedor } from "@/features/orders/components/filtro-vendedor";
import { PedidosRealtime } from "@/features/orders/components/pedidos-realtime";
import { getPedidosContable, getVendedores } from "@/features/orders/queries";
import { formatCOP } from "@/lib/format";

const ESTADO: Record<string, { texto: string; clase: string }> = {
  creado: { texto: "Creado", clase: "bg-neutral-100 text-neutral-700" },
  enviado_wo: { texto: "Enviado a WO", clase: "bg-emerald-100 text-emerald-700" },
  facturado: { texto: "Facturado", clase: "bg-blue-100 text-blue-700" },
  error: { texto: "Error", clase: "bg-red-100 text-red-700" },
};

const fechaFmt = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" });

export default async function ContablePage({
  searchParams,
}: {
  searchParams: Promise<{ vendedor?: string }>;
}) {
  const { vendedor = "" } = await searchParams;
  const [pedidos, vendedores] = await Promise.all([
    getPedidosContable(vendedor || undefined),
    getVendedores(),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <PedidosRealtime />

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">Pedidos</h1>
          <p className="text-sm text-neutral-500">
            En tiempo real · recientes primero · {pedidos.length} pedido(s)
          </p>
        </div>
        <FiltroVendedor vendedores={vendedores} actual={vendedor} />
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900">
            <tr>
              <th className="px-3 py-2 font-medium">Fecha</th>
              <th className="px-3 py-2 font-medium">Vendedor</th>
              <th className="px-3 py-2 font-medium">Cliente</th>
              <th className="px-3 py-2 font-medium">WO</th>
              <th className="px-3 py-2 text-right font-medium">Total</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 text-right font-medium">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {pedidos.map((p) => {
              const estado = ESTADO[p.estado] ?? { texto: p.estado, clase: "bg-neutral-100 text-neutral-700" };
              return (
                <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                  <td className="px-3 py-2 text-neutral-500">{fechaFmt.format(new Date(p.created_at))}</td>
                  <td className="px-3 py-2">{p.vendedor_nombre}</td>
                  <td className="px-3 py-2">{p.cliente_nombre}</td>
                  <td className="px-3 py-2 font-mono text-xs text-neutral-500">{p.wo_order_id ?? "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCOP(p.total)}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${estado.clase}`}>
                      {estado.texto}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/pedidos/${p.id}`} className="text-xs text-neutral-500 hover:underline">
                        Ver
                      </Link>
                      {p.estado === "enviado_wo" && (
                        <form action={facturarPedido.bind(null, p.id)}>
                          <button
                            type="submit"
                            className="btn-funky px-3 py-1.5 text-xs"
                          >
                            Convertir en factura
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {pedidos.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-12 text-center text-sm text-neutral-500">
                  Aún no hay pedidos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
