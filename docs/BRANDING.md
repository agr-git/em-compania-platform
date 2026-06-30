# Branding — cómo cambiar la marca del sitio

> Diseñado para que el cliente aplique su **manual de marca** sin refactor: se edita
> **un solo archivo** (`src/lib/branding.ts`) y, si quieren, se deja un logo en `/public`.

## Qué se puede cambiar desde un solo lugar

`src/lib/branding.ts` controla, para todo el sitio:

| Campo | Afecta |
|---|---|
| `appName` | Nombre en el header y login |
| `legalName` | Razón social (título del navegador, login) |
| `productName` | Nombre del módulo (login, título) |
| `tagline` | Frase de valor |
| `logo` | Monograma (iniciales) **o** imagen desde `/public` |
| `colors.primary` / `primaryForeground` / `accent` | Color de botones y acentos en toda la app |

Al guardar, los cambios se reflejan en **login, header, botones y metadata** sin tocar
componentes.

## Cambiar el logo

- **Monograma (por defecto):** `logo: { type: "monogram", text: "EM" }`.
- **Imagen propia:** deja el archivo en `/public` (ej. `public/logo.svg`) y pon:
  ```ts
  logo: { type: "image", src: "/logo.svg", alt: "E.M. Compañía", width: 28, height: 28 }
  ```

## Cambiar colores

Edita `colors` en `branding.ts`:
```ts
colors: { primary: "#0B5", primaryForeground: "#fff", accent: "#0B5" }
```
Internamente se inyectan como variables CSS (`--brand-primary`, …) en el root layout y
Tailwind las expone como utilidades: `bg-brand-primary`, `text-brand-primary-foreground`,
`text-brand-accent`. **Usa esas utilidades** en componentes nuevos (no colores fijos), para
que el rebrand siga siendo de un solo archivo.

## Regla para mantener el rebrand sin refactor

- Nunca escribas el nombre de la marca ni un color de marca **a mano** en un componente.
- Textos de marca → `branding.*`. Logo → `<Logo />` / `<Brand />`
  (`src/components/brand/logo.tsx`). Colores → utilidades `*-brand-*`.
