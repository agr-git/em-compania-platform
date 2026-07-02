import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { branding } from "@/lib/branding";
import { formatCOP } from "@/lib/format";
import { getCotizacionPublica } from "@/features/quotes/public";
import { BotonImprimir } from "./boton-imprimir";

export const metadata: Metadata = {
  title: `Cotización · ${branding.legalName}`,
  robots: { index: false, follow: false }, // documento privado por enlace
};

const fechaFmt = new Intl.DateTimeFormat("es-CO", { dateStyle: "long" });

export default async function CotizacionPublicaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const cot = await getCotizacionPublica(token);
  if (!cot) notFound();

  const fecha = new Date(cot.created_at);
  // Vigencia comercial de referencia: 15 días desde la emisión.
  const vence = new Date(fecha.getTime() + 15 * 24 * 60 * 60 * 1000);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12 print:py-0">
      <div className="card-funky overflow-hidden">
        {/* Encabezado de marca */}
        <div className="flex items-start justify-between gap-4 border-b border-brand-border bg-brand-surface px-6 py-5">
          <div>
            <div className="text-lg font-extrabold tracking-tight" style={{ color: branding.colors.blue }}>
              {branding.legalName}
            </div>
            <p className="mt-0.5 text-xs text-neutral-500">{branding.productName}</p>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
              Cotización
            </div>
            <div className="font-mono text-sm text-neutral-800">#{cot.numero}</div>
          </div>
        </div>

        {/* Cliente + fechas */}
        <div className="grid grid-cols-1 gap-4 px-6 py-5 text-sm sm:grid-cols-2">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Cliente</div>
            <div className="font-medium text-neutral-900">{cot.cliente.nombre}</div>
            {cot.cliente.nit && <div className="text-neutral-500">NIT {cot.cliente.nit}</div>}
          </div>
          <div className="sm:text-right">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Emitida</div>
            <div className="text-neutral-900">{fechaFmt.format(fecha)}</div>
            <div className="mt-1 text-xs text-neutral-500">Válida hasta {fechaFmt.format(vence)}</div>
          </div>
        </div>

        {/* Líneas */}
        <div className="overflow-x-auto border-t border-brand-border">
          <table className="w-full min-w-[440px] text-left text-sm">
            <thead className="bg-brand-surface text-[11px] uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-6 py-2 font-medium">Descripción</th>
                <th className="px-3 py-2 text-right font-medium">Cant.</th>
                <th className="px-3 py-2 text-right font-medium">Precio</th>
                <th className="px-3 py-2 text-right font-medium">Desc.</th>
                <th className="px-6 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {cot.items.map((i, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-2.5">
                    <div className="text-neutral-900">{i.descripcion}</div>
                    <div className="font-mono text-[11px] text-neutral-400">{i.codigo}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{i.cantidad}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatCOP(i.precio_unitario)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-neutral-500">
                    {i.descuento_pct > 0 ? `${i.descuento_pct}%` : "—"}
                  </td>
                  <td className="px-6 py-2.5 text-right font-medium tabular-nums">{formatCOP(i.total_linea)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="flex flex-col items-end gap-1 border-t border-brand-border px-6 py-5 text-sm">
          <div className="flex w-56 justify-between text-neutral-500">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatCOP(cot.subtotal)}</span>
          </div>
          <div className="flex w-56 justify-between text-neutral-500">
            <span>Descuento</span>
            <span className="tabular-nums">−{formatCOP(cot.subtotal - cot.total)}</span>
          </div>
          <div
            className="mt-1 flex w-56 justify-between border-t border-brand-border pt-2 text-base font-bold"
            style={{ color: branding.colors.blue }}
          >
            <span>Total</span>
            <span className="tabular-nums">{formatCOP(cot.total)}</span>
          </div>
        </div>

        {/* Pie */}
        <div className="border-t border-brand-border bg-brand-surface px-6 py-4 text-xs text-neutral-500">
          <p>
            Atendido por <span className="font-medium text-neutral-700">{cot.vendedor.nombre}</span>. Este es un
            documento de cotización, no una factura. Precios en pesos colombianos (COP), sujetos a disponibilidad
            de inventario.
          </p>
        </div>
      </div>

      <div className="mt-5 flex justify-center print:hidden">
        <BotonImprimir />
      </div>
    </main>
  );
}
