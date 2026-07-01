"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearCliente, type CrearClienteState } from "../actions";

const inputCls =
  "rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-100";

export function CrearClienteForm() {
  const [state, action, pending] = useActionState<CrearClienteState | null, FormData>(
    crearCliente,
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
      <h2 className="text-sm font-semibold">Crear cliente</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input name="nombre" placeholder="Razón social / nombre" required className={inputCls} />
        <input name="nit" placeholder="NIT (opcional)" className={inputCls} />
        <input
          name="descuento_default"
          type="number"
          min={0}
          max={100}
          step="0.01"
          defaultValue={0}
          placeholder="Descuento %"
          className={inputCls}
        />
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-funky px-4 py-2 text-sm">
          {pending ? "Creando…" : "Crear cliente"}
        </button>
        {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
        {state?.ok && <span className="text-sm text-emerald-600">Cliente creado.</span>}
      </div>
    </form>
  );
}
