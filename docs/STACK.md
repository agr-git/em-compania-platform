# Stack Tecnológico

Decisión registrada en `docs/adr/0002-seleccion-stack-tecnologico.md`. Aquí el detalle
práctico.

## Principios que guían la elección

1. **El cliente lo usa desde el día uno** → estable, hosteable hoy, sin fricción.
2. **Escalable** → empieza con 3 vendedores, debe aguantar crecimiento y canales nuevos.
3. **Operable sin técnico** → el admin controla todo; nada exige tocar código.
4. **Óptimo para desarrollar con Claude Code** → un repo de código real, tipado, con
   convenciones claras, mejor que un constructor no-code para un entregable robusto.

## Capas

| Capa | Tecnología | Por qué |
|------|------------|---------|
| Framework | **Next.js 15** (App Router, RSC, Server Actions) | Fullstack en un repo, SSR para paneles rápidos, despliegue nativo en Vercel, ecosistema enorme, excelente para Claude Code |
| Lenguaje | **TypeScript** estricto | Tipos de extremo a extremo; menos bugs en datos contables |
| UI | **Tailwind CSS + shadcn/ui** | Componentes accesibles, consistentes y rápidos de iterar |
| Datos | **Supabase (Postgres)** | SQL real, relaciones, transacciones; ideal para pedidos/contabilidad |
| Auth | **Supabase Auth** | 3 roles vía RLS, sin construir auth desde cero |
| Realtime | **Supabase Realtime** | El panel contable ve pedidos en vivo sin polling |
| Storage | **Supabase Storage** | Adjuntos futuros (fotos de producto, soportes) |
| Hosting | **Vercel** | En cuenta del cliente; CI/CD por git push |
| Email | **Gmail API** (prod) / mock (concurso) | Requerido por el cliente; aislado tras `NotificationPort` |
| Validación | **Zod** | Un esquema = tipos + validación en todos los bordes |
| Estado cliente | **TanStack Query** | Cache + sincronización donde hay realtime |
| Tests | **Vitest + Playwright** | Unit del dominio + e2e de los flujos críticos |
| Calidad | **ESLint · Prettier · Husky · lint-staged** | Estilo y checks automáticos en cada commit |
| Gestor | **pnpm** | Rápido y eficiente en disco |

## ¿Por qué Next.js + Supabase y no un no-code (Lovable)?

David trabaja a diario con Lovable y es perfecto para prototipar. Pero este concurso
premia **solidez, arquitectura y un plan de integración serio**. Un repo Next.js + Supabase
nos da:

- Control total del código que evalúa el jurado.
- La arquitectura hexagonal que hace creíble el plan de World Office.
- Tests, tipos y CI que demuestran madurez.
- Cero "techo" de no-code cuando llegue el cableado real.

> Lovable sigue siendo útil para mockear pantallas rápido antes de pasarlas a componentes;
> pero la entrega final vive en el repo Next.js.

## Email: Gmail API vs. alternativas

El cliente pidió notificación por **Gmail vía API**. Lo implementamos detrás de
`NotificationPort`:

- **Concurso:** `NotificationMockAdapter` (registra el correo en BD y consola; se puede
  demostrar sin cuenta real).
- **Producción:** `GmailNotificationAdapter` (OAuth2 / cuenta de servicio del cliente).
- **Alternativa de orquestación:** como el cliente queda con la automatización en sus
  cuentas, el envío puede delegarse a **n8n** (webhook → Gmail), útil si prefieren manejar
  plantillas sin desplegar código. Queda como opción, no como dependencia.

## Variables de entorno

Ver `.env.example`. Nunca comitear secretos.
