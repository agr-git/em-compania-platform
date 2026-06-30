"use client";

import { usePathname, useRouter } from "next/navigation";
import type { VendedorOption } from "../queries";

export function FiltroVendedor({
  vendedores,
  actual,
}: {
  vendedores: VendedorOption[];
  actual: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-neutral-500">Vendedor:</span>
      <select
        value={actual}
        onChange={(e) => {
          const v = e.target.value;
          router.replace(v ? `${pathname}?vendedor=${v}` : pathname);
        }}
        className="rounded-md border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
      >
        <option value="">Todos</option>
        {vendedores.map((v) => (
          <option key={v.id} value={v.id}>
            {v.nombre}
          </option>
        ))}
      </select>
    </label>
  );
}
