/**
 * Puerto de notificaciones. El dominio no sabe si detrás hay Gmail o un mock.
 * Mock en el concurso; GmailNotificationAdapter en producción.
 */

export interface NotificacionPedidoNuevo {
  tipo: "pedido_nuevo";
  destinatario: string;
  pedidoId: string;
  vendedor: string;
  cliente: string;
  total: number;
}

export interface NotificacionDigestoSemanal {
  tipo: "digesto_semanal";
  destinatario: string;
  periodo: string;
  totalPedidos: number;
  pedidosFacturados: number;
  pedidosPendientes: number;
  pedidosError: number;
  ingresoTotal: number;
  ingresoFacturado: number;
  topVendedores: { nombre: string; pedidos: number; ingreso: number }[];
  pedidosAtencionUrgente: { id: string; cliente: string; estado: string; antiguedadDias: number }[];
}

export type Notificacion = NotificacionPedidoNuevo | NotificacionDigestoSemanal;

export interface ResultadoNotificacion {
  enviada: boolean;
  proveedor: "mock" | "gmail";
}

export interface NotificationPort {
  enviar(notificacion: Notificacion): Promise<ResultadoNotificacion>;
}
