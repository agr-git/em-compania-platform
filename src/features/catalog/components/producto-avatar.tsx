import { CATEGORIAS } from "../types";

/** Íconos simples por familia (viñeta representativa, sin fotos reales). */
function Icono({ categoria }: { categoria: string }) {
  if (categoria === "capacitores") {
    // cilindro / capacitor
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <rect x="7" y="4" width="10" height="16" rx="3" />
        <path d="M9 4V2M15 4V2M12 8v8" />
      </svg>
    );
  }
  if (categoria === "refrigeracion") {
    // copo de nieve
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19" />
      </svg>
    );
  }
  // sellos_mecanicos → sello / anillo concéntrico
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

/**
 * Avatar de producto: mosaico con el color de la familia + ícono, estilo funky
 * (borde tinta + sombra dura). Determinista, sin imágenes externas.
 */
export function ProductoAvatar({
  categoria,
  size = 44,
}: {
  categoria: string;
  size?: number;
}) {
  const color = CATEGORIAS[categoria]?.color ?? "var(--brand-ink)";
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-xl border-[1.5px] border-brand-ink text-brand-cream shadow-[2px_2px_0_var(--brand-ink)]"
      style={{ width: size, height: size, background: color }}
      aria-hidden
    >
      <span style={{ width: size * 0.5, height: size * 0.5, display: "inline-flex" }}>
        <Icono categoria={categoria} />
      </span>
    </span>
  );
}
