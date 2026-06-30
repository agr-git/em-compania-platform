# Arquitectura

## Estilo: Hexagonal (Ports & Adapters), por features

La regla de oro: **la lógica de negocio no conoce el mundo exterior**. No sabe que existe
World Office ni Gmail. Habla con **puertos** (interfaces). En el arranque se le inyecta un
**adapter** concreto según el entorno.

```
┌───────────────────────────────────────────────────────────┐
│  app/ (Next.js)  ──  UI por rol: vendedor · contable · admin │
└───────────────────────────────────────────────────────────┘
                │ server actions / route handlers
                ▼
┌───────────────────────────────────────────────────────────┐
│  features/  ──  casos de uso (crear cotización, pasar a      │
│                 pedido, convertir en factura, gestionar      │
│                 usuarios…)                                    │
└───────────────────────────────────────────────────────────┘
                │ depende de interfaces, no de implementaciones
                ▼
┌───────────────────────────────────────────────────────────┐
│  core/ports/   WorldOfficePort · NotificationPort           │
│  core/domain/  entidades y reglas puras (sin I/O)           │
└───────────────────────────────────────────────────────────┘
                │ se inyecta en runtime
                ▼
┌───────────────────────────────────────────────────────────┐
│  core/adapters/                                             │
│   ├─ WorldOfficeMockAdapter   (concurso, activo)           │
│   ├─ WorldOfficeApiAdapter    (producción, lo cablea el     │
│   │                            ganador)                      │
│   ├─ NotificationMockAdapter                                │
│   └─ GmailNotificationAdapter                               │
│   + SupabaseRepositories (datos)                            │
└───────────────────────────────────────────────────────────┘
```

## Por qué esto importa para el concurso

El concurso pide entregar al **90%** y deja el **10%** (conexión real con World Office)
para el ganador. La arquitectura hexagonal convierte ese 10% en **cambiar una variable de
entorno** (`WORLD_OFFICE_ADAPTER=mock → real`) sin tocar el dominio ni la UI. Eso
demuestra que lo entregado y lo pendiente encajan de verdad.

## Reglas de dependencia

1. `app/` → puede usar `features/`.
2. `features/` → puede usar `core/ports`, `core/domain`, `lib/`. **Nunca** importa un
   adapter concreto directamente.
3. `core/domain/` → **puro**. Sin I/O, sin Supabase, sin fetch. Solo reglas y tipos.
4. `core/adapters/` → implementa puertos. Es el único lugar que conoce Supabase, World
   Office o Gmail.
5. La inyección de adapters ocurre en un único *composition root* (`lib/container.ts`),
   decidiendo mock vs. real por entorno.

## Patrones aplicados

- **Outbox** para la creación de pedidos en World Office (no se pierde un pedido si WO
  está caído). Ver `WORLD-OFFICE-INTEGRATION.md`.
- **Idempotencia** sobre la llave natural de WO.
- **Snapshots** en las líneas de cotización/pedido: se congela `codigo_contable`,
  `descripcion` y `precio_unitario` al momento de crear, para que el documento sea fiel
  aunque el catálogo cambie luego.
- **RLS** como frontera de seguridad real (no solo chequeos en la app).
- **Realtime** para el panel contable.

## Flujo de datos: de cotización a factura

1. Vendedor busca producto (por descripción **o** código) → `features/catalog`.
2. Arma cotización con cantidades y descuento del cliente → `features/quotes`
   (snapshots de código/descr./precio por línea).
3. Convierte en pedido → `features/orders`:
   - valida referencias (Zod + catálogos),
   - persiste el pedido,
   - encola en `wo_outbox` con `idempotency_key`.
4. Worker procesa el outbox → `WorldOfficePort.crearPedido()`.
5. Al confirmarse → `NotificationPort.enviar()` correo al contable.
6. Contable abre el pedido → `contabilizar()` → `facturarElectronico()`.

## Manejo de errores

- **Validación (Zod)** en cada borde antes de tocar dominio.
- Errores de WO **no transitorios** (cliente/producto/referencia errada) → no se
  reintentan; van a una bandeja de corrección visible para el admin.
- Errores **transitorios** (red, 5xx, rate limit) → reintento con backoff.
- Todo error se loguea estructurado con `idempotency_key` y `moreInfo` de la API.

## Seguridad

- RLS por rol en todas las tablas de negocio.
- Server Actions validan rol antes de ejecutar.
- Secretos solo en env. El token de WO nunca llega al cliente; vive en el servidor.
- Auditoría: `audit_log` registra acciones sensibles (crear/eliminar usuarios, enviar
  pedido a WO, facturar).
