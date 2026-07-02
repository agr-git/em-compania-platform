# Sesión de trabajo — E.M. Compañía Platform

**Fecha:** 2026-07-01 / 2026-07-02
**Objetivo:** Auditoría + 3 fixes solicitados + 3 features diferenciadoras para el concurso Aztec

---

## Credenciales de los 3 perfiles

| Rol | Email | Contraseña | Ruta de entrada |
|-----|-------|------------|-----------------|
| **Vendedor** | `vendedor@emcompania.test` | `Demo1234!` | `/catalogo` |
| **Contable** | `contable@emcompania.test` | `Demo1234!` | `/contable` |
| **Administrador** | `admin@emcompania.test` | `Demo1234!` | `/admin` |

> Usuario QA temporal (vendedor): `qa.claude@emcompania.test` / `QaClaude2026!`
> Usuario inactivo (desactivado desde admin): `juan@emcompania.test`

---

## 3 Fixes solicitados por el usuario

### 1. Crear cliente nuevo desde el quote builder
**Antes:** solo se podía crear un cliente desde el panel de administración.
**Ahora:** el vendedor puede crear un cliente rápido (nombre + descuento) directamente desde el formulario de nueva cotización, con un collapsible `+ Nuevo cliente`. El descuento del nuevo cliente se aplica automáticamente a todas las líneas.

**Archivos:**
- `src/features/quotes/components/quote-builder.tsx` — formulario collapsible
- `src/features/clients/actions.ts` — `crearClienteRapido` server action
- `src/lib/auth.ts` — `requireRol()` para autorización granular
- `supabase/migrations/20260701120000_clientes_vendedor_insert.sql` — RLS para INSERT vendedor

### 2. Editar cantidad inline al agregar producto al carrito
**Antes:** agregar un producto siempre ponía cantidad=1; para cambiar había que ir al tab de cotización.
**Ahora:** stepper −/+/input numérico directamente en el catálogo. Se puede editar la cantidad desde cualquier vista (tabla, rejilla, índice editorial). Poner cantidad en 0 elimina el producto.

**Archivos:**
- `src/features/quotes/cart.tsx` — `cantidad` en `ItemCarrito`, `setCantidad()`, `cantidadDe()`
- `src/features/catalog/components/agregar-carrito.tsx` — stepper pill con −/input/+
- `src/features/catalog/components/barra-carrito.tsx` — muestra total de unidades
- `src/features/catalog/components/indice-editorial.tsx` — botón stepper agregado al índice

### 3. Fix scroll horizontal en tablas de cotización/pedidos
**Antes:** `overflow-hidden` cortaba el contenido en pantallas angostas.
**Ahora:** `overflow-x-auto` con `min-w-[560px]` permite scroll horizontal nativo.

**Archivos:**
- `src/features/quotes/components/quote-builder.tsx` — wrapper de tabla
- `src/app/(vendedor)/pedidos/[id]/page.tsx` — tabla de ítems del pedido

---

## 3 Features diferenciadoras (más allá de lo requerido)

### A. Cotización compartible por WhatsApp + enlace público
El vendedor puede compartir la cotización con el cliente por WhatsApp (mensaje prellenado con total y enlace), copiar el enlace, o abrir la vista imprimible. El enlace público (`/c/<share_token>`) no requiere login — el cliente ve la cotización con branding de E.M. Compañía, los ítems, totales y puede imprimir/descargar PDF.

**Archivos:**
- `src/features/quotes/components/compartir-cotizacion.tsx` — botones WhatsApp/copiar/ver
- `src/app/c/[token]/page.tsx` — página pública con layout branded
- `src/app/c/[token]/boton-imprimir.tsx` — botón `window.print()`
- `src/features/quotes/public.ts` — query al RPC `cotizacion_publica`
- `src/lib/supabase/middleware.ts` — `/c/` en rutas públicas
- `supabase/migrations/20260701130000_qa3_features.sql` — `share_token`, RPC security definer

### B. Centro de notificaciones en vivo (campana)
Contable y administrador ven una campana en el header con badge de notificaciones no leídas. Se actualiza en tiempo real via Supabase Realtime — cuando un vendedor convierte una cotización en pedido, la campana se enciende y aparece un toast. El dropdown muestra los pedidos recientes con cliente, vendedor y total.

**Archivos:**
- `src/features/orders/components/notificaciones-bell.tsx` — campana + dropdown + Realtime
- `src/features/orders/notificaciones.ts` — server actions `cargarNotificaciones`, `marcarNotificacionesLeidas`
- `src/components/app-header.tsx` — prop `extra` para inyectar la campana
- `src/app/(contable)/layout.tsx` — integración de campana
- `src/app/(admin)/layout.tsx` — integración de campana
- `supabase/migrations/20260701130000_qa3_features.sql` — `leida_at`, UPDATE policy
- `supabase/migrations/20260701140000_realtime_notificaciones.sql` — publicación Realtime

### C. Tablero analítico del administrador
Dashboard con 6 KPIs (total vendido, ticket promedio, tasa de conversión, pedidos facturados, cotizaciones totales, clientes activos), gráfico de ventas por vendedor, pedidos por estado, y top productos más vendidos. Todo calculado via un RPC `metricas_tablero` con security definer que valida `es_admin()`.

**Archivos:**
- `src/app/(admin)/admin/tablero/page.tsx` — dashboard completo con cards y gráficos
- `src/features/analytics/queries.ts` — consume el RPC y normaliza datos
- `supabase/migrations/20260701130000_qa3_features.sql` — RPC `metricas_tablero`

---

## Bugs corregidos (del audit de 59 agentes)

1. **RBAC layouts sin guard** — los layouts de vendedor, contable y admin no verificaban el rol; cualquier usuario autenticado podía acceder a cualquier panel navegando directo. Corregido con `redirect(rutaPorRol(perfil.rol))`.
2. **Idempotency key derivada del pedido.id** — se generaba del ID del pedido nuevo (que cambia en cada intento), no de la cotización origen. Corregido para derivar de `cot.id`.
3. **Race condition en pedidos duplicados** — dos clics rápidos en "Convertir en pedido" podían crear dos pedidos de la misma cotización. Corregido con unique index en `pedidos(cotizacion_id)` + manejo de violación 23505.
4. **`convertirEnPedido` sin validación de stock** — no verificaba contra la tabla `inventario`. Ahora valida y retorna error descriptivo.
5. **`facturarPedido` sin verificación de rol** — cualquier usuario podía facturar. Ahora requiere `contable` o `administrador`.
6. **Carrito se limpiaba antes de confirmar el guardado** — `limpiar()` se llamaba antes del `redirect`, perdiendo items si el save fallaba. Ahora se limpia solo en la página de detalle con `<LimpiarCarrito />`.

---

## Estado actual

- Typecheck: limpio
- Lint: limpio
- Tests: 5/5 pasan
- Verificación en navegador: todos los flujos probados
- **No se ha hecho commit** — los cambios están en el working tree (20 archivos modificados + 13 nuevos)
- 3 migraciones SQL aplicadas a la base de datos de Supabase

---

## Migraciones SQL aplicadas

| Archivo | Contenido |
|---------|-----------|
| `20260701120000_clientes_vendedor_insert.sql` | RLS policy para INSERT vendedor en clientes |
| `20260701130000_qa3_features.sql` | share_token, unique indexes, leida_at, RPCs (cotizacion_publica, metricas_tablero) |
| `20260701140000_realtime_notificaciones.sql` | Notificaciones en Realtime publication |
