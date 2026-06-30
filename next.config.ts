import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fija la raíz del proyecto para Turbopack (evita el warning de inferencia de
  // workspace por la presencia de pnpm-workspace.yaml).
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
