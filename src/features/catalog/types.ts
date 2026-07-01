/** Fila devuelta por la función buscar_productos (búsqueda dual). */
export interface ProductoBusqueda {
  id: string;
  codigo_contable: string;
  descripcion: string;
  categoria: string;
  unidad: string;
  precio_lista: number;
  cantidad_disponible: number;
  rank: number;
}

export interface ResultadoBusqueda {
  productos: ProductoBusqueda[];
  total: number;
}

/** Metadatos de cada familia del catálogo (color de marca + etiqueta). */
export const CATEGORIAS: Record<string, { label: string; corto: string; color: string }> = {
  sellos_mecanicos: { label: "Sellos mecánicos", corto: "Sellos", color: "var(--brand-blue)" },
  capacitores: { label: "Capacitores", corto: "Capacitores", color: "var(--brand-primary)" },
  refrigeracion: { label: "Refrigeración", corto: "Refrigeración", color: "var(--brand-green)" },
};

export const VISTAS = ["tabla", "rejilla", "indice"] as const;
export type Vista = (typeof VISTAS)[number];
