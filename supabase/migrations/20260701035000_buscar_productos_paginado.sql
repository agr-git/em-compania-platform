-- =============================================================================
-- Búsqueda dual PAGINADA. Añade `limite`/`desplazamiento` (defaults) y devuelve
-- `total` (conteo antes de paginar) vía count(*) over() para la barra de páginas.
-- Compatible hacia atrás: llamar sin los nuevos params usa los defaults.
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
      p.id,
      p.codigo_contable,
      p.descripcion,
      p.categoria,
      p.unidad,
      p.precio_lista,
      coalesce(sum(i.cantidad_disponible), 0) as cantidad_disponible,
      greatest(
        case when p.codigo_contable ilike termino || '%' then 1.0 else 0 end,
        ts_rank(p.search_tsv, websearch_to_tsquery('spanish', coalesce(termino, ''))),
        similarity(p.descripcion, coalesce(termino, ''))
      )::real as rank
    from productos p
    left join inventario i on i.producto_id = p.id
    where p.activo and (
      coalesce(trim(termino), '') = ''
      or p.codigo_contable ilike termino || '%'
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
