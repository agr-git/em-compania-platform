# Roadmap

Dos horizontes: **(A) el concurso** (2 semanas, entrega al 90%) y **(B) futuro** —ideas
que ya encajan en esta arquitectura y dan valor real al cliente después.

---

## A. Concurso — 2 semanas

### Semana 1 — Fundaciones + avance de control
- **F0 · Setup:** repo, Next.js + Supabase + Vercel, CI, este CLAUDE.md y reglas.
- **F1 · Auth + 3 roles:** login cerrado, RLS, layouts por rol.
- **F2 · Catálogo + búsqueda:** seed con IA, búsqueda por descripción **o** código,
  código contable conservado, indicador de inventario.
- **Entrega de control (fin S1):** login + catálogo navegable con búsqueda funcionando.

### Semana 2 — Flujo completo + entregables
- **F3 · Cotizaciones:** armado con cantidades, descuento del cliente, snapshots.
- **F4 · Pedidos:** convertir cotización en pedido, `wo_outbox` con idempotency,
  `WorldOfficeMockAdapter` creando el pedido simulado + archivo/estructura para WO.
- **F5 · Panel contable:** pedidos en tiempo real (Realtime), filtro por vendedor,
  notificación por correo (mock), "convertir en factura" (simulado).
- **F6 · Panel admin:** crear/eliminar usuarios, ver todo lo de cada uno, config general.
- **F7 · Entregables del concurso:**
  - `docs/WORLD-OFFICE-INTEGRATION.md` pulido (lo que más pesa).
  - Manual de onboarding (no técnico).
  - Catálogo de muestra IA.
  - Export de archivos/estructuras que alimentarían a World Office.

### Definición de "listo" (concurso)
Todo el checklist de `CLAUDE.md` §10 marcado, e2e Playwright verde en los flujos críticos
(login por rol, búsqueda dual, cotización→pedido, panel contable en vivo, alta/baja de
usuario).

---

## B. Futuro — ideas que el cliente puede activar (pensar fuera de la caja)

Todas encajan en la arquitectura actual sin rehacer nada. Ordenadas por impacto/esfuerzo.

### B1 · PWA offline-first para vendedores en calle ⭐ (alto impacto)
Los 3 vendedores trabajan **en la calle**, con señal intermitente. Una PWA que:
- arma cotizaciones sin conexión y **sincroniza al recuperar señal** (el outbox ya es la
  base conceptual: las operaciones se encolan y se envían cuando hay red),
- se instala como app en el teléfono.
Resuelve el dolor real de tomar pedidos donde no hay buena señal.

### B2 · Captura por voz y foto con IA ⭐ (mata el dolor original)
Hoy piden por WhatsApp con **fotos y audios**. En vez de pelear contra ese hábito, lo
absorbemos: el vendedor **dicta** ("dos sellos de siete octavos y un capacitor de 40
microfaradios") o **fotografía** un producto/empaque, y un LLM lo convierte en líneas de
cotización con el producto y código correctos. Es el mismo flujo informal de siempre, pero
estructurado y sin redigitar. (Reaprovecha experiencia previa en bots de WhatsApp + LLMs.)

### B3 · Búsqueda semántica (pgvector)
Sobre la búsqueda actual (código + trigram + full-text), añadir embeddings para que
"empaque para eje 22mm" encuentre el sello correcto aunque la descripción use otras
palabras. La columna y el índice ya están previstos en el modelo.

### B4 · Canal de pedidos por WhatsApp (mismo backend)
La empresa ya vive en WhatsApp. Un bot que alimente **el mismo backend** (cotización →
pedido → World Office) abre un canal de autoservicio/asistido sin construir otra
plataforma. La lógica de negocio ya está detrás de puertos, así que el bot es solo otra
"cara".

### B5 · Motor de descuentos configurable
Hoy: descuento por cliente. Futuro: reglas por volumen, por familia de producto, por
margen mínimo, vigencias y aprobaciones. El admin las edita sin tocar código.

### B6 · Panel analítico para el administrador
Ventas por vendedor, productos más cotizados vs. más pedidos, tasa de conversión
cotización→pedido, tiempo a factura, rotación de inventario. Datos que ya viven en la BD;
solo falta visualizarlos.

### B7 · Estados y trazabilidad del pedido para el vendedor
Que el vendedor vea en vivo: pedido creado → en World Office → facturado, con
notificaciones. Refuerza confianza y reduce llamadas a contabilidad.

### B8 · Multi-empresa / multi-sucursal
Si E.M. crece o Aztec quiere reusar la plataforma con otros clientes, la arquitectura por
`idEmpresa` y adapters permite aislar tenants. Base para un futuro SaaS vertical para
distribuidores que facturan con World Office.

### B9 · Auditoría y cumplimiento
`audit_log` ya captura acciones sensibles. A futuro: reportes de auditoría exportables,
retención configurable, y alertas ante anomalías (ej. descuentos fuera de rango).

> **Cómo presentar esto en el concurso:** B1 y B2 son los diferenciadores que conectan
> directo con el dolor descrito en el enunciado (señal en calle + WhatsApp con fotos/audios).
> Mencionarlos como "extensiones naturales ya soportadas por la arquitectura" demuestra
> visión de producto sin inflar el alcance de las 2 semanas.
