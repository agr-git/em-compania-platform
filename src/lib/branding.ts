/**
 * BRANDING — único punto de edición de la identidad de marca del sitio.
 *
 * Cuando el cliente (E.M. Compañía) entregue su manual de marca, se edita
 * SOLO este archivo: nombre, tagline, colores y logo. Opcionalmente se deja
 * un archivo en /public (ej. /logo.svg) y se cambia `logo` a tipo "image".
 * Ningún componente referencia textos/colores de marca a mano → cero refactor.
 *
 * Los colores se inyectan como variables CSS en el root layout y Tailwind las
 * expone como utilidades: `bg-brand-primary`, `text-brand-primary-foreground`,
 * `text-brand-accent` (ver globals.css).
 */

export type LogoConfig =
  | { type: "monogram"; text: string }
  | { type: "image"; src: string; alt?: string; width?: number; height?: number };

export interface Branding {
  /** Nombre corto de marca (header, login). */
  appName: string;
  /** Razón social (metadata, pie). */
  legalName: string;
  /** Nombre del producto/módulo. */
  productName: string;
  /** Frase de valor (login). */
  tagline: string;
  /** Logo: monograma (iniciales) o imagen desde /public. */
  logo: LogoConfig;
  /** Colores de marca (se vuelven variables CSS). */
  colors: {
    primary: string;
    primaryForeground: string;
    accent: string;
  };
  /** Opcional: "Hecho por …" en el pie. */
  poweredBy?: string;
}

export const branding: Branding = {
  appName: "E.M. Compañía",
  legalName: "E.M. Compañía S.A.S",
  productName: "Cotización y Pedidos",
  tagline: "Cotiza, arma pedidos y envíalos a World Office Cloud, listos para facturar.",
  // Para usar un logo propio: { type: "image", src: "/logo.svg", alt: "E.M. Compañía" }
  logo: { type: "monogram", text: "EM" },
  colors: {
    primary: "#171717",
    primaryForeground: "#fafafa",
    accent: "#2563eb",
  },
};

/** Variables CSS de marca para inyectar en el root layout (<html style=…>). */
export function brandCssVars(): React.CSSProperties {
  return {
    "--brand-primary": branding.colors.primary,
    "--brand-primary-foreground": branding.colors.primaryForeground,
    "--brand-accent": branding.colors.accent,
  } as React.CSSProperties;
}
