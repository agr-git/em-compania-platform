import { START, Workflow } from "@kapso/workflows";

/**
 * Agente de WhatsApp para E.M. Compañía (canal Kapso).
 * El VENDEDOR (no un cliente final) usa este chat para dictar por texto/audio los
 * productos y dejar registrada una COTIZACIÓN borrador en la plataforma
 * (endpoint /api/whatsapp/pedido). No hay transferencia a humanos: el vendedor
 * es el usuario del chat.
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
  providerModel: "claude-sonnet-4-5-20250929", // nombre del modelo (provider Anthropic nativo). El UUID NO resuelve → cae a default que rechaza max_tokens.
  temperature: 0.2,
  maxIterations: 8,
  // Herramientas por defecto habilitadas SIN `handoff_to_human`: el vendedor es el
  // usuario del chat, no hay a quién transferir.
  enabledDefaultTools: [
    "send_notification_to_user",
    "send_media",
    "get_execution_metadata",
    "get_whatsapp_context",
    "get_current_datetime",
    "save_variable",
    "get_variable",
    "ask_about_file",
    "complete_task",
    "enter_waiting",
  ],
  systemPrompt: [
    "Eres el asistente de cotizaciones de E.M. Compañía (sellos mecánicos, capacitores y refrigeración).",
    "Quien te escribe es un VENDEDOR de la empresa que usa este chat para registrar sus cotizaciones;",
    "no es un cliente final y NUNCA debes ofrecer transferirlo con otra persona.",
    "Saluda breve y pídele qué productos necesita cotizar si no lo dijo.",
    "Cuando tengas la lista, llama a la herramienta `crear_cotizacion` con `items`:",
    "un arreglo de objetos { consulta, cantidad }, donde `consulta` es la descripción o el",
    "código del producto (ej. 'sello 7/8', 'capacitor 40 microfaradios', '0100178') y",
    "`cantidad` es un número. Incluye también el `telefono` del vendedor si lo conoces.",
    "Luego confírmale el total y las líneas de la cotización creada, y avísale que quedó guardada",
    "como borrador en la plataforma para que él la revise y la convierta en pedido.",
    "Si algún producto no se encontró, díselo y ofrécele alternativas.",
    "Si `crear_cotizacion` falla, discúlpate breve, dile que hubo un problema técnico al guardar",
    "y pídele que lo intente de nuevo en un momento. NO transfieras ni menciones a otra persona.",
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
