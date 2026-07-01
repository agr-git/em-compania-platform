import { START, Workflow } from "@kapso/workflows";

/**
 * Agente de WhatsApp para E.M. Compañía (canal Kapso).
 * Recibe el pedido por texto/audio, extrae los productos y crea una COTIZACIÓN
 * borrador en la plataforma (endpoint /api/whatsapp/pedido), luego confirma.
 *
 * Secretos: el token de ingesta va en la variable Kapso `ingest_token`
 * (NO se escribe en este archivo). El endpoint apunta a producción (Vercel).
 */
const workflow = new Workflow("whatsapp-pedidos", {
  name: "WhatsApp · Pedidos E.M. Compañía",
  status: "active",
});

workflow.addTrigger({
  type: "inbound_message",
  phoneNumberId: "597907523413541", // número Sandbox WhatsApp
});

workflow.addNode(START, {
  position: { x: 100, y: 100 },
});

workflow.addNode("asesor", {
  type: "agent",
  position: { x: 100, y: 260 },
  providerModel: "b3a5b171-3c2b-413a-a9d9-3e3c3609982b", // anthropic/claude-3.5-sonnet
  temperature: 0.2,
  maxIterations: 8,
  systemPrompt: [
    "Eres el asistente de pedidos de E.M. Compañía (sellos mecánicos, capacitores y refrigeración).",
    "Saluda breve y pide al cliente qué productos necesita si no lo dijo.",
    "Cuando tengas la lista, llama a la herramienta `crear_cotizacion` con `items`:",
    "un arreglo de objetos { consulta, cantidad }, donde `consulta` es la descripción o el",
    "código del producto (ej. 'sello 7/8', 'capacitor 40 microfaradios', '0100178') y",
    "`cantidad` es un número. Incluye también el `telefono` del cliente si lo conoces.",
    "Luego confirma al cliente el total y las líneas de la cotización creada, y avísale que",
    "un vendedor la revisará. Si algún producto no se encontró, díselo y ofrécele alternativas.",
    "Responde siempre en español, claro y cordial.",
  ].join(" "),
  webhooks: [
    {
      name: "crear_cotizacion",
      description:
        "Crea una cotización borrador con los productos solicitados. items: [{consulta, cantidad}].",
      url: "https://em-compania-platform.vercel.app/api/whatsapp/pedido",
      method: "POST",
      headers: {
        Authorization: "Bearer {{vars.ingest_token}}",
        "Content-Type": "application/json",
      },
    },
  ],
});

workflow.addEdge(START, "asesor");

export default workflow;
