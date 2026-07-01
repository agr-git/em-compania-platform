import { Paginacion } from "@/components/paginacion";
import { BarraCarrito } from "@/features/catalog/components/barra-carrito";
import { IndiceEditorial } from "@/features/catalog/components/indice-editorial";
import { MasVendidos } from "@/features/catalog/components/mas-vendidos";
import { RejillaFichas } from "@/features/catalog/components/rejilla-fichas";
import { ResultsTable } from "@/features/catalog/components/results-table";
import { SearchBox } from "@/features/catalog/components/search-box";
import { ViewSwitcher } from "@/features/catalog/components/view-switcher";
import { buscarProductos } from "@/features/catalog/queries";

const POR_PAGINA = 24;

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; vista?: string; pagina?: string }>;
}) {
  const { q = "", vista = "tabla", pagina: paginaStr } = await searchParams;
  const pagina = Math.max(1, Number(paginaStr) || 1);
  const esIndice = vista === "indice";
  // El índice muestra todo agrupado por familia (sin paginar); el resto pagina.
  const { productos, total } = await buscarProductos(q, esIndice ? 1 : pagina, esIndice ? 500 : POR_PAGINA);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Catálogo</h1>
        <p className="text-sm text-neutral-500">
          Busca por <strong>descripción</strong> o por <strong>código</strong> — ninguna es obligatoria.
        </p>
      </div>

      {!q && <MasVendidos />}

      <SearchBox defaultValue={q} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-neutral-400">
          {total} resultado(s){q && ` · término: “${q}”`}
        </span>
        <ViewSwitcher actual={vista} />
      </div>

      {esIndice ? (
        <IndiceEditorial productos={productos} />
      ) : vista === "rejilla" ? (
        <RejillaFichas productos={productos} />
      ) : (
        <ResultsTable productos={productos} />
      )}

      {!esIndice && (
        <Paginacion pagina={pagina} porPagina={POR_PAGINA} total={total} etiqueta="productos" />
      )}

      <BarraCarrito />
    </div>
  );
}
