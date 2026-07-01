import Image from "next/image";
import { branding } from "@/lib/branding";

/**
 * Logo de marca. Renderiza un monograma (iniciales) o una imagen, según
 * `branding.logo`. Cambiar la marca = editar src/lib/branding.ts.
 */
export function Logo({ className }: { className?: string }) {
  const { logo, appName } = branding;

  if (logo.type === "image") {
    return (
      <Image
        src={logo.src}
        alt={logo.alt ?? appName}
        width={logo.width ?? 28}
        height={logo.height ?? 28}
        className={className}
        priority
      />
    );
  }

  return (
    <span
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-brand-ink bg-brand-primary text-[12px] font-extrabold text-brand-primary-foreground shadow-[2px_2px_0_var(--brand-ink)] ${className ?? ""}`}
      aria-hidden
    >
      {logo.text}
    </span>
  );
}

/** Logo + nombre de marca, para headers. */
export function Brand({ className }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className ?? ""}`}>
      <Logo />
      <span className="text-sm font-semibold tracking-tight">{branding.appName}</span>
    </span>
  );
}
