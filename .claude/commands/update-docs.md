---
description: Revisa y actualiza la documentación afectada por los cambios recientes
---

Sincroniza la documentación con el estado actual del código.

Pasos:
1. Revisa los cambios recientes (git diff / archivos tocados en esta sesión).
2. Usando la tabla de `.claude/rules/documentation.md`, identifica qué docs quedaron
   desactualizados.
3. Actualiza cada doc afectado:
   - `CLAUDE.md` si cambiaron comandos, stack, reglas o estructura.
   - `docs/STACK.md`, `docs/ARCHITECTURE.md`, `docs/DATA-MODEL.md`,
     `docs/WORLD-OFFICE-INTEGRATION.md`, `docs/ROADMAP.md` según corresponda.
   - `docs/onboarding/MANUAL-ONBOARDING.md` si cambió algo que ve el usuario final.
4. Si hubo una decisión con alternativas, propone crear un ADR (`/adr`).
5. Mantén CLAUDE.md corto: si crece, mueve detalle a `/docs` y deja un enlace.
6. Resume al final qué docs tocaste y por qué.

Contexto adicional: $ARGUMENTS
