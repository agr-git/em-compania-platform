/**
 * Lógica de dominio PURA (sin I/O). La llave natural de World Office para idempotencia.
 * Ver docs/WORLD-OFFICE-INTEGRATION.md §5.
 */
export interface LlaveNaturalWO {
  prefijo: string;
  numero: string;
  idEmpresa: string;
  documentoTipo: string;
}

/**
 * Construye la idempotency_key con el orden exacto de la llave natural de WO:
 * prefijo|numero|idEmpresa|documentoTipo. Un reintento con la misma llave nunca
 * crea un pedido duplicado (WO responde DUPLICATE_KEY → éxito idempotente).
 */
export function construirIdempotencyKey(llave: LlaveNaturalWO): string {
  return [llave.prefijo, llave.numero, llave.idEmpresa, llave.documentoTipo].join("|");
}
