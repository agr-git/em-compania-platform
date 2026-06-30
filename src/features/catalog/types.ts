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
