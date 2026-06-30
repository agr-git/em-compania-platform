/**
 * NotificationMockAdapter — activo en el concurso. Registra la notificación
 * (en producción la fila va a `notificaciones` y Gmail envía el correo real).
 */
import type {
  Notificacion,
  NotificationPort,
  ResultadoNotificacion,
} from "@/core/ports/notification.port";

export class NotificationMockAdapter implements NotificationPort {
  async enviar(notificacion: Notificacion): Promise<ResultadoNotificacion> {
    // Log estructurado: en el panel contable se refleja como "correo enviado".
    console.info("[notificacion:mock]", JSON.stringify(notificacion));
    return { enviada: true, proveedor: "mock" };
  }
}
