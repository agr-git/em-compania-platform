import { ResultsTable } from "@/features/catalog/components/results-table";
import { SearchBox } from "@/features/catalog/components/search-box";
import { buscarProductos } from "@/features/catalog/queries";

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const productos = await buscarProductos(q);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Catálogo</h1>
        <p className="text-sm text-neutral-500">
          Busca por <strong>descripción</strong> o por <strong>código</strong> — ninguna es obligatoria.
        </p>
      </div>

      <SearchBox defaultValue={q} />

      <div className="flex items-center justify-between text-xs text-neutral-400">
        <span>{productos.length} resultado(s)</span>
        {q && <span>término: “{q}”</span>}
      </div>

      <ResultsTable productos={productos} />
    </div>
  );
}
