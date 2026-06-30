/**
 * WorldOfficeMockAdapter — el ÚNICO adapter activo durante el concurso.
 * Respeta exactamente el contrato de WorldOfficePort. Nada escribe en WO real.
 * El paso de mock → real es cambiar WORLD_OFFICE_ADAPTER en el composition root.
 */
import type {
  CrearPedidoWO,
  ExistenciaWO,
  PaginacionWO,
  ProductoWO,
  ResultadoFacturaWO,
  ResultadoPedidoWO,
  TipoDocumentoWO,
  WorldOfficePort,
} from "@/core/ports/world-office.port";

export class WorldOfficeMockAdapter implements WorldOfficePort {
  // Llave natural → woOrderId, para simular la idempotencia real (DUPLICATE_KEY).
  private readonly pedidosCreados = new Map<string, string>();

  async listarInventario(_params: PaginacionWO): Promise<ProductoWO[]> {
    // En el concurso el catálogo lo provee el seed IA (ver CATALOG-GENERATION.md);
    // este mock solo cumple el contrato.
    return [];
  }

  async consultarExistencias(inventarioIds: string[]): Promise<ExistenciaWO[]> {
    // Existencias simuladas y deterministas (sin aleatoriedad) por id.
    return inventarioIds.map((inventarioId) => ({
      inventarioId,
      bodega: "PRINCIPAL",
      cantidadDisponible: 25,
    }));
  }

  async listarTiposDocumento(): Promise<TipoDocumentoWO[]> {
    return [
      { codigo: "FV", nombre: "Factura de Venta" },
      { codigo: "PD", nombre: "Pedido" },
    ];
  }

  async crearPedido(input: CrearPedidoWO): Promise<ResultadoPedidoWO> {
    const existente = this.pedidosCreados.get(input.idempotencyKey);
    if (existente) {
      // Simula DUPLICATE_KEY tratado como éxito idempotente (§5 del doc WO).
      return { woOrderId: existente, numero: existente, idempotente: true };
    }
    const numero = `MOCK-${this.pedidosCreados.size + 1}`;
    this.pedidosCreados.set(input.idempotencyKey, numero);
    return { woOrderId: numero, numero, idempotente: false };
  }

  async contabilizarDocumento(_docId: string): Promise<void> {
    // No-op: en producción es POST /contabilizarDocumento/{id} antes de facturar.
  }

  async facturarElectronico(docId: string): Promise<ResultadoFacturaWO> {
    return { cufe: `MOCK-CUFE-${docId}` };
  }
}
