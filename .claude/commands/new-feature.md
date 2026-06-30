---
description: Andamiaje y plan para una feature nueva siguiendo las reglas del proyecto
---

Inicia una feature nueva respetando la arquitectura y las reglas del proyecto.

Antes de escribir código:
1. Ubica la feature en `docs/ROADMAP.md` (¿qué fase?). Si no está, propón dónde encaja.
2. Confirma el contrato: ¿toca World Office o Gmail? Entonces define/usa el **puerto**, no
   un adapter concreto. (Ver `.claude/rules/architecture.md`.)
3. Revisa `docs/DATA-MODEL.md`: ¿necesita tablas/columnas nuevas? Planéalas con RLS.

Andamiaje:
4. Crea `src/features/<feature>/` con: `components/`, `actions.ts`, `queries.ts`,
   `schema.ts` (Zod), `types.ts`, `<feature>.test.ts`.
5. Define los esquemas Zod primero (son la fuente de tipos).
6. Implementa dominio puro en `core/domain` si hay reglas de negocio.
7. Conecta a datos vía repositorio/adapter; respeta RLS.

Cierre:
8. Tests: unit del dominio + e2e si es flujo crítico.
9. Actualiza la documentación afectada (`/update-docs`).
10. Commit con Conventional Commits (ver `.claude/rules/git-workflow.md`).

Feature a iniciar: $ARGUMENTS
