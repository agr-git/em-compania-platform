import { NextResponse } from "next/server";

/** Plantilla CSV de inventario para descargar. */
export function GET() {
  const csv = [
    "codigo_contable,descripcion,categoria,unidad,precio_lista,stock",
    '0100178,"Sello mecánico 7/8"" resorte corto Parxial",sellos_mecanicos,UND,48500,12',
    "0200342,Capacitor de marcha 40 microfaradios 440V CBB65,capacitores,UND,32500,30",
    "0300949,Gas refrigerante R-410A cilindro 11.3 kg,refrigeracion,UND,285000,5",
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="plantilla-inventario.csv"',
    },
  });
}
