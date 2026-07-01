import { ImportarCsvForm } from "@/features/inventory/components/importar-csv-form";
import { COLUMNAS_CSV } from "@/features/inventory/csv";

export default function InventarioPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Inventario</h1>
        <p className="text-sm text-neutral-500">
          Carga productos y existencias desde un CSV. Actualiza los existentes por código.
        </p>
      </div>

      <div className="flex flex-col gap-2 text-sm text-neutral-600 dark:text-neutral-400">
        <p>
          Columnas: <code className="font-mono text-xs">{COLUMNAS_CSV.join(", ")}</code> (
          <code className="font-mono text-xs">stock</code> es opcional).{" "}
          <a href="/api/inventario/plantilla" className="font-medium text-brand-blue underline">
            Descargar plantilla
          </a>
          .
        </p>
        <p className="text-xs text-neutral-400">
          En producción la fuente de verdad es World Office; el CSV es una carga/override manual
          (bootstrap).
        </p>
      </div>

      <ImportarCsvForm />
    </div>
  );
}
