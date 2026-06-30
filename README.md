# Plataforma de Cotización y Pedidos — E.M. Compañía S.A.S

Plataforma web cerrada para que los vendedores de E.M. Compañía coticen y armen pedidos que
llegan en tiempo real a **World Office Cloud**, listos para facturar. Tres paneles por rol:
**Vendedor**, **Contable** y **Administrador**.

> Proyecto desarrollado para el concurso de Aztec. Se construye al ~90%; la conexión en
> vivo con la cuenta real de World Office la ejecuta el ganador, con contrato.

## Estado
En desarrollo. Ver fases en [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Stack
Next.js 15 · TypeScript · Tailwind + shadcn/ui · Supabase (Postgres/Auth/RLS/Realtime) ·
Vercel · Zod · Vitest + Playwright. Detalle en [`docs/STACK.md`](docs/STACK.md).

## Empezar
```bash
pnpm install
cp .env.example .env.local   # completa las variables
pnpm db:migrate
pnpm db:seed                 # catálogo de muestra (IA)
pnpm dev
```

## Documentación
- 🧠 [`CLAUDE.md`](CLAUDE.md) — memoria operativa (empieza aquí si usas Claude Code)
- 🏛️ [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — arquitectura hexagonal
- 🗄️ [`docs/DATA-MODEL.md`](docs/DATA-MODEL.md) — base de datos y RLS
- ⭐ [`docs/WORLD-OFFICE-INTEGRATION.md`](docs/WORLD-OFFICE-INTEGRATION.md) — plan de
  integración (lo que más pesa en el concurso)
- 🤖 [`docs/CATALOG-GENERATION.md`](docs/CATALOG-GENERATION.md) — catálogo de muestra
- 🗺️ [`docs/ROADMAP.md`](docs/ROADMAP.md) — fases + ideas a futuro
- 📘 [`docs/onboarding/MANUAL-ONBOARDING.md`](docs/onboarding/MANUAL-ONBOARDING.md) — manual
  no técnico
- 🧾 [`docs/adr/`](docs/adr/) — decisiones de arquitectura

## Reglas de desarrollo
En [`.claude/rules/`](.claude/rules/): documentación, estándares de código, git y
arquitectura. Comandos de Claude Code en [`.claude/commands/`](.claude/commands/).

## Licencia
Privado · confidencial.
