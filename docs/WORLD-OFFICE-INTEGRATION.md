# Integración con World Office Cloud — Plan Técnico

> **Este es el documento que más pesa en la evaluación del concurso.** El reto no es
> entregar la integración ejecutándose (World Office no ofrece ambiente de pruebas
> público y no se toca la cuenta real durante el concurso), sino **demostrar que
> entendemos la API y tenemos un plan claro, profundo y viable** para conectarla.
>
> Fuentes consultadas: documentación oficial de desarrolladores de World Office
> (`developer.worldoffice.cloud`, `devapidoc.worldoffice.cloud`). Los detalles de
> autenticación, vigencia de token, prefijo de header, conceptos del modelo y códigos de
> error documentados aquí provienen de esa documentación pública.

---

## 1. Resumen ejecutivo

World Office Cloud es el ERP/contable (plan Enterprise) de E.M. Compañía. Expone una
**API REST sobre HTTPS, JSON, con token JWT**. Nuestra plataforma la usa para tres cosas:

1. **Leer inventario y catálogo** (fuente de verdad de productos y existencias).
2. **Crear el pedido** en World Office cuando el vendedor lo confirma.
3. **Permitir que contabilidad convierta el pedido en factura** (contabilización →
   facturación electrónica DIAN).

Diseñamos toda la conexión detrás de un **puerto** (`WorldOfficePort`). Durante el
concurso corre el `WorldOfficeMockAdapter`, que respeta exactamente el mismo contrato
que tendrá el adapter real. **Cambiar de mock a producción es cambiar una variable de
entorno**, no reescribir lógica. Esa es la prueba de que el 90% entregado encaja con el
10% final sin fricción.

## 2. Hechos confirmados de la API (investigación)

### 2.1 Autenticación
- Token tipo **JWT**, **vigencia 12 horas**.
- Se obtiene por el servicio **`gestionarTokenAPILicencia`** (enviando el
  `correo_electronico_registrado`) o desde la UI en *Configuración → Configuración
  General → API* (token + fecha de vencimiento, copiable al portapapeles).
- El token se incluye en el **header de cada petición con el prefijo `WO`**:
  `Authorization: WO <token>`. Si falta → **401 Unauthorized**.
- El servicio de token usa autenticación básica; el cuerpo va como `text/plain`.

> **Implicación de diseño:** necesitamos un *token manager* que cachee el JWT y lo
> **renueve antes de las 12h** (con margen, p. ej. a las 11h), con bloqueo para evitar
> renovaciones concurrentes. Ver §6.

### 2.2 Límites y transporte
- **HTTPS obligatorio.**
- **Rate limit documentado: 500 req/seg.** Holgado para nuestro volumen (3 vendedores),
  pero igual aplicamos backoff y colas (§6) por robustez.
- Las peticiones **modifican datos reales de la suscripción** → en producción toda
  escritura pasa por validación + idempotencia. Por eso en el concurso **nada escribe**.

### 2.3 Modelo de datos de la API (conceptos clave que debemos mapear)
De la documentación y su glosario de errores se confirman estos conceptos:

| Concepto WO | Qué es | Cómo lo mapeamos |
|-------------|--------|------------------|
| `idEmpresa` | ID de la empresa/licencia | Config global (env / tabla `wo_config`) |
| `documentoTipo` | Tipo de documento; se obtiene de *"Listar tipos de documentos"*. Ej.: `FV` = Factura de Venta | Pedido y Factura usan tipos distintos; se resuelven al arrancar y se cachean |
| `tercero` | Cliente/proveedor | Tabla `clientes.wo_tercero_id` |
| `inventario` (ID) | Producto en WO | `productos.wo_inventario_id` |
| `bodega` | Almacén de donde sale el stock | Config / por línea |
| `unidad de medida` | Unidad del inventario | `productos.unidad` |
| `forma de pago` | Forma de pago del documento | Config / por cliente |
| `moneda` | Moneda (COP) | Config global |
| `prefijo` | Prefijo del documento | Config por `documentoTipo` |
| `centro de costo` | Centro de costo | Config |
| `renglones` | Líneas de detalle del documento | `pedido_items` → array de renglones |
| `clasificacion` | Clasificación de inventario | Mapa de referencia |

### 2.4 Reglas de negocio confirmadas por los errores documentados
Estos códigos de error reales del glosario nos dicen exactamente qué validar **antes**
de enviar, para que el pedido entre limpio:

- `TIPO_DOCUMENTO_NO_ADMITO_API` → el `documentoTipo` debe ser válido para el proceso
  (ventas vs. compras). **Validar tipo antes de enviar.**
- `TERCERO_ERRADO` / `TERCERO_NO_ENCONTRADO` → el cliente debe existir en WO. **El
  vendedor solo escoge clientes que ya tienen `wo_tercero_id` mapeado.**
- `INVENTARIO_NO_ENCONTRADO` → cada producto debe existir en WO por su ID. **Validar
  mapeo de catálogo.**
- `BODEGA_NO_EXISTE`, `ERROR_UNIDAD_INVENTARIO`, `FORMA_PAGO_NO_SOPORTADA`,
  `ERROR_MONEDA`, `PREFIJO_FACTURA_ERRADO`, `CENTRO_COSTO_NO_EXISTE` → todos los
  catálogos de referencia (bodega, unidad, forma de pago, moneda, prefijo, centro de
  costo) deben estar **sincronizados y validados** antes de armar el documento.
- `ERROR_INGRESO_RENGLONES` / `RENGLONES_NO_ACTUALIZADO` → las líneas deben ir completas
  y correctas. **Validación Zod estricta del array de renglones.**
- `DOCUMENTO_NO_CONTABILIZADO` → **hay que contabilizar antes de facturar
  electrónicamente.** Esto define el orden del flujo de facturación (§4).
- `DUPLICATE_KEY` → se dispara cuando ya existe un documento con el mismo **número +
  prefijo + idEmpresa + documentoTipo**. **Esta es la llave natural de idempotencia**
  (§5). La usamos para que un reintento nunca cree un pedido duplicado.

> **Por qué esto suma puntos:** no estamos adivinando. El plan está anclado a la
> autenticación real, a los conceptos reales del modelo y a los errores reales que la API
> devuelve. Cada validación previa que hacemos corresponde a un error documentado que así
> evitamos.

## 3. Contrato del puerto (`WorldOfficePort`)

Toda la app habla con esta interfaz. El mock y el real la implementan igual.

```ts
// src/core/ports/world-office.port.ts
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

export interface CrearPedidoWO {
  idempotencyKey: string;          // prefijo|numero|idEmpresa|documentoTipo
  documentoTipo: string;           // de listarTiposDocumento()
  prefijo: string;
  terceroId: string;               // cliente en WO
  monedaId: string;
  formaPagoId: string;
  bodegaId: string;
  centroCostoId?: string;
  renglones: RenglonWO[];
  observaciones?: string;
}

export interface RenglonWO {
  inventarioId: string;            // producto en WO (NUNCA la descripción)
  unidadMedidaId: string;
  cantidad: number;
  precioUnitario: number;
  descuentoPct: number;            // descuento del cliente aplicado
}
```

## 4. Flujo end-to-end (cómo se ve en producción)

```
VENDEDOR                PLATAFORMA                    WORLD OFFICE CLOUD
   │  arma cotización        │                              │
   │  aplica descuento       │                              │
   │  confirma pedido ──────►│                              │
   │                         │ 1. valida (Zod + referencias)│
   │                         │ 2. escribe pedido local      │
   │                         │ 3. encola en wo_outbox       │
   │                         │    (idempotency_key)         │
   │                         │ 4. worker toma el outbox ────► crearPedido()
   │                         │                              │  (token WO válido)
   │                         │◄──── wo_order_id ────────────│
   │                         │ 5. guarda wo_order_id        │
   │                         │ 6. NotificationPort: correo ─► Gmail → CONTABLE
CONTABLE                     │                              │
   │  abre el pedido ───────►│                              │
   │  "convertir en factura"►│ contabilizarDocumento() ─────► (DOCUMENTO_NO_CONTABILIZADO si se salta)
   │                         │ facturarElectronico() ───────► factura electrónica DIAN
   │                         │◄──── XML + PDF ──────────────│
```

**Orden obligatorio en facturación:** primero **contabilizar**, luego **facturar
electrónicamente**. La API rechaza facturar un documento no contabilizado
(`DOCUMENTO_NO_CONTABILIZADO`).

## 5. Idempotencia (clave para no duplicar pedidos)

La API impone unicidad sobre `numero + prefijo + idEmpresa + documentoTipo`
(`DUPLICATE_KEY`). Aprovechamos esa misma llave:

1. Al crear el pedido generamos `idempotency_key = prefijo|numero|idEmpresa|documentoTipo`.
2. La guardamos en `wo_outbox` con restricción `UNIQUE`.
3. Si un reintento envía la misma operación y WO responde `DUPLICATE_KEY`, lo tratamos
   como **éxito idempotente** (el pedido ya existe), no como error. Consultamos el
   documento para recuperar su `wo_order_id`.

Resultado: ante cortes de red, timeouts o reintentos del worker, **nunca se crea un
pedido doble** en la contabilidad real. Esto es exactamente el tipo de robustez que el
cliente necesita para confiar la facturación a la plataforma.

## 6. Confiabilidad: token, outbox y reintentos

- **Token manager:** cachea el JWT (12h), lo renueva proactivamente a las ~11h, con lock
  para evitar renovaciones concurrentes; reintenta 1 vez ante `401`.
- **Outbox pattern:** la creación de pedidos en WO no es síncrona con el clic del
  vendedor. Se persiste en `wo_outbox` y un worker la procesa. Si WO está caído, el
  pedido **no se pierde**: queda `pending` y se reintenta.
- **Reintentos con backoff exponencial** + jitter, máximo N intentos, luego `failed` con
  `last_error` visible para el admin.
- **Clasificación de errores:** errores de validación (`TERCERO_ERRADO`, etc.) → no se
  reintentan, se marcan para corrección; errores transitorios (5xx, timeout, rate limit)
  → se reintentan.
- **Observabilidad:** cada intento se loguea con la `idempotency_key`, el código de error
  de WO y el `moreInfo` de la respuesta.

## 7. Sincronización de catálogo e inventario

- **Catálogo (productos):** la fuente de verdad es World Office. Job periódico
  (`listarInventario`) que hace *upsert* en `productos` por `wo_inventario_id`,
  conservando `codigo_contable` y `descripcion`. En el concurso este job se alimenta del
  catálogo de muestra generado con IA (ver `CATALOG-GENERATION.md`).
- **Existencias (stock):** lectura "en vivo" bajo demanda (`consultarExistencias`) al
  abrir un producto, con cache corto (p. ej. 60s) para no golpear la API en cada tecla.
  En el concurso lo simula el mock con cantidades realistas.

## 8. Qué hace el ganador en el 10% (runbook de go-live)

Documentado para que el panel de evaluación vea que sabemos exactamente qué falta:

1. Obtener de E.M. el token API (plan Enterprise) e `idEmpresa`.
2. Configurar variables de entorno de producción (base URL real de WO, credenciales).
3. Resolver y cachear `documentoTipo` reales (pedido y factura) vía *Listar tipos de
   documentos*.
4. Mapear los catálogos de referencia reales: bodegas, unidades, formas de pago, moneda,
   prefijos, centros de costo, y los `wo_tercero_id` de los clientes reales.
5. Mapear `wo_inventario_id` del catálogo real (lo hace el equipo de World Office al
   migrar de escritorio a nube, ~1 día).
6. Activar `WORLD_OFFICE_ADAPTER=real`. **No se toca código de dominio.**
7. Prueba controlada: 1 pedido real de bajo monto → verificar que entra a WO →
   contabilizar → facturar. Validar idempotencia repitiendo el envío.
8. Monitoreo del outbox las primeras 48h.

## 9. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| No hay sandbox público de WO | Mock fiel al contrato + plan detallado; el cableado real es un cambio de env |
| Token expira a media operación | Token manager con renovación proactiva y reintento ante 401 |
| Pedido duplicado por reintento | Idempotencia sobre la llave natural + `DUPLICATE_KEY` como éxito |
| Mapeo de IDs incompleto | Validación previa de todas las referencias; errores no-reintentables van a bandeja de corrección del admin |
| WO caído | Outbox: el pedido se persiste y reintenta, no se pierde |
| Cambios en la API | Todo aislado en el adapter; el dominio no se entera |

## 10. Variables de entorno relevantes

```
WORLD_OFFICE_ADAPTER=mock            # mock | real
WORLD_OFFICE_BASE_URL=               # endpoint real (producción)
WORLD_OFFICE_LICENSE_EMAIL=          # correo_electronico_registrado
WORLD_OFFICE_ID_EMPRESA=
WORLD_OFFICE_TOKEN_REFRESH_MARGIN_MIN=60
```
