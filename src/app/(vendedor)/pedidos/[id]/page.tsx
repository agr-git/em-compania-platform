import { notFound } from "next/navigation";
import { getPedido } from "@/features/orders/queries";
import { formatCOP } from "@/lib/format";

const ESTADO_LABEL: Record<string, { texto: string; clase: string }> = {
  creado: { texto: "Creado", clase: "bg-neutral-100 text-neutral-700" },
  enviado_wo: { texto: "Enviado a World Office", clase: "bg-emerald-100 text-emerald-700" },
  facturado: { texto: "Facturado", clase: "bg-blue-100 text-blue-700" },
  error: { texto: "Error", clase: "bg-red-100 text-red-700" },
};

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pedido = await getPedido(id);
  if (!pedido) notFound();

  const estado = ESTADO_LABEL[pedido.estado] ?? { texto: pedido.estado, clase: "bg-neutral-100 text-neutral-700" };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">Pedido</h1>
          <p className="text-sm text-neutral-500">
            Cliente: <strong>{pedido.cliente_nombre}</strong>
          </p>
        </div>
        <a
          href={`/api/pedidos/${pedido.id}/wo-payload`}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Exportar payload WO ↓
        </a>
      </div>

      <div className="flex flex-wrap gap-6 rounded-lg border border-neutral-200 p-4 text-sm dark:border-neutral-800">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">Estado</div>
          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${estado.clase}`}>
            {estado.texto}
          </span>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">ID en World Office</div>
          <div className="mt-1 font-mono">{pedido.wo_order_id ?? "—"}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">Total</div>
          <div className="mt-1 font-semibold">{formatCOP(pedido.total)}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900">
            <tr>
              <th className="px-3 py-2 font-medium">Código</th>
              <th className="px-3 py-2 font-medium">Descripción</th>
              <th className="px-3 py-2 text-right font-medium">Cant.</th>
              <th className="px-3 py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {pedido.items.map((i) => (
              <tr key={i.id}>
                <td className="px-3 py-2 font-mono text-neutral-600 dark:text-neutral-400">
                  {i.codigo_contable_snap}
                </td>
                <td className="px-3 py-2">{i.descripcion_snap}</td>
                <td className="px-3 py-2 text-right tabular-nums">{i.cantidad}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCOP(i.total_linea)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
