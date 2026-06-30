# ADR-0001: Registrar las decisiones de arquitectura como ADR

- **Estado:** Aceptado
- **Fecha:** 2026-06-29
- **Decisores:** Equipo de desarrollo

## Contexto
El proyecto se desarrolla con Claude Code en sesiones que no comparten memoria entre sí.
Sin un registro del "por qué", las decisiones se reabren, se contradicen o se pierden.
El concurso premia solidez y claridad, así que la trazabilidad de decisiones es un activo.

## Decisión
Toda decisión técnica con alternativas reales se documenta como **Architecture Decision
Record (ADR)** en `docs/adr/`, numerado incrementalmente, usando `template.md`. Se crea con
el comando `/adr`.

## Alternativas consideradas
| Opción | Pros | Contras |
|---|---|---|
| ADR en el repo (elegida) | Versionado junto al código, simple, sin herramientas extra | Disciplina manual |
| Wiki externa | Rica en formato | Se desincroniza del código, fricción |
| No documentar | Cero esfuerzo | Decisiones se pierden; reaperturas costosas |

## Consecuencias
- Positivas: memoria persistente del "por qué"; onboarding más rápido (humano o agente).
- Negativas: pequeño costo de disciplina por decisión.
- Actualizar: la regla está reflejada en `.claude/rules/documentation.md`.

## Notas
Formato inspirado en los ADR de Michael Nygard.
