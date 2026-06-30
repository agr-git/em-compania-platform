import { describe, expect, it } from "vitest";
import { construirIdempotencyKey } from "./idempotency";

describe("construirIdempotencyKey", () => {
  it("arma la llave natural de WO: prefijo|numero|idEmpresa|documentoTipo", () => {
    const key = construirIdempotencyKey({
      prefijo: "PED",
      numero: "1001",
      idEmpresa: "2",
      documentoTipo: "FV",
    });
    expect(key).toBe("PED|1001|2|FV");
  });

  it("es estable: misma llave natural → misma idempotency_key", () => {
    const llave = { prefijo: "PED", numero: "7", idEmpresa: "2", documentoTipo: "FV" };
    expect(construirIdempotencyKey(llave)).toBe(construirIdempotencyKey(llave));
  });
});
