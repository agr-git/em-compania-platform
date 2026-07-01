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
 * `text-brand-blue`, `text-brand-green`, `bg-brand-cream`… (ver globals.css).
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
  /** Colores de marca (se vuelven variables CSS `--brand-*`). */
  colors: {
    primary: string;
    primaryForeground: string;
    ink: string;
    cream: string;
    surface: string;
    border: string;
    blue: string;
    green: string;
    coral: string;
    tan: string;
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
  // Tema "Funky": papel crema cálido + terracota héroe (ver docs/BRANDING.md).
  colors: {
    primary: "#e06e3a", // terracota
    primaryForeground: "#fffcf7",
    ink: "#171717",
    cream: "#fffcf7",
    surface: "#f4efe7",
    border: "#e6e1d6",
    blue: "#223c6d",
    green: "#1f8a5b",
    coral: "#ff8a80",
    tan: "#c8aa78",
  },
};

/** Variables CSS de marca para inyectar en el root layout (<html style=…>). */
export function brandCssVars(): React.CSSProperties {
  const c = branding.colors;
  return {
    "--brand-primary": c.primary,
    "--brand-primary-foreground": c.primaryForeground,
    "--brand-ink": c.ink,
    "--brand-cream": c.cream,
    "--brand-surface": c.surface,
    "--brand-border": c.border,
    "--brand-blue": c.blue,
    "--brand-green": c.green,
    "--brand-coral": c.coral,
    "--brand-tan": c.tan,
    "--background": c.cream,
    "--foreground": c.ink,
  } as React.CSSProperties;
}
