/**
 * Puerto de notificaciones. El dominio no sabe si detrás hay Gmail o un mock.
 * Mock en el concurso; GmailNotificationAdapter en producción.
 */

export interface NotificacionPedidoNuevo {
  tipo: "pedido_nuevo";
  destinatario: string; // correo del contable
  pedidoId: string;
  vendedor: string;
  cliente: string;
  total: number;
}

export type Notificacion = NotificacionPedidoNuevo;

export interface ResultadoNotificacion {
  enviada: boolean;
  proveedor: "mock" | "gmail";
}

export interface NotificationPort {
  enviar(notificacion: Notificacion): Promise<ResultadoNotificacion>;
}
