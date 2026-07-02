-- =============================================================================
-- QA3 · Soporte para las 3 features diferenciadoras + robustez del núcleo.
--  1) share_token en cotizaciones → link público compartible por WhatsApp.
--  2) índice único pedidos(cotizacion_id) → un pedido por cotización (anti-doble-submit).
--  3) notificaciones.leida_at → centro de notificaciones en vivo del contable.
--  4) RPC cotizacion_publica(token) → vista pública sin auth (el token ES la llave).
--  5) RPC metricas_tablero() → panel analítico del administrador (solo admin).
--  6) política UPDATE de notificaciones → marcar como leídas.
-- Ver docs/DATA-MODEL.md y docs/ROADMAP.md §B (analítica, trazabilidad).
-- =============================================================================

-- ---------- 1) Token público de cotización -----------------------------------
alter table cotizaciones
  add column if not exists share_token uuid not null default gen_random_uuid();
create unique index if not exists cotizaciones_share_token_idx on cotizaciones (share_token);

-- ---------- 2) Un pedido por cotización (idempotencia dura en BD) -------------
create unique index if not exists pedidos_cotizacion_uidx
  on pedidos (cotizacion_id) where cotizacion_id is not null;

-- ---------- 3) Estado de lectura de notificaciones ---------------------------
alter table notificaciones add column if not exists leida_at timestamptz;

create policy notificaciones_marcar_leida on notificaciones
  for update to authenticated
  using (public.current_rol() in ('contable', 'administrador'))
  with check (public.current_rol() in ('contable', 'administrador'));

-- ---------- 4) Vista pública de cotización (security definer) -----------------
-- El token uuid aleatorio es la capacidad de acceso: sin token no hay lectura.
-- Devuelve solo lo que el cliente debe ver (nada de ids internos ni costos).
create or replace function public.cotizacion_publica(p_token uuid)
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select jsonb_build_object(
    'numero', substr(c.id::text, 1, 8),
    'estado', c.estado,
    'subtotal', c.subtotal,
    'total', c.total,
    'created_at', c.created_at,
    'cliente', jsonb_build_object('nombre', cl.nombre, 'nit', cl.nit),
    'vendedor', jsonb_build_object('nombre', pr.nombre_completo, 'email', pr.email),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'codigo', i.codigo_contable_snap,
        'descripcion', i.descripcion_snap,
        'cantidad', i.cantidad,
        'precio_unitario', i.precio_unitario,
        'descuento_pct', i.descuento_pct,
        'total_linea', i.total_linea
      ) order by i.descripcion_snap)
      from cotizacion_items i where i.cotizacion_id = c.id
    ), '[]'::jsonb)
  )
  from cotizaciones c
  join clientes cl on cl.id = c.cliente_id
  join profiles pr on pr.id = c.vendedor_id
  where c.share_token = p_token;
$$;

grant execute on function public.cotizacion_publica(uuid) to anon, authenticated;

-- ---------- 5) Métricas del tablero del administrador -------------------------
-- security definer + guard es_admin(): agrega todo el negocio en un solo viaje.
create or replace function public.metricas_tablero()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  resultado jsonb;
begin
  if not public.es_admin() then
    raise exception 'solo administrador';
  end if;

  select jsonb_build_object(
    'cotizaciones_total', (select count(*) from cotizaciones),
    'cotizaciones_convertidas', (select count(*) from cotizaciones where estado = 'convertida'),
    'pedidos_total', (select count(*) from pedidos),
    'total_vendido', (select coalesce(sum(total), 0) from pedidos where estado in ('enviado_wo', 'facturado')),
    'facturados', (select count(*) from pedidos where estado = 'facturado'),
    'clientes_activos', (select count(*) from clientes where activo),
    'pedidos_por_estado', (
      select coalesce(jsonb_object_agg(estado, n), '{}'::jsonb)
      from (select estado, count(*) n from pedidos group by estado) s
    ),
    'ventas_por_vendedor', (
      select coalesce(jsonb_agg(v order by (v->>'total')::numeric desc), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'nombre', pr.nombre_completo,
          'pedidos', count(p.id),
          'total', coalesce(sum(p.total), 0)
        ) v
        from profiles pr
        left join pedidos p on p.vendedor_id = pr.id and p.estado in ('enviado_wo', 'facturado')
        where pr.rol = 'vendedor'
        group by pr.id, pr.nombre_completo
      ) x
    ),
    'top_productos', (
      select coalesce(jsonb_agg(t order by (t->>'unidades')::numeric desc), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'codigo', pi.codigo_contable_snap,
          'descripcion', max(pi.descripcion_snap),
          'unidades', sum(pi.cantidad),
          'veces', count(*)
        ) t
        from pedido_items pi
        group by pi.codigo_contable_snap
        limit 8
      ) y
    )
  ) into resultado;

  return resultado;
end;
$$;

grant execute on function public.metricas_tablero() to authenticated;
