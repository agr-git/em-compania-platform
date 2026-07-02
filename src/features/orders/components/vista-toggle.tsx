"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function VistaToggle() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const vista = searchParams.get("vista") ?? "tabla";

  function cambiar(v: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (v === "tabla") params.delete("vista");
    else params.set("vista", v);
    router.push(`?${params.toString()}`);
  }

  const base = "px-3 py-1 text-xs font-medium transition-all";
  const activo = "bg-brand-primary text-brand-primary-foreground";
  const inactivo = "hover:bg-neutral-100 dark:hover:bg-neutral-800";

  return (
    <div className="inline-flex overflow-hidden rounded-full border border-brand-border">
      <button
        type="button"
        onClick={() => cambiar("tabla")}
        className={`${base} ${vista === "tabla" ? activo : inactivo}`}
      >
        Tabla
      </button>
      <button
        type="button"
        onClick={() => cambiar("kanban")}
        className={`${base} ${vista === "kanban" ? activo : inactivo}`}
      >
        Kanban
      </button>
    </div>
  );
}
