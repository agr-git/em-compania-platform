# Regla: Documentación

> Documentación desactualizada cuenta como bug. Si tocas algo que un doc describe,
> actualizas el doc en el mismo cambio.

## Principios

1. **El código dice *cómo*; los docs dicen *por qué*.** Comenta el porqué de decisiones no
   obvias; deja que el código tipado explique el cómo.
2. **CLAUDE.md es corto y vigente.** Es la memoria operativa. El detalle vive en `/docs`.
   Si CLAUDE.md crece demasiado, mueve detalle a `/docs` y deja un enlace.
3. **Una fuente de verdad por tema.** No dupliques: enlaza.

## Cuándo actualizar qué

| Si cambias… | Actualiza… |
|---|---|
| Stack o una librería central | `docs/STACK.md` + ADR |
| Capas, puertos, flujo de datos | `docs/ARCHITECTURE.md` |
| Tablas, columnas, RLS | `docs/DATA-MODEL.md` + migración SQL |
| Algo de la integración WO | `docs/WORLD-OFFICE-INTEGRATION.md` |
| Una decisión con alternativas reales | nuevo **ADR** en `docs/adr/` |
| Un flujo que ve el usuario final | `docs/onboarding/MANUAL-ONBOARDING.md` |
| Comandos / scripts | sección "Comandos" de `CLAUDE.md` |
| Alcance o fases | `docs/ROADMAP.md` |

## ADR (Architecture Decision Records)

Toda decisión técnica con alternativas válidas se registra como ADR. Es la memoria del
"por qué" para que nadie (humano o agente) la reabra sin contexto.

- Plantilla: `docs/adr/template.md`.
- Numeración incremental: `0003-...`, `0004-...`.
- Un ADR no se borra: si se reemplaza, se marca `Superseded by ADR-XXXX`.
- Usa el comando `/adr` para crear uno (ver `.claude/commands/adr.md`).

## Estilo de los docs

- Español, claro, directo. Términos técnicos en inglés cuando es lo estándar.
- Tablas y listas sobre párrafos largos.
- Ejemplos de código reales y mínimos.
- Nada de relleno: si una sección no aporta, se elimina.

## Checklist al cerrar una feature

- [ ] ¿Algún doc de la tabla de arriba quedó desactualizado? Actualizado.
- [ ] ¿Decisión con alternativas? ADR escrito.
- [ ] ¿Cambió algo que ve el usuario final? Manual de onboarding revisado.
- [ ] ¿Nuevo comando/script? CLAUDE.md actualizado.
