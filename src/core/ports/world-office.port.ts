/**
 * Puerto de World Office. La lógica de negocio habla SOLO con esta interfaz.
 * El mock (concurso) y el adapter real (producción) la implementan igual.
 *
 * Nombres en dominio limpio (renglones, inventarioId, terceroId). El mapeo a los
 * nombres reales de la API (`reglones` sic, `idInventario`, `idTerceroExterno`,
 * números como string) vive SOLO en el WorldOfficeApiAdapter.
 * Ver docs/WORLD-OFFICE-INTEGRATION.md §2.6 y §3.
 */

export interface PaginacionWO {
  pagina: number; // 0-based, como la API real
  registrosPorPagina: number;
}

export interface ProductoWO {
  inventarioId: string;
  codigoContable: string;
  descripcion: string;
  unidad: string;
  precioLista: number;
}

export interface ExistenciaWO {
  inventarioId: string;
  bodega: string;
  cantidadDisponible: number;
}

export interface TipoDocumentoWO {
  codigo: string; // ej. "FV"
  nombre: string;
}

export interface RenglonWO {
  inventarioId: string; // producto en WO (NUNCA la descripción)
  unidadMedidaId: string;
  cantidad: number;
  precioUnitario: number;
  descuentoPct: number; // descuento del cliente aplicado
}

export interface CrearPedidoWO {
  idempotencyKey: string; // prefijo|numero|idEmpresa|documentoTipo
  documentoTipo: string; // de listarTiposDocumento()
  prefijo: string;
  terceroId: string; // cliente en WO
  monedaId: string;
  formaPagoId: string;
  bodegaId: string;
  centroCostoId?: string;
  renglones: RenglonWO[];
  observaciones?: string;
}

export interface ResultadoPedidoWO {
  woOrderId: string;
  numero: string;
  /** true cuando WO respondió DUPLICATE_KEY y lo tratamos como éxito idempotente. */
  idempotente: boolean;
}

export interface ResultadoFacturaWO {
  cufe: string;
  pdfUrl?: string;
}

export interface WorldOfficePort {
  // Catálogo / inventario (lectura)
  listarInventario(params: PaginacionWO): Promise<ProductoWO[]>;
  consultarExistencias(inventarioIds: string[]): Promise<ExistenciaWO[]>;

  // Referencias (se resuelven una vez y se cachean)
  listarTiposDocumento(): Promise<TipoDocumentoWO[]>;

  // Escritura (solo activa con el adapter real, en producción)
  crearPedido(input: CrearPedidoWO): Promise<ResultadoPedidoWO>;

  // Facturación (la ejecuta contabilidad)
  contabilizarDocumento(docId: string): Promise<void>;
  facturarElectronico(docId: string): Promise<ResultadoFacturaWO>;
}
