"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearUsuario, type CrearUsuarioState } from "../actions";

const inputCls =
  "rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-100";

export function CrearUsuarioForm() {
  const [state, action, pending] = useActionState<CrearUsuarioState | null, FormData>(
    crearUsuario,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
    >
      <h2 className="text-sm font-semibold">Crear usuario</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input name="nombre_completo" placeholder="Nombre completo" required className={inputCls} />
        <input name="email" type="email" placeholder="correo@empresa.com" required className={inputCls} />
        <input name="password" type="password" placeholder="Contraseña (mín. 8)" required className={inputCls} />
        <select name="rol" defaultValue="vendedor" className={inputCls}>
          <option value="vendedor">Vendedor</option>
          <option value="contable">Contable</option>
          <option value="administrador">Administrador</option>
        </select>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="btn-funky px-4 py-2 text-sm"
        >
          {pending ? "Creando…" : "Crear usuario"}
        </button>
        {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
        {state?.ok && <span className="text-sm text-emerald-600">Usuario creado.</span>}
      </div>
    </form>
  );
}
