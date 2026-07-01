-- =============================================================================
-- "Los más vendidos": agrega pedido_items (cantidad) por producto, global.
-- SECURITY DEFINER porque la RLS de pedido_items limita al vendedor a lo suyo;
-- para el ranking global se agrega sobre todos (solo lectura agregada).
-- =============================================================================

create or replace function mas_vendidos(limite int default 8)
returns table (
  id uuid,
  codigo_contable text,
  descripcion text,
  categoria text,
  precio_lista numeric,
  vendido numeric
)
language sql
security definer
stable
set search_path = public
as $$
  select p.id, p.codigo_contable, p.descripcion, p.categoria, p.precio_lista,
         coalesce(sum(pi.cantidad), 0) as vendido
  from pedido_items pi
  join productos p on p.id = pi.producto_id
  where p.activo
  group by p.id
  order by vendido desc, p.descripcion
  limit greatest(limite, 1);
$$;
