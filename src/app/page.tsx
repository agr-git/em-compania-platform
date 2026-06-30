export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6 py-16">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium uppercase tracking-widest text-neutral-500">
          E.M. Compañía S.A.S
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
          Plataforma de Cotización y Pedidos
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Cotiza, arma pedidos y envíalos a World Office Cloud, listos para facturar.
          Acceso interno por rol: vendedor, contable y administrador.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { rol: "Vendedor", desc: "Cotiza y arma pedidos" },
          { rol: "Contable", desc: "Pedidos en vivo y facturación" },
          { rol: "Administrador", desc: "Usuarios y configuración" },
        ].map((r) => (
          <div
            key={r.rol}
            className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <h2 className="font-medium text-neutral-900 dark:text-neutral-50">{r.rol}</h2>
            <p className="text-sm text-neutral-500">{r.desc}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-neutral-400">
        Bloque 0 · scaffold listo (Next.js 16 · Supabase · arquitectura hexagonal).
      </p>
    </main>
  );
}
