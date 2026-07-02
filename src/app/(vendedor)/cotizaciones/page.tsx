import Link from "next/link";
import { Paginacion } from "@/components/paginacion";
import { getMisCotizaciones } from "@/features/quotes/queries";
import { formatCOP } from "@/lib/format";

const POR_PAGINA = 20;
const fechaFmt = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" });

const ESTADO: Record<string, { t: string; c: string }> = {
  borrador: { t: "Borrador", c: "bg-neutral-100 text-neutral-700" },
  enviada: { t: "Enviada", c: "bg-amber-100 text-amber-700" },
  convertida: { t: "Convertida", c: "bg-emerald-100 text-emerald-700" },
};

export default async function MisCotizacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const { pagina: paginaStr } = await searchParams;
  const pagina = Math.max(1, Number(paginaStr) || 1);
  const { cotizaciones, total } = await getMisCotizaciones(pagina, POR_PAGINA);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Mis cotizaciones</h1>
        <p className="text-sm text-neutral-500">{total} cotización(es) · recientes primero</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900">
            <tr>
              <th className="px-3 py-2 font-medium">Fecha</th>
              <th className="px-3 py-2 font-medium">Cliente</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 text-right font-medium">Total</th>
              <th className="px-3 py-2 text-right font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {cotizaciones.map((c) => {
              const e = ESTADO[c.estado] ?? { t: c.estado, c: "bg-neutral-100 text-neutral-700" };
              return (
                <tr key={c.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                  <td className="px-3 py-2 text-neutral-500">{fechaFmt.format(new Date(c.created_at))}</td>
                  <td className="px-3 py-2">{c.cliente_nombre}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${e.c}`}>{e.t}</span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCOP(c.total)}</td>
                  <td className="px-3 py-2 text-right">
                    <Link href={`/cotizaciones/${c.id}`} className="text-xs text-brand-blue hover:underline active:opacity-50 transition-opacity">
                      Ver
                    </Link>
                  </td>
                </tr>
              );
            })}
            {cotizaciones.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-12 text-center text-sm text-neutral-500">
                  Aún no has creado cotizaciones.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Paginacion pagina={pagina} porPagina={POR_PAGINA} total={total} etiqueta="cotizaciones" />
    </div>
  );
}
