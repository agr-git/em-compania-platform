# Regla: Flujo de Git

## Commits — Conventional Commits
Formato: `tipo(scope): descripción en presente`

Tipos: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `style`.

Ejemplos:
```
feat(catalog): búsqueda por descripción o código con trigram
feat(orders): outbox con idempotency_key para envío a World Office
fix(auth): RLS faltante en cotizaciones del vendedor
docs(world-office): plan de manejo de token JWT de 12h
```

- Un commit = un cambio coherente. Nada de "varias cosas".
- Mensaje en español, presente, sin punto final.

## Ramas
- `main` siempre desplegable (Vercel despliega desde aquí).
- Trabajo en ramas `feat/...`, `fix/...`, `docs/...`.
- PR pequeño y enfocado; descripción con el **qué** y el **por qué**, enlazando ADR si
  aplica.

## Antes de commitear (lo hace Husky)
- `pnpm lint` y `pnpm typecheck` en verde.
- Tests afectados pasan.
- Sin secretos en el diff (revisar `.env` fuera del control de versiones).

## Antes de mergear a main
- CI verde (lint + typecheck + test + build).
- Documentación afectada actualizada (ver `documentation.md`).
- e2e de flujos críticos sin romper.

## Higiene
- No comitear `node_modules`, `.next`, `.env*`, archivos de seed con datos reales.
- Catálogo de muestra (IA) sí va al repo (`supabase/seed/`), porque es de demostración.
