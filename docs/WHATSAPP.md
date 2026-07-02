# Canal de Pedidos por WhatsApp (Kapso)

> Permite recibir pedidos por WhatsApp (texto) y convertirlos automáticamente en una
> **cotización borrador** que un vendedor revisa. WhatsApp es "otra cara" del mismo backend
> (arquitectura de puertos, ver `ARCHITECTURE.md` y `ROADMAP.md §B4`). Es un **extra**
> vendible sobre el core del concurso.

## Arquitectura

```
Cliente (WhatsApp, texto)
   │
   ▼
Número Kapso (inbound) ──► Workflow Kapso "whatsapp-pedidos" (agente LLM)
   │                          │ extrae { consulta, cantidad } de cada producto
   │                          ▼
   │                       Webhook tool  →  POST /api/whatsapp/pedido  (en Vercel)
   │                                          │ token propio (Bearer)
   │                                          │ búsqueda dual → resuelve productos
   │                                          │ crea COTIZACIÓN (cliente "Canal WhatsApp")
   │◄──────── el agente confirma total ───────┘
                                          El vendedor la revisa en "Mis cotizaciones"
```

- **No crea un pedido directo** (no toca World Office): crea una **cotización** para revisión humana.
- El producto se resuelve con la **búsqueda dual** (`buscar_productos`), así que "sello 7/8" o
  "capacitor de 40" hacen match aunque el cliente no sepa el código.

## Piezas

| Pieza | Dónde | Qué hace |
|---|---|---|
| Endpoint | `src/app/api/whatsapp/pedido/route.ts` | Recibe `{ telefono?, items:[{consulta,cantidad}] }`, valida token, crea la cotización |
| Proxy | `src/lib/supabase/middleware.ts` | Exime `/api/whatsapp` de la redirección de sesión (usa token propio) |
| Workflow Kapso | `kapso/workflows/whatsapp-pedidos/workflow.ts` | Agente + webhook tool. Se compila con `kapso build` y sube con `kapso push` |
| Cliente genérico | tabla `clientes` → "Canal WhatsApp" | Todas las cotizaciones de WhatsApp se asocian a este cliente (demo) |

### Contrato del endpoint

`POST /api/whatsapp/pedido`
```jsonc
// Headers
Authorization: Bearer <WHATSAPP_INGEST_TOKEN>
// Body
{ "telefono": "+57300...", "items": [ { "consulta": "sello 7/8", "cantidad": 2 } ] }
// Respuesta 200
{ "ok": true, "cotizacion_id": "...", "total": 97000,
  "lineas": [ { "codigo": "0100178", "descripcion": "...", "cantidad": 2, "total": 97000 } ],
  "no_encontrados": [] }
```
Sin token válido → **401**. Sin productos reconocidos → `{ ok:false, no_encontrados:[...] }`.

## Configuración (2 tokens, deben ser IDÉNTICOS)

El header que manda Kapso (`Authorization: Bearer {{vars.ingest_token}}`) debe coincidir con el
token que valida el endpoint. Ambos son **dashboard-only** (no se pueden setear por API/CLI).

### 1) Vercel — `WHATSAPP_INGEST_TOKEN`
1. Vercel → proyecto **em-compania-platform** → *Settings → Environment Variables*.
2. Add New → Key `WHATSAPP_INGEST_TOKEN`, Value `<token>`, Environments: **Production**.
3. Save → *Deployments* → **Redeploy** el último.

### 2) Kapso — variable `ingest_token`
1. app.kapso.ai → workflow **whatsapp-pedidos** → *Variables / Environment*.
2. New variable → Name `ingest_token`, Value `<el mismo token>`. Guardar.

> El token vive **solo** en Vercel y en Kapso (variables). El repo referencia `{{vars.ingest_token}}`
> — nunca comitear el valor. Para local, va en `.env.local` (gitignored): `WHATSAPP_INGEST_TOKEN`,
> `WHATSAPP_VENDEDOR_EMAIL`.

## Kapso CLI (desde `kapso/`)

Autenticación por variables de entorno (no `kapso login` interactivo):
```bash
export KAPSO_API_KEY=<key>            # también en .env.local (gitignored)
export KAPSO_API_BASE_URL=https://app.kapso.ai
```
Comandos útiles:
```bash
kapso build                 # compila workflow.ts → definition.json
kapso push                  # sube el workflow (NO lo activa)
kapso whatsapp numbers list
kapso whatsapp conversations list
kapso whatsapp messages list
```
**Activar un workflow** (el CLI no activa; usar la API directa):
```bash
curl -s -X PATCH "https://app.kapso.ai/platform/v1/workflows/<id>" \
  -H "X-API-Key: $KAPSO_API_KEY" -H "Content-Type: application/json" \
  -d '{"workflow":{"status":"active"}}'
```
> `id` del workflow: **ed706995-8d2f-4d05-9669-0bc66460d7fa**.

## Probar (sandbox)

El número Kapso es **sandbox**: **solo el dispositivo activado** puede escribirle (⚠️ importante
para la demo — el presentador debe usar ese teléfono).

1. En el dashboard de Kapso: *WhatsApp → Numbers → Sandbox* → verás el **número dialable** y el
   **código de activación**. Envía `join <código>` desde tu WhatsApp para habilitar tu teléfono.
2. Escríbele el pedido, ej: *"necesito dos sellos de 7/8 y un capacitor de 40"*.
3. El agente responde con el total y las líneas; la cotización queda en **Mis cotizaciones** del
   vendedor (`WHATSAPP_VENDEDOR_EMAIL`), cliente **"Canal WhatsApp"**.

### Diagnóstico ("typing" sin respuesta)
- Revisa los **execution logs** del workflow en el dashboard de Kapso.
- Causas típicas: faltan los tokens (webhook → 401), proveedor LLM sin configurar/crédito, o
  `message_delivery_mode` (no expuesto por el SDK `@kapso/workflows`).
- Verifica el endpoint en prod: `curl -X POST .../api/whatsapp/pedido -H "Authorization: Bearer <token>" -d '{"items":[{"consulta":"sello 7/8","cantidad":1}]}'`.

## Camino a producción (go-live)

- **Número real** de WhatsApp Business (deja de ser sandbox → cualquiera puede escribir).
- **Mapeo teléfono → cliente**: hoy va a un cliente genérico. En prod, agregar `telefono` a
  `clientes` y resolver el cliente por el número entrante (o que el agente lo pregunte).
- **Audios**: hoy solo texto. Las notas de voz requieren transcripción (paso extra) para mantener
  el hábito de audios que ya usa el negocio.
- **¿Cotización o pedido?** Se eligió cotización (revisión humana). En prod se puede cablear a
  pedido directo si el negocio lo prefiere, reusando el mismo flujo (outbox/World Office).
