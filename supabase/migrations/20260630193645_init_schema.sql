-- =============================================================================
-- Bloque 1 · Esquema base. Implementa docs/DATA-MODEL.md.
-- Postgres (Supabase). RLS se activa en la migración siguiente (rls_policies).
-- =============================================================================

create extension if not exists pg_trgm; -- búsqueda difusa por descripción

-- ---------- Enums ------------------------------------------------------------
create type rol_usuario        as enum ('vendedor', 'contable', 'administrador');
create type estado_cotizacion  as enum ('borrador', 'enviada', 'convertida');
create type estado_pedido      as enum ('creado', 'enviado_wo', 'facturado', 'error');
create type estado_outbox      as enum ('pending', 'sent', 'failed');
create type estado_notificacion as enum ('pending', 'enviada', 'error');

-- ---------- profiles (extiende auth.users) -----------------------------------
create table profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  rol             rol_usuario not null default 'vendedor',
  nombre_completo text not null,
  email           text not null,
  activo          boolean not null default true,  -- el admin desactiva sin borrar histórico
  created_at      timestamptz not null default now()
);

-- ---------- clientes ---------------------------------------------------------
create table clientes (
  id                uuid primary key default gen_random_uuid(),
  nombre            text not null,
  nit               text,
  descuento_default numeric(5, 2) not null default 0,  -- "descuento del cliente"
  wo_tercero_id     text,                                -- mapeo al tercero de WO
  activo            boolean not null default true,
  created_at        timestamptz not null default now()
);

-- ---------- productos (catálogo; fuente de verdad: World Office) --------------
create table productos (
  id              uuid primary key default gen_random_uuid(),
  codigo_contable text not null unique,        -- se conserva SIEMPRE (ej. 0100178)
  descripcion     text not null,
  categoria       text not null,               -- sellos / capacitores / refrigeración
  unidad          text not null default 'UND',
  precio_lista    numeric(14, 2) not null default 0,
  wo_inventario_id text,                        -- mapeo al inventario de WO
  activo          boolean not null default true,
  search_tsv      tsvector,                     -- full-text (lo llena un trigger)
  created_at      timestamptz not null default now()
);

-- ---------- inventario (snapshot de existencias) -----------------------------
create table inventario (
  id                  uuid primary key default gen_random_uuid(),
  producto_id         uuid not null references productos (id) on delete cascade,
  bodega              text not null default 'PRINCIPAL',
  cantidad_disponible numeric(14, 2) not null default 0,
  actualizado_at      timestamptz not null default now(),
  unique (producto_id, bodega)
);

-- ---------- cotizaciones -----------------------------------------------------
create table cotizaciones (
  id            uuid primary key default gen_random_uuid(),
  vendedor_id   uuid not null references profiles (id),
  cliente_id    uuid not null references clientes (id),
  estado        estado_cotizacion not null default 'borrador',
  descuento_pct numeric(5, 2) not null default 0,
  subtotal      numeric(14, 2) not null default 0,
  total         numeric(14, 2) not null default 0,
  created_at    timestamptz not null default now()
);

-- ---------- cotizacion_items (con SNAPSHOTS congelados) ----------------------
create table cotizacion_items (
  id                  uuid primary key default gen_random_uuid(),
  cotizacion_id       uuid not null references cotizaciones (id) on delete cascade,
  producto_id         uuid not null references productos (id),
  codigo_contable_snap text not null,   -- congelado al crear, NUNCA se actualiza
  descripcion_snap    text not null,    -- congelado al crear
  cantidad            numeric(14, 2) not null,
  precio_unitario     numeric(14, 2) not null,
  descuento_pct       numeric(5, 2) not null default 0,
  total_linea         numeric(14, 2) not null
);

-- ---------- pedidos ----------------------------------------------------------
create table pedidos (
  id            uuid primary key default gen_random_uuid(),
  cotizacion_id uuid references cotizaciones (id),
  vendedor_id   uuid not null references profiles (id),
  cliente_id    uuid not null references clientes (id),
  estado        estado_pedido not null default 'creado',
  wo_order_id   text,                    -- ID devuelto por WO
  total         numeric(14, 2) not null default 0,
  created_at    timestamptz not null default now()
);

-- ---------- pedido_items (con SNAPSHOTS) -------------------------------------
create table pedido_items (
  id                  uuid primary key default gen_random_uuid(),
  pedido_id           uuid not null references pedidos (id) on delete cascade,
  producto_id         uuid not null references productos (id),
  codigo_contable_snap text not null,
  descripcion_snap    text not null,
  cantidad            numeric(14, 2) not null,
  precio_unitario     numeric(14, 2) not null,
  descuento_pct       numeric(5, 2) not null default 0,
  total_linea         numeric(14, 2) not null
);

-- ---------- wo_outbox (patrón outbox + idempotencia) -------------------------
create table wo_outbox (
  id              uuid primary key default gen_random_uuid(),
  pedido_id       uuid not null references pedidos (id) on delete cascade,
  idempotency_key text not null unique,  -- prefijo|numero|idEmpresa|documentoTipo
  payload         jsonb not null,
  estado          estado_outbox not null default 'pending',
  intentos        int not null default 0,
  last_error      text,                  -- incluye moreInfo de WO
  created_at      timestamptz not null default now(),
  sent_at         timestamptz
);

-- ---------- notificaciones ---------------------------------------------------
create table notificaciones (
  id           uuid primary key default gen_random_uuid(),
  pedido_id    uuid not null references pedidos (id) on delete cascade,
  tipo         text not null,            -- ej. pedido_nuevo
  destinatario text not null,            -- correo del contable
  estado       estado_notificacion not null default 'pending',
  enviado_at   timestamptz,
  created_at   timestamptz not null default now()
);

-- ---------- audit_log --------------------------------------------------------
create table audit_log (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references profiles (id),
  accion     text not null,             -- crear_usuario, enviar_wo, facturar…
  entidad    text,
  entidad_id uuid,
  payload    jsonb,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- Índices de búsqueda dual (por descripción O por código) + paneles
-- =============================================================================
create index productos_codigo_idx       on productos (codigo_contable);
create index productos_descripcion_trgm on productos using gin (descripcion gin_trgm_ops);
create index productos_search_tsv_idx   on productos using gin (search_tsv);
create index cotizaciones_vendedor_idx  on cotizaciones (vendedor_id);
create index pedidos_vendedor_idx       on pedidos (vendedor_id);
create index pedidos_created_idx        on pedidos (created_at desc); -- panel contable: recientes primero
create index wo_outbox_estado_idx       on wo_outbox (estado);

-- =============================================================================
-- Trigger: mantener search_tsv (descripción + código) en español
-- =============================================================================
create or replace function productos_tsv_update()
returns trigger
language plpgsql
as $$
begin
  new.search_tsv :=
    to_tsvector('spanish', coalesce(new.descripcion, '') || ' ' || coalesce(new.codigo_contable, ''));
  return new;
end;
$$;

create trigger productos_tsv_trg
  before insert or update of descripcion, codigo_contable on productos
  for each row execute function productos_tsv_update();
