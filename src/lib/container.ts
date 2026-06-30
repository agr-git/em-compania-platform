/**
 * Composition root (único lugar donde se decide mock vs. real).
 * El dominio y la UI piden adapters a través de getContainer(); jamás instancian
 * un adapter concreto. Cambiar de concurso a producción = cambiar una env var.
 * Ver docs/ARCHITECTURE.md §"Reglas de dependencia".
 */
import { z } from "zod";
import { NotificationMockAdapter } from "@/core/adapters/notification.mock";
import { WorldOfficeMockAdapter } from "@/core/adapters/world-office.mock";
import type { NotificationPort } from "@/core/ports/notification.port";
import type { WorldOfficePort } from "@/core/ports/world-office.port";

const envSchema = z.object({
  WORLD_OFFICE_ADAPTER: z.enum(["mock", "real"]).default("mock"),
  NOTIFICATION_ADAPTER: z.enum(["mock", "gmail"]).default("mock"),
});

const env = envSchema.parse({
  WORLD_OFFICE_ADAPTER: process.env.WORLD_OFFICE_ADAPTER,
  NOTIFICATION_ADAPTER: process.env.NOTIFICATION_ADAPTER,
});

export interface Container {
  worldOffice: WorldOfficePort;
  notifications: NotificationPort;
}

function buildWorldOffice(): WorldOfficePort {
  if (env.WORLD_OFFICE_ADAPTER === "real") {
    // El adapter real es el 10% que cablea el ganador, sin tocar dominio.
    throw new Error(
      "WorldOfficeApiAdapter (real) aún no está cableado. Ver docs/WORLD-OFFICE-INTEGRATION.md §8 (runbook de go-live).",
    );
  }
  return new WorldOfficeMockAdapter();
}

function buildNotifications(): NotificationPort {
  if (env.NOTIFICATION_ADAPTER === "gmail") {
    throw new Error("GmailNotificationAdapter se cablea en producción (NOTIFICATION_ADAPTER=gmail).");
  }
  return new NotificationMockAdapter();
}

let singleton: Container | null = null;

export function getContainer(): Container {
  if (!singleton) {
    singleton = {
      worldOffice: buildWorldOffice(),
      notifications: buildNotifications(),
    };
  }
  return singleton;
}
