-- =============================================================================
-- QA3 · El vendedor puede dar de alta clientes desde el armador de cotización.
-- Antes solo el admin escribía en `clientes`; el vendedor quedaba bloqueado si
-- el cliente no existía. Solo INSERT de clientes activos: editar/desactivar
-- sigue siendo exclusivo del admin (clientes_admin_write).
-- Ver docs/DATA-MODEL.md §"Políticas RLS".
-- =============================================================================

create policy clientes_vendedor_insert on clientes
  for insert to authenticated
  with check (
    public.current_rol() in ('vendedor', 'administrador')
    and activo = true
  );
