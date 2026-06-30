# ADR-0002: Selección del stack tecnológico

- **Estado:** Aceptado
- **Fecha:** 2026-06-29
- **Decisores:** Equipo de desarrollo

## Contexto
Necesitamos un stack que: (1) el cliente pueda operar desde el día uno, (2) escale a más
vendedores y canales, (3) sea operable sin un técnico, y (4) sea óptimo para construir un
entregable robusto con Claude Code. El enunciado sugiere stack libre (ej. Vercel +
Supabase) y deja hosting/dominio/automatización en cuentas del cliente.

## Decisión
**Next.js 15 (App Router) + TypeScript + Tailwind/shadcn + Supabase (Postgres/Auth/RLS/
Realtime) + Vercel.** Email con Gmail API en producción detrás de `NotificationPort`.
Integración con World Office detrás de `WorldOfficePort` (mock en concurso, real en
producción).

## Alternativas consideradas
| Opción | Pros | Contras |
|---|---|---|
| Next.js + Supabase (elegida) | Fullstack en un repo, RLS y Realtime listos, Vercel nativo, ideal para Claude Code, escalable | Requiere escribir código (no no-code) |
| Lovable (no-code) | Prototipado rapidísimo, lo domina el equipo | Techo de personalización; menos control para arquitectura/integración que evalúa el jurado |
| Backend dedicado (Nest/Express) + SPA | Máximo control | Más piezas que operar y desplegar; sobredimensionado para 2 semanas y 3 usuarios |
| Firebase | Realtime y auth listos | Modelo NoSQL menos natural para pedidos/contabilidad; SQL encaja mejor |

## Consecuencias
- Positivas: un solo repo desplegable hoy; RLS como seguridad real; Realtime para el panel
  contable; arquitectura que hace creíble el plan de World Office.
- Negativas: exige disciplina de código y tests (asumida vía reglas y CI).
- Lovable queda como herramienta de prototipado de pantallas, no como entrega final.
- Actualizar: reflejado en `docs/STACK.md` y `CLAUDE.md` §3.

## Notas
Detalle operativo en `docs/STACK.md`. Plan de integración en
`docs/WORLD-OFFICE-INTEGRATION.md`.
