# Regla: Arquitectura

Resumen accionable. El detalle vive en `docs/ARCHITECTURE.md`.

## Las 5 reglas de dependencia (no romper)
1. `app/` usa `features/`.
2. `features/` usa `core/ports`, `core/domain`, `lib/`. **Nunca importa un adapter
   concreto.**
3. `core/domain/` es **puro**: sin Supabase, sin fetch, sin I/O.
4. `core/adapters/` es el **único** lugar que conoce World Office, Gmail o Supabase.
5. La inyección mock/real ocurre solo en `lib/container.ts` (composition root).

## Checklist mental antes de escribir código externo
- ¿Esto habla con World Office o Gmail? → va en un **adapter**, detrás de un **puerto**.
- ¿El dominio necesita el resultado? → recíbelo por la **interfaz**, no por la
  implementación.
- ¿Estoy a punto de `import`ar un adapter dentro de una feature? → **detente**, usa el
  puerto.

## Patrones obligatorios
- **Outbox + idempotencia** para crear pedidos en WO (nunca duplicar, nunca perder).
- **Snapshots** de `codigo_contable`, `descripcion` y `precio_unitario` por línea.
- **RLS** en toda tabla de negocio.
- **Realtime** para el panel contable.

## Anti-patrones (rechazar en review)
- Lógica de negocio dentro de un componente de UI.
- Llamada directa a `fetch` de World Office fuera de un adapter.
- Token de WO o secretos llegando al cliente.
- Escribir a WO sincrónicamente con el clic del usuario (debe pasar por outbox).
- Tabla nueva sin RLS.
- Mutar un snapshot después de creado.

## Cuando dudes
Escribe un ADR antes de comprometer una decisión estructural. Mejor 10 minutos de ADR que
un rediseño después.
