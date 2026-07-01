import { setClienteActivo } from "@/features/clients/actions";
import { CrearClienteForm } from "@/features/clients/components/crear-cliente-form";
import { getClientesAdmin } from "@/features/clients/queries";

export default async function ClientesPage() {
  const clientes = await getClientesAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Clientes</h1>
        <p className="text-sm text-neutral-500">
          Crea clientes con su descuento por defecto. El vendedor los elige al cotizar.
        </p>
      </div>

      <CrearClienteForm />

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900">
            <tr>
              <th className="px-3 py-2 font-medium">Nombre</th>
              <th className="px-3 py-2 font-medium">NIT</th>
              <th className="px-3 py-2 text-right font-medium">Descuento</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 text-right font-medium">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {clientes.map((c) => (
              <tr key={c.id} className={c.activo ? "" : "opacity-50"}>
                <td className="px-3 py-2">{c.nombre}</td>
                <td className="px-3 py-2 text-neutral-500">{c.nit ?? "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums">{c.descuento_default}%</td>
                <td className="px-3 py-2">
                  {c.activo ? (
                    <span className="text-xs text-emerald-600">Activo</span>
                  ) : (
                    <span className="text-xs text-neutral-400">Inactivo</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <form action={setClienteActivo.bind(null, c.id, !c.activo)}>
                    <button
                      type="submit"
                      className="rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
                    >
                      {c.activo ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-12 text-center text-sm text-neutral-500">
                  Aún no hay clientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
