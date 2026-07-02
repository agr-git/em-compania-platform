"use client";

/** Botón para guardar la cotización como PDF (usa el diálogo de impresión del navegador). */
export function BotonImprimir() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-funky px-5 py-2.5 text-sm">
      Descargar / Imprimir PDF
    </button>
  );
}
