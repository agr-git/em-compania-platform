# CLAUDE.md — E.M. Compañía · Plataforma de Cotización y Pedidos

> Este archivo es la memoria operativa del proyecto. Claude Code lo lee al inicio de
> cada sesión. Mantenlo **corto, vigente y accionable**. El detalle vive en `/docs`.

---

## 1. Qué es este proyecto

Plataforma web **cerrada** (acceso solo interno) para **E.M. Compañía S.A.S** —
empresa colombiana con 40 años vendiendo sellos mecánicos, capacitores y artículos de
refrigeración a través de 3 vendedores en calle.

Hoy los pedidos se toman informalmente por WhatsApp (fotos y audios) y se redigitan a
mano antes de facturar. Esta plataforma reemplaza ese flujo: el vendedor **cotiza →
arma el pedido → el pedido se crea en World Office Cloud vía API**, listo para que
contabilidad lo vuelva factura con un clic.

**Contexto importante:** esto es un **concurso** (cliente: E.M., organiza: Aztec,
premio: 1.400 USD + relación laboral). Se construye al ~90%. El 10% restante —la
conexión en vivo con la cuenta real de World Office— lo ejecuta el ganador con contrato.
**El criterio que más pesa para ganar es la calidad del plan de integración con la API
de World Office** (ver `docs/WORLD-OFFICE-INTEGRATION.md`).

## 2. Los 3 roles (RBAC)

| Rol | Hace |
|-----|------|
| **Vendedor** | Crea cotizaciones/pedidos buscando por descripción **o** por código, aplica el descuento del cliente, ve su historial y el inventario en vivo. |
| **Contable** | Ve todos los pedidos en tiempo real (filtrables por vendedor, recientes primero), recibe correo por cada pedido nuevo, convierte pedido en factura en World Office. |
| **Administrador** | Crea/elimina vendedores y contables, ve todo lo creado por cada uno, controla la configuración general. Control total, sin depender de un técnico. |

## 3. Stack (decidido — ver `docs/STACK.md` y ADR-0002)

- **Framework:** Next.js 16 (App Router, RSC, Server Actions) + TypeScript estricto + React 19 · ver ADR-0003
- **UI:** Tailwind CSS + shadcn/ui
- **Datos/Auth/Realtime:** Supabase (Postgres + Auth + RLS + Realtime + Storage)
- **Hosting:** Vercel (cuenta del cliente) + Supabase Cloud
- **Email:** Gmail API en producción / mock en concurso (detrás de `NotificationPort`)
- **Validación:** Zod en todos los bordes (forms, server actions, API)
- **Estado servidor en cliente:** TanStack Query donde haya realtime + cache
- **Tests:** Vitest (unit) + Playwright (e2e de los flujos críticos)
- **Tooling:** pnpm · ESLint · Prettier · Husky + lint-staged

## 4. Arquitectura en una frase

**Hexagonal / Ports & Adapters** para todo lo externo. La lógica de negocio nunca
conoce a World Office ni a Gmail directamente: habla con **puertos** (interfaces) y se
les inyecta un **adapter** (`mock` en el concurso, `real` en producción). Esto es lo que
nos deja entregar al 90% hoy y cablear el 10% sin tocar el dominio. Detalle en
`docs/ARCHITECTURE.md`.

```
features (UI + casos de uso) ──> ports (interfaces) ──> adapters (mock | real)
                                                          ├─ WorldOfficeMockAdapter
                                                          ├─ WorldOfficeApiAdapter   (lo cablea el ganador)
                                                          ├─ NotificationMockAdapter
                                                          └─ GmailNotificationAdapter
```

## 5. Estructura de carpetas (objetivo)

```
src/
  app/                      # Rutas Next.js (App Router) + Server Actions
    (auth)/                 # login
    (vendedor)/             # panel vendedor
    (contable)/             # panel contable
    (admin)/                # panel administrador
    api/                    # route handlers (webhooks, jobs)
  features/                 # un folder por dominio: catalog, quotes, orders, users…
    <feature>/
      components/           # UI de la feature
      actions.ts            # server actions
      queries.ts            # lecturas
      schema.ts             # Zod
      types.ts
  core/
    ports/                  # interfaces: WorldOfficePort, NotificationPort…
    adapters/               # implementaciones mock | real
    domain/                 # entidades y reglas puras (sin I/O)
  lib/                      # supabase clients, utils, config
  components/ui/            # shadcn/ui
supabase/
  migrations/               # SQL versionado
  seed/                     # catálogo de muestra generado con IA
docs/                       # ver índice abajo
```

## 6. Reglas no negociables (leer antes de codear)

1. **El código contable SIEMPRE se conserva.** El vendedor puede ignorarlo, pero cada
   ítem de cotización/pedido guarda un *snapshot* de `codigo_contable` y `descripcion`
   al momento de crearse. Nunca se infiere después. (Ver criterio de éxito del concurso.)
2. **La búsqueda no es excluyente.** Por descripción **o** por código, ambas válidas,
   ninguna obligatoria. Es el reto central de UX del concurso.
3. **Nada toca World Office real durante el concurso.** Solo el `WorldOfficeMockAdapter`
   está activo. El adapter real existe como contrato + plan, no se ejecuta.
4. **Idempotencia en la creación de pedidos.** Todo pedido enviado a WO lleva una
   `idempotency_key` derivada de la llave natural de WO (`prefijo + numero + idEmpresa +
   documentoTipo`) para nunca duplicar. (Ver `WORLD-OFFICE-INTEGRATION.md` §Idempotencia.)
5. **RLS siempre activo.** Ninguna tabla con datos de negocio sin Row Level Security.
   Un vendedor solo ve lo suyo; contable y admin según su rol.
6. **Validar en el borde con Zod.** Toda entrada (form, action, API) se valida antes de
   tocar dominio o base de datos.
7. **Secretos solo en variables de entorno.** Nunca en el repo. Ver `.env.example`.

## 7. Flujo de trabajo con Claude Code

> **CI/CD y prácticas (cualquier IDE/agente):** lee `docs/ENGINEERING-PRACTICES.md`. Trae el
> mapa **disparador → acción** (qué hacer solo al commitear, abrir PR, cambiar schema, tocar
> World Office…). `AGENTS.md` es el punto de entrada universal para agentes no-Claude.

- Antes de una feature nueva: revisa `docs/ROADMAP-1DIA.md` (sprint actual) o `docs/ROADMAP.md`.
- Cambios de arquitectura o stack → **escribe un ADR** (`/adr` o `docs/adr/`). No decidas
  en silencio; los ADR son la memoria de "por qué".
- Al terminar una feature → **actualiza la documentación afectada** (ver
  `.claude/rules/documentation.md`). Documentación desactualizada = bug.
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`…). Ver `.claude/rules/git-workflow.md`.
- Estándares de código: `.claude/rules/coding-standards.md`.
- Reglas de arquitectura: `.claude/rules/architecture.md`.

## 8. Comandos

```bash
pnpm dev            # desarrollo local
pnpm build          # build de producción
pnpm lint           # eslint
pnpm typecheck      # tsc --noEmit
pnpm test           # vitest
pnpm test:e2e       # playwright
pnpm db:migrate     # aplicar migraciones supabase
pnpm db:seed        # cargar catálogo de muestra (IA)
```

> Si un comando aún no existe, créalo en `package.json` y documenta aquí.

## 9. Índice de documentación

| Doc | Para qué |
|-----|----------|
| `AGENTS.md` | ⭐ Punto de entrada universal para cualquier agente/IDE |
| `docs/ENGINEERING-PRACTICES.md` | ⭐ CI/CD y mapa disparador→acción (qué hacer automáticamente) |
| `docs/ROADMAP-1DIA.md` | Sprint comprimido de 1 día (plan de ejecución vigente) |
| `docs/STACK.md` | Stack elegido y por qué |
| `docs/ARCHITECTURE.md` | Arquitectura hexagonal, capas, flujo de datos |
| `docs/DATA-MODEL.md` | Esquema de base de datos y RLS |
| `docs/WORLD-OFFICE-INTEGRATION.md` | ⭐ Plan de integración API (lo que más pesa) |
| `docs/CATALOG-GENERATION.md` | Cómo generamos el catálogo de muestra con IA |
| `docs/ROADMAP.md` | Fases del concurso + ideas a futuro para el cliente |
| `docs/onboarding/MANUAL-ONBOARDING.md` | Manual para usuario no técnico |
| `docs/adr/` | Registro de decisiones de arquitectura (ADR) |

## 10. Entregables del concurso (checklist)

- [ ] Login cerrado con 3 roles funcionando.
- [ ] Búsqueda por descripción **o** código, con código contable conservado.
- [ ] Cotización con descuento por cliente → convertida en pedido.
- [ ] Panel contable en tiempo real, filtrable por vendedor, con notificación por correo.
- [ ] Admin que crea/elimina usuarios y ve todo lo de cada uno.
- [ ] Generación de los archivos/estructuras que alimentarían a World Office.
- [ ] **Plan de integración API con World Office claro y viable** (lo que más pesa).
- [ ] Manual de onboarding para persona no técnica.
- [ ] Catálogo de muestra generado con IA (códigos + descripciones representativos).
