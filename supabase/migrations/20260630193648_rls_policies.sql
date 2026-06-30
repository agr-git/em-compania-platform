-- =============================================================================
-- Bloque 1 · Row Level Security. Ninguna tabla de negocio sin RLS.
-- vendedor ve lo suyo · contable ve todos los pedidos · admin todo.
-- Ver docs/DATA-MODEL.md §"Políticas RLS" y CLAUDE.md regla #5.
-- =============================================================================

-- ---------- Helpers (SECURITY DEFINER evita recursión de RLS en profiles) ----
create or replace function public.current_rol()
returns rol_usuario
language sql
security definer
stable
set search_path = public
as $$
  select rol from public.profiles where id = auth.uid();
$$;

create or replace function public.es_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(public.current_rol() = 'administrador', false);
$$;

-- ---------- Activar RLS en todas las tablas de negocio ------------------------
alter table profiles         enable row level security;
alter table clientes         enable row level security;
alter table productos        enable row level security;
alter table inventario       enable row level security;
alter table cotizaciones     enable row level security;
alter table cotizacion_items enable row level security;
alter table pedidos          enable row level security;
alter table pedido_items     enable row level security;
alter table wo_outbox        enable row level security;
alter table notificaciones   enable row level security;
alter table audit_log        enable row level security;

-- ---------- profiles ---------------------------------------------------------
-- Cada quien ve su perfil; el admin ve y gestiona todos.
create policy profiles_self_select on profiles
  for select to authenticated
  using (id = auth.uid() or public.es_admin());

create policy profiles_admin_write on profiles
  for all to authenticated
  using (public.es_admin())
  with check (public.es_admin());

-- ---------- clientes (lectura para todos; escritura admin) --------------------
create policy clientes_select on clientes
  for select to authenticated using (true);

create policy clientes_admin_write on clientes
  for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- ---------- productos / inventario (catálogo: lectura todos; escritura admin) -
create policy productos_select on productos
  for select to authenticated using (true);

create policy productos_admin_write on productos
  for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

create policy inventario_select on inventario
  for select to authenticated using (true);

create policy inventario_admin_write on inventario
  for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- ---------- cotizaciones (vendedor: las suyas; admin: todas) ------------------
create policy cotizaciones_vendedor on cotizaciones
  for all to authenticated
  using (vendedor_id = auth.uid() or public.es_admin())
  with check (vendedor_id = auth.uid() or public.es_admin());

create policy cotizacion_items_rw on cotizacion_items
  for all to authenticated
  using (
    exists (
      select 1 from cotizaciones c
      where c.id = cotizacion_id and (c.vendedor_id = auth.uid() or public.es_admin())
    )
  )
  with check (
    exists (
      select 1 from cotizaciones c
      where c.id = cotizacion_id and (c.vendedor_id = auth.uid() or public.es_admin())
    )
  );

-- ---------- pedidos (vendedor: los suyos; contable/admin: todos) --------------
create policy pedidos_select on pedidos
  for select to authenticated
  using (vendedor_id = auth.uid() or public.current_rol() in ('contable', 'administrador'));

create policy pedidos_vendedor_insert on pedidos
  for insert to authenticated
  with check (vendedor_id = auth.uid());

-- Contable factura (UPDATE); admin total.
create policy pedidos_contable_update on pedidos
  for update to authenticated
  using (public.current_rol() in ('contable', 'administrador'))
  with check (public.current_rol() in ('contable', 'administrador'));

create policy pedido_items_select on pedido_items
  for select to authenticated
  using (
    exists (
      select 1 from pedidos p
      where p.id = pedido_id
        and (p.vendedor_id = auth.uid() or public.current_rol() in ('contable', 'administrador'))
    )
  );

create policy pedido_items_insert on pedido_items
  for insert to authenticated
  with check (
    exists (
      select 1 from pedidos p where p.id = pedido_id and p.vendedor_id = auth.uid()
    )
  );

-- ---------- wo_outbox (infra: contable/admin leen; vendedor encola; admin corrige)
create policy wo_outbox_select on wo_outbox
  for select to authenticated
  using (public.current_rol() in ('contable', 'administrador'));

create policy wo_outbox_insert on wo_outbox
  for insert to authenticated
  with check (
    exists (select 1 from pedidos p where p.id = pedido_id and p.vendedor_id = auth.uid())
  );

create policy wo_outbox_admin_update on wo_outbox
  for update to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- ---------- notificaciones (contable/admin leen; se encolan en el flujo) ------
create policy notificaciones_select on notificaciones
  for select to authenticated
  using (public.current_rol() in ('contable', 'administrador'));

create policy notificaciones_insert on notificaciones
  for insert to authenticated
  with check (
    exists (select 1 from pedidos p where p.id = pedido_id and p.vendedor_id = auth.uid())
  );

-- ---------- audit_log (admin lee; cada actor registra lo suyo) ----------------
create policy audit_select on audit_log
  for select to authenticated using (public.es_admin());

create policy audit_insert on audit_log
  for insert to authenticated with check (actor_id = auth.uid());

-- Nota: los jobs de servidor (seed, sync de catálogo) usan el service_role,
-- que bypassa RLS por diseño. Las políticas anteriores rigen al usuario final.
