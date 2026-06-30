-- =============================================================================
-- Bloque 5 · Panel contable.
-- 1) El contable/admin puede leer perfiles (para mostrar el nombre del vendedor
--    de cada pedido y filtrar por vendedor).
-- 2) Realtime sobre `pedidos`: el panel contable ve los pedidos en vivo.
-- =============================================================================

drop policy if exists profiles_self_select on profiles;
create policy profiles_self_select on profiles
  for select to authenticated
  using (id = auth.uid() or public.current_rol() in ('contable', 'administrador'));

-- Publicación de Realtime (el panel se actualiza sin recargar).
alter publication supabase_realtime add table pedidos;
