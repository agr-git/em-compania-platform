# Modelo de Datos

Base: Postgres (Supabase). Todo con **RLS activo**. SQL versionado en
`supabase/migrations/`.

> Implementado (Bloque 1) en `supabase/migrations/*_init_schema.sql` (tablas, enums,
> índices, trigger de `search_tsv`) y `*_rls_policies.sql` (RLS + helpers
> `current_rol()` / `es_admin()` con `SECURITY DEFINER`). Catálogo de muestra en
> `supabase/seed/` (60 productos, `pnpm db:seed`).

## Diagrama lógico

```
profiles (rol) ──< cotizaciones ──< cotizacion_items >── productos
     │                  │                                    │
     │                  └──> pedidos ──< pedido_items        ├── inventario (stock)
     │                          │                            │
clientes >─────────────────────┘                            └── (wo_inventario_id)
                                │
                            wo_outbox  ──> notificaciones
                                │
                            audit_log
```

## Tablas

### `profiles` (extiende `auth.users`)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | = auth.users.id |
| rol | enum `vendedor`\|`contable`\|`administrador` | RBAC |
| nombre_completo | text | |
| email | text | |
| activo | bool | el admin desactiva sin borrar histórico |
| created_at | timestamptz | |

### `clientes`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| nombre | text | |
| nit | text | identificación |
| descuento_default | numeric | **el "descuento del cliente"** que aplica el vendedor |
| wo_tercero_id | text | mapeo al "tercero" de World Office |
| activo | bool | |

### `productos` (catálogo — fuente de verdad: World Office)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| codigo_contable | text UNIQUE | **se conserva SIEMPRE** (ej. `0100178`) |
| descripcion | text | ej. "sello mecánico 7 octavos, resorte corto Parxial" |
| categoria | text | sellos / capacitores / refrigeración |
| unidad | text | unidad de medida |
| precio_lista | numeric | |
| wo_inventario_id | text | mapeo al "inventario" de WO |
| activo | bool | |
| search_tsv | tsvector | índice full-text (descripción) |
| search_trgm | (índice GIN trigram) | búsqueda difusa por descripción |

> **Búsqueda por descripción o código:** índice trigram (`pg_trgm`) + `tsvector` sobre
> `descripcion`, e índice sobre `codigo_contable`. Una sola query cubre ambas vías; ninguna
> es obligatoria. (Opcional a futuro: `pgvector` para búsqueda semántica — ver ROADMAP.)

### `inventario` (snapshot de existencias)
| Columna | Tipo | Notas |
|---|---|---|
| producto_id | uuid FK | |
| bodega | text | |
| cantidad_disponible | numeric | |
| actualizado_at | timestamptz | refrescado desde WO |

### `cotizaciones`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| vendedor_id | uuid FK profiles | |
| cliente_id | uuid FK clientes | |
| estado | enum `borrador`\|`enviada`\|`convertida` | |
| descuento_pct | numeric | tomado del cliente, editable por línea |
| subtotal / total | numeric | |
| created_at | timestamptz | |

### `cotizacion_items` (con SNAPSHOTS)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| cotizacion_id | uuid FK | |
| producto_id | uuid FK | |
| codigo_contable_snap | text | **congelado al crear** |
| descripcion_snap | text | **congelado al crear** |
| cantidad | numeric | |
| precio_unitario | numeric | congelado |
| descuento_pct | numeric | |
| total_linea | numeric | |

### `pedidos`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| cotizacion_id | uuid FK | |
| vendedor_id | uuid FK | |
| cliente_id | uuid FK | |
| estado | enum `creado`\|`enviado_wo`\|`facturado`\|`error` | |
| wo_order_id | text NULL | ID devuelto por WO |
| total | numeric | |
| created_at | timestamptz | |

### `pedido_items`
Igual que `cotizacion_items` (snapshots), referidos a `pedido_id`.

### `wo_outbox` (patrón outbox + idempotencia)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| pedido_id | uuid FK | |
| idempotency_key | text UNIQUE | `prefijo\|numero\|idEmpresa\|documentoTipo` |
| payload | jsonb | request listo para WO |
| estado | enum `pending`\|`sent`\|`failed` | |
| intentos | int | |
| last_error | text | incluye `moreInfo` de WO |
| created_at / sent_at | timestamptz | |

### `notificaciones`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| pedido_id | uuid FK | |
| tipo | text | ej. `pedido_nuevo` |
| destinatario | text | correo del contable |
| estado | enum `pending`\|`enviada`\|`error` | |
| enviado_at | timestamptz | |

### `audit_log`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| actor_id | uuid FK profiles | |
| accion | text | crear_usuario, enviar_wo, facturar… |
| entidad / entidad_id | text / uuid | |
| payload | jsonb | |
| created_at | timestamptz | |

## Políticas RLS (resumen)

- **vendedor:** `SELECT/INSERT` sus propias cotizaciones/pedidos
  (`vendedor_id = auth.uid()`); `SELECT` catálogo e inventario.
- **contable:** `SELECT` todos los pedidos; `UPDATE` para facturar.
- **administrador:** acceso total + gestión de `profiles`.
- Catálogo (`productos`, `inventario`): lectura para todos los roles autenticados;
  escritura solo por jobs de sincronización / admin.

## Reglas de integridad clave

1. `productos.codigo_contable` **único y nunca nulo**.
2. Los `*_snap` se llenan en el `INSERT` del ítem (trigger o capa de aplicación) y **no se
   actualizan** después.
3. `wo_outbox.idempotency_key` **único** → garantía anti-duplicado.
4. No se borra histórico: usuarios/clientes/productos se **desactivan** (`activo=false`).
