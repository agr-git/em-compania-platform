import { QuoteBuilder } from "@/features/quotes/components/quote-builder";
import { getClientes } from "@/features/quotes/queries";

export default async function NuevaCotizacionPage() {
  const clientes = await getClientes();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Nueva cotización</h1>
        <p className="text-sm text-neutral-500">
          Elige el cliente, agrega productos y ajusta cantidades y descuento por línea.
        </p>
      </div>
      <QuoteBuilder clientes={clientes} />
    </div>
  );
}
