# Prácticas de Ingeniería y CI/CD — E.M. Compañía

> **Para cualquier agente de IA o desarrollador, en cualquier IDE.** Este es el
> contrato de cómo se trabaja en este repo. No depende de que alguien lo recuerde:
> está escrito como **disparadores → acción** para que el LLM en uso identifique solo
> lo que debe hacer en cada momento. Si vas a tocar el repo, esto aplica.
>
> Fuente de verdad de CI/CD. Las reglas de detalle viven en `.claude/rules/`
> (git-workflow, coding-standards, architecture, documentation). Aquí está el **cuándo**
> y el **gate**; allá el **cómo**. No dupliques: enlaza.

---

## 0. Protocolo de inicio de sesión (haz esto siempre, sin que te lo pidan)

Al empezar a trabajar —seas Claude Code, Cursor, Copilot, Windsurf, Codex o un humano—:

1. **Lee la memoria operativa:** `CLAUDE.md` (qué es, reglas no negociables) y este doc.
2. **Ubícate en git:** `git status` y `git branch`. Si estás en `main`, **crea una rama**
   antes de tocar código (`feat/...`, `fix/...`, `docs/...`). Nunca trabajes en `main`.
3. **Sincroniza:** `git fetch && git pull --rebase` para no divergir del equipo.
4. **Estado verde de partida:** si vas a tocar código, corre `pnpm install` si cambió el
   lockfile. Asume que el repo debe estar verde antes y después de tu cambio.
5. **Ubica la fase:** revisa `docs/ROADMAP-1DIA.md` (sprint actual) para no construir fuera
   de alcance.

> Este repo es **source of truth compartido** con un equipo de AI builders. Cada commit que
> empujas, otro agente lo hereda. Deja el árbol más limpio de como lo encontraste.

---

## 1. Mapa de disparadores → acción (el corazón de este doc)

Identifica qué estás por hacer y aplica la columna derecha **automáticamente**, sin esperar
instrucción.

| Si estás por… | Haz antes / a la vez (no negociable) |
|---|---|
| **Escribir código nuevo** | Trabajar en una rama, no en `main`. Server Components por defecto; Zod en todo borde. |
| **Commitear** | `pnpm lint` + `pnpm typecheck` en verde · tests afectados pasan · **cero secretos en el diff** · Conventional Commit en español (`feat(scope): …`). |
| **Agregar/actualizar una dependencia** | Justifícala (¿ya existe algo en el stack?). Commitea el lockfile (`pnpm-lock.yaml`). Si es central, escribe **ADR**. |
| **Cambiar el esquema de datos** | Migración SQL **versionada** en `supabase/migrations/` · actualizar `docs/DATA-MODEL.md` · revisar **RLS** de la tabla tocada. |
| **Tocar la integración con World Office** | Actualizar `docs/WORLD-OFFICE-INTEGRATION.md` en el mismo cambio · mantener el contrato del `WorldOfficePort` intacto (mock y real lo cumplen igual). |
| **Tocar lógica de dominio** (`core/domain`) | Mantenerla **pura** (sin I/O) · cubrir con unit tests Vitest. |
| **Abrir un PR** | Rebase sobre `main` · CI local verde · descripción con **qué** y **por qué** · enlazar ADR/issue si aplica · PR pequeño y enfocado. |
| **Mergear a `main`** | **CI verde** (lint + typecheck + test + build) · docs afectados actualizados · sin romper flujos críticos. |
| **Cerrar una feature** | Correr el checklist de `documentation.md` · actualizar `CLAUDE.md` si cambiaron comandos/alcance. |
| **Manejar un secreto/credencial** | Solo en variables de entorno · nunca en el repo · actualizar `.env.example` (sin valores). |
| **Decidir algo con alternativas reales** | Escribir un **ADR** (`docs/adr/NNNN-...`). No decidas en silencio. |

> Regla mental: **"¿qué gate de calidad protege lo que estoy por hacer?"** Si la respuesta
> es "ninguno", probablemente falte un paso de esta tabla.

---

## 2. El pipeline de CI/CD (qué automatiza la máquina)

```
push a rama / PR ──► GitHub Actions (.github/workflows/ci.yml)
                       ├─ install (pnpm, cache)
                       ├─ lint        (eslint)
                       ├─ typecheck   (tsc --noEmit)
                       ├─ test         (vitest)
                       └─ build        (next build)
                              │
                          ¿todo verde?
                              │ sí
PR aprobado + verde ──► merge a main ──► Vercel despliega automático (CD)
```

- **CI (integración):** se dispara en cada `push` a rama y en cada `pull_request` a `main`.
  Si algo está rojo, **no se mergea**. El humano/agente arregla, no fuerza el merge.
- **CD (despliegue):** `main` siempre desplegable. Vercel despliega `main` automáticamente
  (producción) y genera **Preview Deployments** por PR para revisar visualmente.
- **El pipeline es el árbitro, no la opinión.** Si CI pasa local pero falla en Actions,
  manda Actions: reproduce el entorno limpio antes de declarar "en mi máquina funciona".

### Gates obligatorios antes de merge a `main`
- [ ] `lint` verde
- [ ] `typecheck` verde
- [ ] `test` verde (dominio + adapters contra mock)
- [ ] `build` verde
- [ ] Documentación afectada actualizada (ver `documentation.md`)
- [ ] Sin secretos en el diff

---

## 3. Ramas, commits y PRs (resumen operativo)

- `main`: **siempre desplegable y protegida**. Nada se commitea directo; todo entra por PR.
- Ramas de trabajo: `feat/<algo>`, `fix/<algo>`, `docs/<algo>`, `chore/<algo>`.
- Commits: **Conventional Commits en español, presente, sin punto final**
  (`feat(orders): outbox con idempotency_key`). Un commit = un cambio coherente.
- PRs: pequeños, enfocados, con **qué + por qué**. Preview de Vercel adjunto.
- Detalle completo en `.claude/rules/git-workflow.md`.

---

## 4. Entornos y secretos

| Entorno | Dónde | Adapters activos |
|---|---|---|
| **Local** | `.env.local` (desde `.env.example`) | `mock` (WO + notificación) |
| **CI** | Secrets de GitHub Actions (solo lo necesario para build/test) | `mock` |
| **Producción (Vercel)** | Variables de entorno de Vercel (cuenta del cliente) | `real` (lo cablea el ganador) |

- **Nunca** un secreto en el repo, en logs, ni en el cliente. El token de World Office vive
  solo en el servidor.
- `.env.example` se mantiene actualizado con **toda** variable nueva (sin valores reales).
- Rotación de secretos = responsabilidad de quien los crea; documentar en el runbook de
  go-live (`docs/WORLD-OFFICE-INTEGRATION.md §8`).

---

## 5. Cómo cualquier agente "se entera" de estas reglas (multi-IDE)

Para que la práctica no dependa del agente que uses:

- **`AGENTS.md`** en la raíz = punto de entrada universal. Cursor, Codex, Windsurf y otros
  lo leen por convención. Apunta a este doc y a `CLAUDE.md`.
- **`CLAUDE.md`** = lo que lee Claude Code al iniciar; referencia este doc en su índice.
- **Este doc** = la fuente de verdad de CI/CD, escrita como disparador→acción para que
  cualquier LLM identifique la acción correcta sin memoria previa.
- Si agregas reglas, ponlas **aquí o en `.claude/rules/`** y enlázalas desde `AGENTS.md` y
  `CLAUDE.md`. Una sola fuente de verdad por tema; el resto enlaza.

> Si eres un agente y llegaste a este repo sin contexto: lee `AGENTS.md`, luego `CLAUDE.md`,
> luego este doc. Con eso sabes qué hacer y qué no romper.
