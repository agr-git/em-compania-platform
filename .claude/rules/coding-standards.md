# Regla: Estándares de Código

## TypeScript
- `strict: true`. Nada de `any` implícito; si es inevitable, `unknown` + narrowing.
- Tipos derivados de **Zod** (`z.infer`) como fuente de verdad en los bordes.
- Funciones puras en `core/domain` (sin I/O). Sin efectos colaterales ocultos.
- Nombres en español para dominio de negocio (`cotizacion`, `pedido`, `tercero`) y en
  inglés para infraestructura (`repository`, `adapter`, `port`). Consistencia > pureza.

## Next.js
- **Server Components por defecto**; `"use client"` solo cuando hay interactividad/estado.
- Mutaciones vía **Server Actions** validadas con Zod y con verificación de rol al inicio.
- Nunca exponer secretos al cliente. El token de World Office vive solo en servidor.
- Datos sensibles de negocio: leer con el cliente Supabase del **servidor** (respeta RLS).

## Validación
- **Todo borde valida con Zod**: forms, server actions, route handlers, payloads de WO.
- Falla temprano y con mensaje claro. No confíes en datos no validados.

## Errores
- No tragues errores en silencio. Loguea estructurado (incluye `idempotency_key` y, si
  viene de WO, el campo `moreInfo`).
- Distingue error de **validación** (no reintentar) vs. **transitorio** (reintentar).

## Estructura de una feature
```
features/<feature>/
  components/      # UI
  actions.ts       # server actions (mutaciones)
  queries.ts       # lecturas
  schema.ts        # Zod (fuente de tipos)
  types.ts         # tipos de apoyo
  <feature>.test.ts
```
- La feature depende de **puertos**, jamás de un adapter concreto.

## Estilo
- ESLint + Prettier mandan; no discutir formato a mano.
- Funciones cortas, un propósito. Si necesita comentario para entenderse el *qué*,
  refactoriza; los comentarios explican el *por qué*.
- Sin código muerto, sin `console.log` olvidados (usa el logger).

## Tests
- **Dominio** (`core/domain`): unit con Vitest, cobertura alta (es lógica pura).
- **Adapters**: tests contra el mock; contrato compartido mock/real.
- **Flujos críticos**: e2e Playwright (login por rol, búsqueda dual, cotización→pedido,
  panel contable en vivo, alta/baja de usuario).
- No se mergea rojo.

## Seguridad
- RLS siempre. La app valida rol además de RLS (defensa en profundidad).
- Entradas saneadas (Zod). Salidas que van al usuario, escapadas por defecto (React).
- Secretos solo en env; `.env` en `.gitignore`.
