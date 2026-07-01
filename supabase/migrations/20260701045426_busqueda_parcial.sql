-- =============================================================================
-- Búsqueda parcial: además del código (prefijo), full-text y trigram, agrega
-- coincidencia por SUBSTRING (ILIKE %term%) en código y descripción, para que
-- "capac", "octav" o "0100" encuentren resultados aunque no sean palabra exacta.
-- =============================================================================

create or replace function buscar_productos(
  termino text,
  limite int default 24,
  desplazamiento int default 0
)
returns table (
  id uuid,
  codigo_contable text,
  descripcion text,
  categoria text,
  unidad text,
  precio_lista numeric,
  cantidad_disponible numeric,
  rank real,
  total bigint
)
language sql
stable
as $$
  with base as (
    select
      p.id, p.codigo_contable, p.descripcion, p.categoria, p.unidad, p.precio_lista,
      coalesce(sum(i.cantidad_disponible), 0) as cantidad_disponible,
      greatest(
        case when p.codigo_contable ilike termino || '%' then 1.0 else 0 end,
        case when p.descripcion ilike '%' || termino || '%' then 0.7 else 0 end,
        case when p.codigo_contable ilike '%' || termino || '%' then 0.6 else 0 end,
        ts_rank(p.search_tsv, websearch_to_tsquery('spanish', coalesce(termino, ''))),
        similarity(p.descripcion, coalesce(termino, ''))
      )::real as rank
    from productos p
    left join inventario i on i.producto_id = p.id
    where p.activo and (
      coalesce(trim(termino), '') = ''
      or p.codigo_contable ilike '%' || termino || '%'
      or p.descripcion ilike '%' || termino || '%'
      or p.search_tsv @@ websearch_to_tsquery('spanish', termino)
      or p.descripcion % termino
    )
    group by p.id
  )
  select base.*, count(*) over() as total
  from base
  order by rank desc, descripcion
  limit greatest(limite, 1)
  offset greatest(desplazamiento, 0);
$$;

-- mas_vendidos ahora también reporta existencias (para bloquear "cotizar" si está agotado).
create or replace function mas_vendidos(limite int default 8)
returns table (
  id uuid,
  codigo_contable text,
  descripcion text,
  categoria text,
  precio_lista numeric,
  vendido numeric,
  cantidad_disponible numeric
)
language sql
security definer
stable
set search_path = public
as $$
  select p.id, p.codigo_contable, p.descripcion, p.categoria, p.precio_lista,
         coalesce(sum(pi.cantidad), 0) as vendido,
         (select coalesce(sum(i.cantidad_disponible), 0) from inventario i where i.producto_id = p.id) as cantidad_disponible
  from pedido_items pi
  join productos p on p.id = pi.producto_id
  where p.activo
  group by p.id
  order by vendido desc, p.descripcion
  limit greatest(limite, 1);
$$;
