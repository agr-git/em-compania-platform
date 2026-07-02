-- =============================================================================
-- QA3 · Realtime sobre `notificaciones`: la campana del contable/admin recibe el
-- evento de "pedido nuevo" en vivo (además de `pedidos`, ya publicada).
-- =============================================================================
alter publication supabase_realtime add table notificaciones;
