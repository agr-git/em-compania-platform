# ADR-0003: Usar Next.js 16 (última estable) en vez de Next.js 15

- **Estado:** Aceptado
- **Fecha:** 2026-06-30
- **Decisores:** Equipo (durante el scaffold del Bloque 0)

## Contexto
El stack documentado (ADR-0002, `STACK.md`, `CLAUDE.md`) fijaba **Next.js 15**. Al
scaffoldear el proyecto greenfield con `create-next-app@latest`, la versión estable actual
instalada fue **Next.js 16.2.9** (con React 19.2 y Tailwind v4). El concurso es un proyecto
nuevo, sin código heredado que migrar.

## Decisión
Adoptar **Next.js 16** como versión del framework. Es la última estable y no hay razón para
fijar un major anterior en un proyecto que arranca de cero.

## Alternativas consideradas
| Opción | Pros | Contras |
|---|---|---|
| **Next.js 16 (elegida)** | Última estable; soporte y parches al día; mismo modelo App Router/RSC/Server Actions que usamos | Difiere de los datos de entrenamiento de los LLM → exige leer `node_modules/next/dist/docs/` antes de codear (avisado en `AGENTS.md`) |
| Fijar Next.js 15 | Coincide con lo ya documentado; más material de entrenamiento | Downgrade manual sin beneficio real en greenfield; quedaría desactualizado desde el día 1 |

## Consecuencias
- Positivas: base moderna, sin deuda de versión; el código de dominio/feature es idéntico al
  que habríamos escrito en 15 (App Router, Server Actions, RSC).
- Negativas / costos asumidos: los agentes deben **consultar la doc local de Next 16**
  (`node_modules/next/dist/docs/`) ante dudas de API, porque hay breaking changes respecto a
  versiones previas. Ya está señalizado en `AGENTS.md` (bloque `nextjs-agent-rules`).
- Docs actualizados a raíz de esta decisión: `STACK.md`, `CLAUDE.md §3`. ADR-0002 sigue
  vigente en todo lo demás; solo se ajusta la versión del framework.

## Notas
`create-next-app` (Next 16) genera `AGENTS.md` con el aviso "This is NOT the Next.js you
know" y un `CLAUDE.md` que importa `@AGENTS.md`. Conservamos nuestro `CLAUDE.md` y `AGENTS.md`
e **integramos** ese aviso como un bloque dentro de nuestro `AGENTS.md`, manteniendo los
marcadores `<!-- BEGIN/END:nextjs-agent-rules -->`.
