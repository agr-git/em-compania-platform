# Roadmap de Ejecución — 1 Día (Sprint del Concurso)

> Versión comprimida del `ROADMAP.md` (que asume 2 semanas) para entregar un MVP
> **funcional, defendible y robusto en lo que importa** en ~1 jornada.
>
> **Tesis:** lo que más puntúa —el plan de integración con World Office— **ya está
> hecho** (`WORLD-OFFICE-INTEGRATION.md`). Hoy construimos el 90% funcional que lo
> respalda, manteniendo robustez **donde se ve y se juzga** y recortando lo que solo
> consume tiempo. Nada toca WO real: todo corre con `WorldOfficeMockAdapter`.

---

## Principio rector: robustez selectiva

| Se mantiene (diferencia / se juzga) | Se simplifica (no mueve la aguja hoy) |
|---|---|
| Seam puertos/adapters (mock↔real = 1 env var) | Worker/cron → outbox procesado **inline** en el server action |
| Snapshots `codigo_contable` + `descripcion` | Playwright e2e completo → 2–3 unit tests de dominio |
| `idempotency_key` (llave natural WO) | Husky / lint-staged / CI elaborado |
| RLS por rol | Gmail real → solo `NotificationMockAdapter` (escribe fila + toast) |
| Realtime en panel contable | Sync de catálogo → seed estático IA |
| Búsqueda dual (trigram + tsvector) | Motor de descuentos / PWA / voz / WhatsApp → "futuro" |
| Export del payload exacto para WO | |

**Regla:** si un recorte rompe el relato "el 90% encaja con el 10% sin tocar dominio",
no se recorta. Todo lo demás, sí.

---

## Plan por bloques (≈10 horas, comprimible)

### Bloque 0 · Setup (0:45)
- `pnpm create next-app` (App Router, TS estricto, Tailwind). shadcn/ui init.
- Proyecto Supabase Cloud (o local) + `.env.local` desde `.env.example`.
- Estructura de carpetas objetivo (`features/`, `core/ports`, `core/adapters`, `lib/`).
- `lib/container.ts` (composition root) que inyecta mock por env.
- **Entregable:** app levanta en `pnpm dev`, deploy en Vercel temprano (evita sorpresas).

### Bloque 1 · Datos + RLS + Seed IA (1:30)
- Migración SQL con las tablas de `DATA-MODEL.md` (profiles, clientes, productos,
  inventario, cotizaciones+items, pedidos+items, wo_outbox, notificaciones, audit_log).
- Índices de búsqueda: `pg_trgm` (GIN) + `tsvector` sobre `descripcion`, índice en
  `codigo_contable`.
- **RLS activo** en todas las tablas de negocio (políticas por rol del doc).
- Seed: generar `catalogo.json` con IA — **~60–90 productos** (no 300), 3 familias,
  códigos `01/02/03xxxxx`, con variedad (fracciones "7/8\"", sinónimos, stock bajo/cero).
  Validar con Zod antes de cargar.
- **Entregable:** `pnpm db:migrate && pnpm db:seed` deja catálogo navegable + RLS probado.

### Bloque 2 · Auth + 3 roles (1:00)
- Supabase Auth (email/password). `profiles.rol` = vendedor | contable | administrador.
- Login cerrado (sin signup público). Middleware que enruta por rol a su panel.
- Layouts `(vendedor)`, `(contable)`, `(admin)`. Sembrar 1 usuario de cada rol.
- **Entregable:** los 3 logins entran a su panel; un rol no ve lo del otro (RLS + guard).

### Bloque 3 · Catálogo + búsqueda dual (1:00)
- `features/catalog`: una sola query que cubre **descripción O código** (trigram + tsv +
  match exacto de código), ninguna obligatoria.
- Indicador de inventario en vivo (del mock/snapshot).
- **Entregable:** buscar "siete octavos", "7/8", "0100178" → todos encuentran el sello.

### Bloque 4 · Cotización → Pedido (2:00) ← núcleo
- `features/quotes`: armar líneas (cantidad, precio), **descuento del cliente** auto +
  editable por línea, **snapshots** congelados al insertar (`codigo_contable_snap`,
  `descripcion_snap`, `precio_unitario`).
- `features/orders`: convertir cotización → pedido:
  1. valida referencias (Zod estricto del array de renglones),
  2. persiste pedido,
  3. inserta en `wo_outbox` con `idempotency_key = prefijo|numero|idEmpresa|documentoTipo`,
  4. **procesa el outbox inline** llamando `WorldOfficePort.crearPedido()` (mock devuelve
     `wo_order_id`; reintento `DUPLICATE_KEY` = éxito idempotente).
- Botón **"Exportar payload WO"** → descarga el JSON exacto de `crearPedido` (entregable
  del checklist: "estructuras que alimentarían a World Office").
- **Entregable:** cotización con descuento → pedido `enviado_wo` con `wo_order_id` mock +
  fila en outbox con su llave única.

### Bloque 5 · Panel contable Realtime + notificación (1:15)
- `features/orders` (vista contable): todos los pedidos, **recientes primero**, filtro por
  vendedor, **Supabase Realtime** (aparecen sin recargar).
- `NotificationMockAdapter`: al crear pedido escribe fila en `notificaciones` + toast
  "correo enviado a contable" (Gmail real queda detrás del puerto, sin cablear).
- "Convertir en factura" (simulado): `contabilizar()` → `facturarElectronico()` respetando
  el orden obligatorio. Estado pasa a `facturado`.
- **Entregable:** crear pedido como vendedor → aparece en vivo en panel contable + notif.

### Bloque 6 · Panel admin (0:45)
- `features/users`: crear/eliminar (desactivar) vendedores y contables; ver todo lo creado
  por cada uno; toggle `activo`.
- `audit_log` registra crear/eliminar usuario y envío a WO.
- **Entregable:** admin da de alta un vendedor que puede loguear; ve sus pedidos.

### Bloque 7 · Pulido + entregables del concurso (1:00)
- `MANUAL-ONBOARDING.md` (no técnico, con capturas).
- 2–3 unit tests de dominio: builder de `idempotency_key` + congelado de snapshots
  (demuestra disciplina sin el costo de e2e completo).
- Pasada de `pnpm lint && pnpm typecheck`. Deploy final a Vercel.
- **Guion de demo** (abajo) + revisar checklist `CLAUDE.md §10`.

---

## Definición de "listo" (1 día)
Demo end-to-end grabable que recorre el checklist de `CLAUDE.md §10`:
login por rol → búsqueda dual con código conservado → cotización con descuento → pedido
(outbox + idempotency + export WO) → panel contable en vivo + notif → factura simulada →
admin alta/baja usuario. Build verde (`lint` + `typecheck` + unit), desplegado en Vercel.

## Guion de demo (3–4 min, lo que cuenta el video)
1. Login **vendedor** → busco "0100178" y "siete octavos" (mismo producto, búsqueda dual).
2. Armo cotización, aplico descuento del cliente, edito una línea → **snapshots congelados**.
3. Convierto en pedido → muestro `wo_outbox` con `idempotency_key` y **exporto el payload WO**.
4. Login **contable** (otra pestaña) → el pedido **apareció en vivo** + notificación.
5. "Convertir en factura" → contabiliza → factura (orden obligatorio).
6. Login **admin** → creo un vendedor, muestro auditoría.
7. Cierro abriendo `WORLD-OFFICE-INTEGRATION.md`: **"cambiar mock→real es 1 env var"**.

## Riesgos del sprint y mitigación
| Riesgo | Mitigación |
|---|---|
| RLS consume más de lo previsto | Plantillas de política por rol listas; probar con los 3 usuarios temprano |
| Realtime no engancha | Fallback: polling cada 5s detrás del mismo hook (el relato no cambia) |
| Se acaba el tiempo | Orden de corte: B7 tests → B6 admin (CRUD mínimo) → "factura simulada". Nunca cortar B4. |
| Deploy tardío rompe demo | Deploy en Bloque 0 y re-deploy por bloque, no al final |

## Lo que NO se construye hoy (pero se menciona como visión)
PWA offline, captura por voz/foto con IA, búsqueda semántica pgvector, canal WhatsApp,
motor de descuentos, panel analítico. Todos encajan en esta arquitectura sin rehacer nada
— se presentan como "extensiones naturales ya soportadas" (ver `ROADMAP.md §B`).
