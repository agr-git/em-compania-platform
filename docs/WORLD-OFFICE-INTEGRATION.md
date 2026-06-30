# Integración con World Office Cloud — Plan Técnico

> **Este es el documento que más pesa en la evaluación del concurso.** El reto no es
> entregar la integración ejecutándose (World Office no ofrece ambiente de pruebas
> público y no se toca la cuenta real durante el concurso), sino **demostrar que
> entendemos la API y tenemos un plan claro, profundo y viable** para conectarla.
>
> Fuentes consultadas (verificadas): portal oficial `developer.worldoffice.cloud`
> (© 2026), portal espejo `devapidoc.worldoffice.cloud`, su **Swagger UI**
> (`devapidoc.worldoffice.cloud/documentacion.html`, OpenAPI 3.0) y la página oficial de
> *Implementaciones* (ejemplos de código reales). Autenticación, endpoints, paginación,
> formato de payload y catálogo de errores provienen de esas fuentes.
>
> **Nivel de confianza:** los paths, el catálogo de errores y el ejemplo de payload están
> confirmados. Lo marcado *"a confirmar en go-live"* no es verificable públicamente porque
> el OpenAPI crudo (`/v3/api-docs`) está protegido (Azure 401) y algunos bodies de respuesta
> se publican solo como imágenes o tras autenticación. Base URL de producción real:
> **`https://api.worldoffice.cloud`** (el host de la doc Swagger, `wo-backend-dev.azurewebsites.net`,
> es el entorno de desarrollo).

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
- Token tipo **JWT**, **vigencia 12 horas** (confirmado en la doc: *"tendrá una vigencia de
  12 horas"*).
- Se obtiene por **`POST gestionarTokenAPILicencia`** con un body que incluye
  `correo_electronico_registrado` y `Content-Type: text/plain` (autenticación básica), o
  desde la UI en *Configuración → Configuración General → API*.
- Respuesta exitosa: **200 OK** con el JWT en el cuerpo. Errores del servicio de token:
  **400** (datos faltantes/incorrectos), **500** (interno), `TIPO_USUARIO_NO_VALIDO` (la
  licencia no permite token vía API).
- El token se incluye en el **header de cada petición con el prefijo `WO `** (con espacio):
  `Authorization: WO <token>`. Si falta → **401 Unauthorized**.
- **Un solo token activo por cuenta de servicio:** se revoca y se regenera; no hay endpoint
  de *refresh* documentado (el modelo es regenerar al expirar). La fecha de vencimiento del
  token **no puede superar la de la licencia**.
- La API está disponible **solo en la edición Enterprise** de World Office Cloud.

> **Implicación de diseño:** necesitamos un *token manager* que cachee el JWT y lo
> **renueve antes de las 12h** (con margen, p. ej. a las 11h), con bloqueo para evitar
> renovaciones concurrentes. Ver §6.

### 2.2 Límites y transporte
- **HTTPS obligatorio.**
- **Rate limit documentado: 500 req/seg** (FAQ del portal nuevo `developer.worldoffice.cloud`).
  Holgado para nuestro volumen (3 vendedores), pero igual aplicamos backoff y colas (§6) por
  robustez. ⚠️ La cifra solo aparece en el portal nuevo; el espejo aún muestra un placeholder
  → **reconfirmar con soporte en go-live** (500/seg es alto para un ERP y podría ser un techo
  de marketing más que un límite por cuenta).
- **Límite de borrado masivo: 5 registros por petición** (`MAXIMO_ALCANZADO` si se excede).
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

**Glosario completo de referencia** (del catálogo oficial, para la bandeja de corrección del
admin y la clasificación reintentable/no-reintentable del worker):

| Código | Significado | Acción |
|---|---|---|
| `EMPRESA_ERRADA` | `idEmpresa` no registrado | Validar con `listarEmpresas` · no reintentar |
| `TERCERO_ERRADO` / `TERCERO_NO_ENCONTRADO` | Cliente inexistente en WO | Mapear `wo_tercero_id` · no reintentar |
| `DIRRECCION_TERCERO_EXTERNO_ERRADO` (sic) | Falta dirección del tercero | Registrar dirección · no reintentar |
| `INVENTARIO_NO_ENCONTRADO` | `idInventario` inexistente | Validar mapeo de catálogo · no reintentar |
| `BODEGA_NO_EXISTE` | Bodega no registrada | Validar `idBodega` · no reintentar |
| `ERROR_UNIDAD_INVENTARIO` | Unidad no registrada | Validar `listarUnidadMedida` · no reintentar |
| `FORMA_PAGO_NO_SOPORTADA` | Forma de pago no registrada | Validar `listarFormaPagoDocumento` · no reintentar |
| `ERROR_MONEDA` | Moneda no registrada | Validar `listarMonedas` · no reintentar |
| `PREFIJO_FACTURA_ERRADO` | Prefijo no registrado | Validar `listarPrefijoDocumento` · no reintentar |
| `CENTRO_COSTO_NO_EXISTE` | Centro de costo no registrado | Validar `listarCentroCosto` · no reintentar |
| `ERROR_CLASIFICACION` | Clasificación no registrada | Validar mapa de clasificación · no reintentar |
| `TIPO_DOCUMENTO_NO_ADMITO_API` | `documentoTipo` inválido para la operación | Resolver tipo correcto · no reintentar |
| `ERROR_INGRESO_RENGLONES` / `RENGLONES_NO_ACTUALIZADO` | Renglón mal/incompleto | Validación Zod del array · no reintentar |
| `FECHA_ERRADA` | Fecha mal formateada | Formato `yyyy-MM-dd` · no reintentar |
| `DOCUMENTO_NO_CONTABILIZADO` | Falta contabilizar antes de facturar | Ejecutar `contabilizarDocumento` primero (§F) |
| `ERROR_DOCUMENTO_ELECTRONICO` | Tipo no elegible para FE | Validar tipo · no reintentar |
| `ERROR_FACTURACION_ELECTRONICA` | Fallo genérico de transmisión FE | Revisar `moreInfo` · evaluar reintento |
| `DUPLICATE_KEY` | Documento con misma `numero+prefijo+idEmpresa+documentoTipo` | **Éxito idempotente** (§5) |
| `MAXIMO_ALCANZADO` | Borrado masivo > 5 registros | Enviar ≤5 ids |
| HTTP `401` / `500` | Token ausente o error interno | `401`→renovar token y reintentar 1 vez · `500`→backoff |

> **Por qué esto suma puntos:** no estamos adivinando. El plan está anclado a la
> autenticación real, a los endpoints y conceptos reales del modelo y a los errores reales
> que la API devuelve. Cada validación previa que hacemos corresponde a un error documentado
> que así evitamos.

### 2.5 Catálogo de endpoints REST confirmados

Base URL producción: **`https://api.worldoffice.cloud`** · todo bajo `/api/v1/`. Extraído del
Swagger oficial. Los `listar*` son **POST** (reciben body de paginación/filtros, ver §2.7).

| Operación | Método | Path | Para qué en nuestro flujo |
|---|---|---|---|
| Generar token | POST | `gestionarTokenAPILicencia` | Auth (§2.1) |
| Listar tipos de documento | POST | `/api/v1/documentosTipos/listarTipoDocumento` | Resolver `documentoTipo` (FV, etc.) |
| Listar prefijos | POST | `/api/v1/documentosTipos/listarPrefijoDocumento` | Resolver `prefijo` |
| Listar inventarios | POST | `/api/v1/inventarios/listarInventarios` | Sync de catálogo |
| Inventario por código | GET | `/api/v1/inventarios/consultaCodigo/{codigo}` | Mapear `codigo_contable → idInventario` |
| Inventario por ID | GET | `/api/v1/inventarios/consultaId/{id}` | Validar producto |
| Existencias (empresa/bodega) | GET | `/api/v1/inventarios/{id}/existencias/empresa-bodega` | Stock en vivo |
| Listar bodegas | POST | `/api/v1/bodegas/listarBodega` | Catálogo de referencia |
| Listar terceros | POST | `/api/v1/terceros/listarTerceros` | Mapear clientes |
| Tercero por identificación | GET | `/api/v1/terceros/identificacion/{identificacion}` | Resolver `wo_tercero_id` por NIT |
| **Crear documento de venta** | POST | `/api/v1/documentos/crearDocumentoVenta` | **Crear el pedido (§4)** |
| Editar documento de venta | PUT | `/api/v1/documentos/editarDocumentoVenta` | Correcciones |
| Consultar documento por ID | GET | `/api/v1/documentos/getDocumentoId/{id}` | Recuperar `wo_order_id` (idempotencia §5) |
| **Contabilizar documento** | POST | `/api/v1/documentos/contabilizarDocumento/{id}` | Paso obligatorio antes de FE (§F) |
| **Facturar electrónicamente** | POST | `/api/v1/documentos/facturaElectronica/{id}` | Emisión DIAN |
| Consultar CUFE | GET | `/api/v1/documentos/cufe/{documentoId}` | CUFE de la factura |
| Visualizar PDF | GET | `/api/v1/documentos/visualizarDocumento/{id}` | Representación gráfica |
| Enviar por email | GET | `/api/v1/documentos/enviaDocumentoMail/{id}/{email}/{nombre}` | Envío al cliente |
| **Catálogos de referencia** | POST | `/api/v1/unidadesDeMedida/listarUnidadMedida` · `/api/v1/monedas/listarMonedas` · `/api/v1/formasDePago/listarFormaPagoDocumento` · `/api/v1/empresas/listarEmpresas` · `/api/v1/centrosDeCosto/listarCentroCosto` | Resolver IDs antes de armar el documento |

> El dominio de la API cubre mucho más (compras, contabilidad, salida de almacén, módulos de
> **salud** y **FE-RIPS/Ministerio**, importación masiva asíncrona). Para E.M. solo usamos el
> subconjunto de ventas + catálogos de arriba.

### 2.6 Ejemplo real de payload + mapeo al puerto

Body real de `crearDocumentoVenta` (de la doc oficial de Implementaciones). **Ojo a las
particularidades**, que el `WorldOfficeApiAdapter` debe respetar:

```json
{
  "fecha": "2023-07-15",
  "prefijo": 1,
  "documentoTipo": "FV",
  "idEmpresa": 2,
  "idTerceroExterno": 2946,
  "idTerceroInterno": 3664,
  "idFormaPago": 5,
  "idMoneda": 31,
  "trm": "1",
  "porcentajeDescuento": true,
  "valDescuento": 0,
  "reglones": [
    { "idInventario": 4517, "unidadMedida": "doc", "cantidad": "2",
      "valorUnitario": "1000", "idBodega": 1, "porDescuento": 0, "concepto": "..." }
  ]
}
```

- El array de líneas se llama literalmente **`reglones`** (sic, no `renglones`).
- Cantidades y valores van como **strings** (`"cantidad":"2"`, `"valorUnitario":"1000"`).
- El cliente es **`idTerceroExterno`**; el vendedor/responsable es **`idTerceroInterno`** (dos
  terceros distintos).
- Fechas en **`yyyy-MM-dd`**. Para crear se omiten los `id`; para editar se incluyen.

> **Decisión de diseño:** nuestro `WorldOfficePort` (§3) mantiene nombres limpios de dominio
> (`renglones`, `inventarioId`, `terceroId`). El **mapeo a los nombres reales de la API**
> (`reglones`, `idInventario`, `idTerceroExterno`, números como string) vive **solo en el
> `WorldOfficeApiAdapter`**. El dominio no conoce esas rarezas — esa es justo la ventaja del
> patrón puerto/adapter. (Ver tabla de mapeo en el runbook de go-live, §8.)

### 2.7 Paginación y filtros (endpoints `listar*`)

Los `listar*` reciben un body como este (confirmado con ejemplos reales):

```json
{
  "columnaOrdenar": "id",
  "pagina": 0,                 // 0-based
  "registrosPorPagina": 50,
  "orden": "ASC",              // ASC | DESC
  "filtros": [
    { "atributo": "documentoTipo.codigoDocumento", "valor": "FV",
      "tipoFiltro": 0, "operador": 0, "subGrupo": "filtro" }
  ],
  "canal": 0
}
```

`pagina` es **0-based**; `atributo` admite rutas de propiedad anidadas. Lo usamos en el job de
sync de catálogo (§7) iterando páginas hasta agotar resultados.

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

**Mapeo método del puerto → endpoint real:**

| Método `WorldOfficePort` | Endpoint World Office |
|---|---|
| `crearPedido()` | `POST /api/v1/documentos/crearDocumentoVenta` |
| `contabilizarDocumento(id)` | `POST /api/v1/documentos/contabilizarDocumento/{id}` |
| `facturarElectronico(id)` | `POST /api/v1/documentos/facturaElectronica/{id}` → CUFE vía `GET /cufe/{id}` |
| `listarInventario()` | `POST /api/v1/inventarios/listarInventarios` |
| `consultarExistencias()` | `GET /api/v1/inventarios/{id}/existencias/empresa-bodega` |
| `listarTiposDocumento()` | `POST /api/v1/documentosTipos/listarTipoDocumento` |

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

**Pendientes a confirmar en go-live** (no verificables públicamente; el OpenAPI crudo está
protegido y algunos bodies se publican solo como imágenes):
- JSON literal de **respuesta** de `crearDocumentoVenta` (campos `idDocumento`/`numero`/
  `estado`) → para guardar `wo_order_id`.
- Estructura de la respuesta de **facturación electrónica** (`ResultadoFEPojo` /
  `RespuestaEnvioDto`): si incluye XML firmado, estado de aceptación/rechazo DIAN.
- Path exacto y host del servicio de **token** en producción (la doc usa un placeholder).
- Precisión/separador decimal de los campos numéricos enviados como string.
- La cifra real de **rate limit** por cuenta (reconfirmar el 500 req/seg).

Estos puntos no bloquean el 90%: el contrato del puerto ya los aísla y el `WorldOfficeApiAdapter`
se ajusta sin tocar dominio cuando se confirmen.

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
