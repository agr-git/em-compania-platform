-- =============================================================================
-- Bloque 3 · Búsqueda dual en una sola función: por descripción O por código,
-- ninguna obligatoria. Combina match exacto de código + full-text (tsv) +
-- similitud trigram, con ranking. Existencias agregadas para el indicador de stock.
-- Se ejecuta con privilegios del llamante → respeta RLS (catálogo: authenticated).
-- =============================================================================

create or replace function buscar_productos(termino text)
returns table (
  id uuid,
  codigo_contable text,
  descripcion text,
  categoria text,
  unidad text,
  precio_lista numeric,
  cantidad_disponible numeric,
  rank real
)
language sql
stable
as $$
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
  where p.activo
    and (
      coalesce(trim(termino), '') = ''                              -- término vacío → lista completa
      or p.codigo_contable ilike termino || '%'                     -- por código (prefijo)
      or p.search_tsv @@ websearch_to_tsquery('spanish', termino)   -- por descripción (full-text ES)
      or p.descripcion % termino                                    -- por descripción (trigram difuso)
    )
  group by p.id
  order by rank desc, p.descripcion
  limit 50;
$$;

comment on function buscar_productos(text) is
  'Búsqueda dual de catálogo (código o descripción). Ver docs/DATA-MODEL.md y ROADMAP-1DIA Bloque 3.';
