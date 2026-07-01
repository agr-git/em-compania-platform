"use client";

import { useActionState } from "react";
import { importarInventarioCsv, type ImportarCsvState } from "../actions";

export function ImportarCsvForm() {
  const [state, action, pending] = useActionState<ImportarCsvState | null, FormData>(
    importarInventarioCsv,
    null,
  );

  return (
    <form action={action} className="card-funky flex flex-col gap-3 p-4">
      <input
        type="file"
        name="archivo"
        accept=".csv,text/csv"
        required
        className="text-sm file:mr-3 file:rounded-full file:border-[1.5px] file:border-brand-ink file:bg-brand-cream file:px-3 file:py-1 file:text-xs file:font-semibold"
      />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-funky px-4 py-2 text-sm">
          {pending ? "Cargando…" : "Cargar CSV"}
        </button>
        {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
        {state?.ok && (
          <span className="text-sm text-emerald-600">
            {state.procesados} producto(s) procesado(s)
            {state.errores && state.errores.length > 0 ? ` · ${state.errores.length} con error` : ""}.
          </span>
        )}
      </div>
      {state?.errores && state.errores.length > 0 && (
        <ul className="list-disc pl-5 text-xs text-amber-700">
          {state.errores.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
    </form>
  );
}
