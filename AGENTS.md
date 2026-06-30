# AGENTS.md — Punto de entrada para agentes de IA

> Estándar multi-herramienta (Cursor, Codex, Windsurf, Copilot, Claude Code, etc.).
> Si eres un agente o un humano nuevo en este repo, **empieza aquí**.

Este es el **repo principal y source of truth** de la plataforma de cotización y pedidos de
**E.M. Compañía**, compartido por un equipo de AI builders. Lo que empujas, otro agente lo
hereda: deja el árbol verde y la documentación al día.

<!-- BEGIN:nextjs-agent-rules -->
> ⚠️ **Next.js 16 — no es el Next.js que conoces.** Esta versión trae breaking changes:
> APIs, convenciones y estructura pueden diferir de tus datos de entrenamiento. **Antes de
> escribir código de Next, lee la guía relevante en `node_modules/next/dist/docs/`.** Atiende
> los avisos de deprecación. (Stack fijado en `docs/STACK.md` + ADR-0003.)
<!-- END:nextjs-agent-rules -->

## Orden de lectura (3 archivos, en este orden)
1. **`CLAUDE.md`** — qué es el proyecto, los 3 roles, el stack y las **reglas no negociables**.
2. **`docs/ENGINEERING-PRACTICES.md`** — CI/CD y el mapa **disparador → acción**: qué hacer
   automáticamente al commitear, abrir PR, cambiar schema, tocar World Office, etc.
3. **`docs/ROADMAP-1DIA.md`** — el sprint actual y su alcance. No construyas fuera de él.

Reglas de detalle en **`.claude/rules/`** (git-workflow, coding-standards, architecture,
documentation). Decisiones técnicas en **`docs/adr/`**.

## Lo mínimo que nunca debes romper
- **Nunca trabajes en `main`.** Crea una rama (`feat/…`, `fix/…`, `docs/…`).
- **Antes de commitear:** `pnpm lint` + `pnpm typecheck` verdes, tests afectados pasan,
  **cero secretos** en el diff. Conventional Commits en español.
- **Antes de mergear:** CI verde (lint + typecheck + test + build) y docs afectados al día.
- **Nada toca World Office real:** durante el concurso solo corre el `WorldOfficeMockAdapter`.
- **RLS y Zod siempre.** Snapshots de `codigo_contable` y `descripcion` se congelan al crear.

## Comandos
```bash
pnpm dev · pnpm build · pnpm lint · pnpm typecheck · pnpm test · pnpm test:e2e
pnpm db:migrate · pnpm db:seed
```

Para el detalle del **porqué** de cada práctica, lee `docs/ENGINEERING-PRACTICES.md`.
