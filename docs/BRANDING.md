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
| `colors.*` | Paleta completa: `primary`/`primaryForeground` (botones), `ink`, `cream`, `surface`, `border`, `blue`, `green`, `coral`, `tan` — se inyectan como variables CSS y calientan toda la UI |

Al guardar, los cambios se reflejan en **login, header, botones y metadata** sin tocar
componentes.

## Cambiar el logo

- **Monograma (por defecto):** `logo: { type: "monogram", text: "EM" }`.
- **Imagen propia:** deja el archivo en `/public` (ej. `public/logo.svg`) y pon:
  ```ts
  logo: { type: "image", src: "/logo.svg", alt: "E.M. Compañía", width: 28, height: 28 }
  ```

## Cambiar colores

Edita `colors` en `branding.ts` (paleta completa):
```ts
colors: {
  primary: "#e06e3a", primaryForeground: "#fffcf7",   // acción (botones píldora)
  ink: "#171717", cream: "#fffcf7", surface: "#f4efe7", border: "#e6e1d6",
  blue: "#223c6d", green: "#1f8a5b", coral: "#ff8a80", tan: "#c8aa78",
}
```
Se inyectan como variables CSS (`--brand-*`) en el root layout y Tailwind las expone como
utilidades: `bg-brand-primary`, `bg-brand-cream`, `text-brand-blue`, `border-brand-border`…
Además, la escala `neutral-*` de Tailwind está **remapeada a tonos cálidos** en `globals.css`
(por eso `bg-neutral-50`/`border-neutral-200` ya salen crema). **Usa utilidades de marca**
en componentes nuevos (no colores fijos) para que el rebrand siga siendo de un solo archivo.

## Estilo "Funky" (tema actual)

El tema activo es **Alternativas Funky**: papel crema cálido, terracota héroe, display
**Bricolage Grotesque** (títulos) sobre Geist (cuerpo), y la firma visual de **botones píldora
con sombra dura desplazada**. Piezas reutilizables en `globals.css`:

- `.btn-funky` — botón píldora con borde tinta + sombra dura (usado en acciones primarias).
- `.card-funky` — card con esquinas redondeadas + sombra dura.
- Utilidades de radio/sombra: `rounded-card`, `rounded-pill`, `shadow-funky`.
- Fuente display: se aplica a `h1/h2/h3` automáticamente (`--font-display` = Bricolage).

## Regla para mantener el rebrand sin refactor

- Nunca escribas el nombre de la marca ni un color de marca **a mano** en un componente.
- Textos de marca → `branding.*`. Logo → `<Logo />` / `<Brand />`
  (`src/components/brand/logo.tsx`). Colores → utilidades `*-brand-*`.
