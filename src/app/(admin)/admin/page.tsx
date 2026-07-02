import { setUsuarioActivo } from "@/features/users/actions";
import { CrearUsuarioForm } from "@/features/users/components/crear-usuario-form";
import { getUsuarios } from "@/features/users/queries";

const ROL_CLASE: Record<string, string> = {
  vendedor: "bg-sky-100 text-sky-700",
  contable: "bg-violet-100 text-violet-700",
  administrador: "bg-amber-100 text-amber-700",
};

export default async function AdminPage() {
  const usuarios = await getUsuarios();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Usuarios</h1>
        <p className="text-sm text-neutral-500">
          Crea vendedores, contables y administradores. Desactiva sin borrar el histórico.
        </p>
      </div>

      <CrearUsuarioForm />

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900">
            <tr>
              <th className="px-3 py-2 font-medium">Nombre</th>
              <th className="px-3 py-2 font-medium">Correo</th>
              <th className="px-3 py-2 font-medium">Rol</th>
              <th className="px-3 py-2 text-right font-medium">Pedidos</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 text-right font-medium">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {usuarios.map((u) => (
              <tr key={u.id} className={u.activo ? "" : "opacity-50"}>
                <td className="px-3 py-2">{u.nombre_completo}</td>
                <td className="px-3 py-2 text-neutral-500">{u.email}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROL_CLASE[u.rol] ?? ""}`}>
                    {u.rol}
                  </span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{u.pedidos}</td>
                <td className="px-3 py-2">
                  {u.activo ? (
                    <span className="text-xs text-emerald-600">Activo</span>
                  ) : (
                    <span className="text-xs text-neutral-400">Inactivo</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <form action={setUsuarioActivo.bind(null, u.id, !u.activo)}>
                    <button
                      type="submit"
                      className="rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium hover:bg-neutral-100 active:scale-95 transition-transform dark:border-neutral-700 dark:hover:bg-neutral-900"
                    >
                      {u.activo ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
