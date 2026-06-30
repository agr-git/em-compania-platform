---
description: Crea un nuevo Architecture Decision Record (ADR) a partir de la plantilla
---

Crea un nuevo ADR para documentar una decisión técnica.

Pasos:
1. Revisa `docs/adr/` y determina el siguiente número incremental (formato `NNNN`).
2. Copia `docs/adr/template.md` a `docs/adr/NNNN-<titulo-en-kebab-case>.md`.
3. Rellena: contexto, decisión, alternativas consideradas (con pros/cons), consecuencias.
4. Marca el estado como `Propuesto` (cambia a `Aceptado` cuando se confirme).
5. Si reemplaza a otro ADR, marca el viejo como `Superseded by ADR-NNNN`.
6. Si la decisión afecta CLAUDE.md o algún doc en `/docs`, actualízalos en el mismo cambio.

La decisión a documentar es: $ARGUMENTS
