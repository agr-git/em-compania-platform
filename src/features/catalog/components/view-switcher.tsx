"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const OPCIONES = [
  { v: "tabla", label: "Tabla" },
  { v: "rejilla", label: "Rejilla" },
  { v: "indice", label: "Índice" },
];

export function ViewSwitcher({ actual }: { actual: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function set(v: string) {
    const p = new URLSearchParams(searchParams);
    p.set("vista", v);
    p.delete("pagina");
    router.replace(`${pathname}?${p.toString()}`);
  }

  return (
    <div className="inline-flex rounded-full border-[1.5px] border-brand-ink p-0.5">
      {OPCIONES.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => set(o.v)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            actual === o.v ? "bg-brand-ink text-brand-cream" : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
