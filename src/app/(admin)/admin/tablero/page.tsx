import { getMetricasTablero } from "@/features/analytics/queries";
import { formatCOP } from "@/lib/format";
import { branding } from "@/lib/branding";

const ESTADO_LABEL: Record<string, { texto: string; color: string }> = {
  creado: { texto: "Creado", color: "#a3a3a3" },
  enviado_wo: { texto: "En World Office", color: branding.colors.green },
  facturado: { texto: "Facturado", color: branding.colors.blue },
  error: { texto: "Error", color: "#dc2626" },
};

function KpiCard({ label, valor, sub }: { label: string; valor: string; sub?: string }) {
  return (
    <div className="card-funky flex flex-col gap-1 p-4">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{label}</span>
      <span className="text-2xl font-extrabold tracking-tight" style={{ color: branding.colors.blue }}>
        {valor}
      </span>
      {sub && <span className="text-xs text-neutral-500">{sub}</span>}
    </div>
  );
}

export default async function TableroPage() {
  const m = await getMetricasTablero();

  const conversion =
    m.cotizaciones_total > 0
      ? Math.round((m.cotizaciones_convertidas / m.cotizaciones_total) * 100)
      : 0;
  const ticket = m.pedidos_total > 0 ? m.total_vendido / m.pedidos_total : 0;

  const maxVenta = Math.max(1, ...m.ventas_por_vendedor.map((v) => v.total));
  const maxUnidades = Math.max(1, ...m.top_productos.map((t) => t.unidades));
  const totalEstados = Object.values(m.pedidos_por_estado).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Tablero</h1>
        <p className="text-sm text-neutral-500">
          El negocio de un vistazo. Datos en vivo de cotizaciones, pedidos e inventario.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Vendido" valor={formatCOP(m.total_vendido)} sub={`${m.pedidos_total} pedidos`} />
        <KpiCard label="Ticket prom." valor={formatCOP(ticket)} />
        <KpiCard
          label="Conversión"
          valor={`${conversion}%`}
          sub={`${m.cotizaciones_convertidas}/${m.cotizaciones_total} cotiz.`}
        />
        <KpiCard label="Facturados" valor={String(m.facturados)} sub={`de ${m.pedidos_total}`} />
        <KpiCard label="Cotizaciones" valor={String(m.cotizaciones_total)} />
        <KpiCard label="Clientes" valor={String(m.clientes_activos)} sub="activos" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Ventas por vendedor */}
        <section className="card-funky flex flex-col gap-4 p-5">
          <h2 className="text-sm font-semibold">Ventas por vendedor</h2>
          {m.ventas_por_vendedor.length === 0 ? (
            <p className="text-sm text-neutral-500">Sin datos.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {m.ventas_por_vendedor.map((v) => (
                <div key={v.nombre} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-neutral-800">{v.nombre}</span>
                    <span className="tabular-nums text-neutral-500">
                      {formatCOP(v.total)} · {v.pedidos} ped.
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-brand-surface">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(2, (v.total / maxVenta) * 100)}%`,
                        background: branding.colors.primary,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pedidos por estado */}
        <section className="card-funky flex flex-col gap-4 p-5">
          <h2 className="text-sm font-semibold">Pedidos por estado</h2>
          {totalEstados === 0 ? (
            <p className="text-sm text-neutral-500">Aún no hay pedidos.</p>
          ) : (
            <>
              <div className="flex h-4 overflow-hidden rounded-full">
                {Object.entries(m.pedidos_por_estado).map(([estado, n]) => {
                  const meta = ESTADO_LABEL[estado] ?? { texto: estado, color: "#a3a3a3" };
                  return (
                    <div
                      key={estado}
                      title={`${meta.texto}: ${n}`}
                      style={{ width: `${(n / totalEstados) * 100}%`, background: meta.color }}
                    />
                  );
                })}
              </div>
              <div className="flex flex-col gap-2">
                {Object.entries(m.pedidos_por_estado).map(([estado, n]) => {
                  const meta = ESTADO_LABEL[estado] ?? { texto: estado, color: "#a3a3a3" };
                  return (
                    <div key={estado} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="size-3 rounded-full" style={{ background: meta.color }} />
                        {meta.texto}
                      </span>
                      <span className="tabular-nums text-neutral-500">{n}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Productos más pedidos */}
      <section className="card-funky flex flex-col gap-4 p-5">
        <h2 className="text-sm font-semibold">Productos más pedidos</h2>
        {m.top_productos.length === 0 ? (
          <p className="text-sm text-neutral-500">Sin datos.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {m.top_productos.map((t) => (
              <div key={t.codigo} className="flex items-center gap-3">
                <span className="w-full min-w-0">
                  <span className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate text-neutral-800">
                      <span className="font-mono text-neutral-400">{t.codigo}</span> {t.descripcion}
                    </span>
                    <span className="shrink-0 tabular-nums text-neutral-500">{t.unidades} und</span>
                  </span>
                  <span className="mt-1 block h-2 overflow-hidden rounded-full bg-brand-surface">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${Math.max(3, (t.unidades / maxUnidades) * 100)}%`,
                        background: branding.colors.green,
                      }}
                    />
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
