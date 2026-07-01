import Link from "next/link";
import { notFound } from "next/navigation";
import { convertirEnPedido } from "@/features/orders/actions";
import { getCotizacion } from "@/features/quotes/queries";
import { formatCOP } from "@/lib/format";

export default async function CotizacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cot = await getCotizacion(id);
  if (!cot) notFound();

  const convertir = convertirEnPedido.bind(null, id);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">Cotización</h1>
          <p className="text-sm text-neutral-500">
            Cliente: <strong>{cot.cliente_nombre}</strong> · estado: {cot.estado}
          </p>
        </div>
        {cot.pedido ? (
          <Link
            href={`/pedidos/${cot.pedido.id}`}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Ver pedido →
          </Link>
        ) : (
          <form action={convertir}>
            <button
              type="submit"
              className="btn-funky px-4 py-2 text-sm"
            >
              Convertir en pedido
            </button>
          </form>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900">
            <tr>
              <th className="px-3 py-2 font-medium">Código</th>
              <th className="px-3 py-2 font-medium">Descripción</th>
              <th className="px-3 py-2 text-right font-medium">Cant.</th>
              <th className="px-3 py-2 text-right font-medium">Precio</th>
              <th className="px-3 py-2 text-right font-medium">Desc.%</th>
              <th className="px-3 py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {cot.items.map((i) => (
              <tr key={i.id}>
                <td className="px-3 py-2 font-mono text-neutral-600 dark:text-neutral-400">
                  {i.codigo_contable_snap}
                </td>
                <td className="px-3 py-2">{i.descripcion_snap}</td>
                <td className="px-3 py-2 text-right tabular-nums">{i.cantidad}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCOP(i.precio_unitario)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{i.descuento_pct}%</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCOP(i.total_linea)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="self-end text-right text-sm">
        <div className="text-neutral-500">Subtotal: {formatCOP(cot.subtotal)}</div>
        <div className="text-base font-semibold">Total: {formatCOP(cot.total)}</div>
      </div>
    </div>
  );
}
