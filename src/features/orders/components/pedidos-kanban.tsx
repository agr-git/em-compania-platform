import Link from "next/link";
import { FacturarPedidoBoton } from "@/features/orders/components/facturar-pedido-boton";
import { formatCOP } from "@/lib/format";
import type { PedidoFila } from "@/features/orders/queries";

const COLUMNAS = [
  { estado: "creado", titulo: "Creado", color: "border-neutral-300 bg-neutral-50" },
  { estado: "enviado_wo", titulo: "Enviado a WO", color: "border-emerald-300 bg-emerald-50" },
  { estado: "facturado", titulo: "Facturado", color: "border-blue-300 bg-blue-50" },
  { estado: "error", titulo: "Error", color: "border-red-300 bg-red-50" },
] as const;

const fechaFmt = new Intl.DateTimeFormat("es-CO", { dateStyle: "short" });

export function PedidosKanban({ pedidos }: { pedidos: PedidoFila[] }) {
  const porEstado = new Map<string, PedidoFila[]>();
  for (const col of COLUMNAS) porEstado.set(col.estado, []);
  for (const p of pedidos) {
    const arr = porEstado.get(p.estado);
    if (arr) arr.push(p);
    else porEstado.set(p.estado, [p]);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 sm:grid sm:grid-cols-4 sm:overflow-visible">
      {COLUMNAS.map((col) => {
        const items = porEstado.get(col.estado) ?? [];
        return (
          <div key={col.estado} className="flex min-w-[260px] flex-col gap-2 sm:min-w-0">
            <div className={`flex items-center justify-between rounded-lg border px-3 py-2 ${col.color}`}>
              <span className="text-sm font-semibold">{col.titulo}</span>
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-bold tabular-nums">
                {items.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {items.length === 0 && (
                <div className="rounded-lg border border-dashed border-neutral-200 px-3 py-6 text-center text-xs text-neutral-400">
                  Sin pedidos
                </div>
              )}
              {items.map((p) => (
                <div key={p.id} className="card-funky flex flex-col gap-1.5 p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold leading-tight">{p.cliente_nombre}</span>
                    <span className="shrink-0 tabular-nums font-medium">{formatCOP(p.total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>{p.vendedor_nombre}</span>
                    <span>{fechaFmt.format(new Date(p.created_at))}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <Link
                      href={`/contable/pedidos/${p.id}`}
                      className="text-xs text-brand-blue hover:underline active:opacity-50 transition-opacity"
                    >
                      Ver detalle
                    </Link>
                    {col.estado === "enviado_wo" && (
                      <FacturarPedidoBoton pedidoId={p.id} woOrderId={p.wo_order_id ?? ""} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
