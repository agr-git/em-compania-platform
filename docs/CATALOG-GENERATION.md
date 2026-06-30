# Generación del Catálogo de Muestra (IA)

E.M. **no entrega datos reales durante el concurso**. Nosotros generamos con IA una
muestra **representativa** del catálogo (códigos + descripciones) y sobre ella demostramos
la búsqueda y la creación de pedidos.

## Objetivo

Un catálogo creíble que:
- Tenga las **tres familias** del negocio: sellos mecánicos, capacitores, artículos de
  refrigeración.
- Use **códigos contables con formato realista** (ej. `0100178`).
- Tenga **descripciones técnicas** como las reales
  (ej. "sello mecánico 7 octavos, resorte corto Parxial").
- Sea suficiente para demostrar búsqueda por descripción **y** por código, con variedad
  (sinónimos, abreviaturas, medidas en pulgadas/fracciones).

## Pista del enunciado

El código `0100178` corresponde a *"sello mecánico 7 octavos, resorte corto Parxial"*.
Inferimos un esquema de códigos: prefijo de familia + correlativo. Lo respetamos al
generar para que se sienta auténtico.

## Estructura del dataset

`supabase/seed/catalogo.json` — array de objetos:

```json
{
  "codigo_contable": "0100178",
  "descripcion": "Sello mecánico 7/8\" resorte corto Parxial",
  "categoria": "sellos_mecanicos",
  "unidad": "UND",
  "precio_lista": 48500
}
```

## Esquema de códigos sugerido (documentado para coherencia)

| Familia | Prefijo | Ejemplo |
|---|---|---|
| Sellos mecánicos | `01xxxxx` | `0100178` |
| Capacitores | `02xxxxx` | `0200342` |
| Refrigeración | `03xxxxx` | `0300915` |

## Cómo se genera

1. Prompt a un LLM (Claude/Gemini) pidiendo N productos por familia con: código según
   esquema, descripción técnica realista (con medidas en fracciones de pulgada cuando
   aplique), unidad y precio en COP plausible.
2. Validación con Zod del JSON antes de cargar (códigos únicos, formato correcto).
3. `pnpm db:seed` hace *upsert* en `productos`.

## Variedad necesaria para lucir la búsqueda

Incluir a propósito:
- Descripciones con **medidas en fracciones** ("7/8\"", "1 1/2\"") y en palabra
  ("siete octavos") para probar búsqueda flexible.
- **Sinónimos/variantes** ("condensador" vs "capacitor").
- Códigos cercanos para validar que el filtro por código es exacto y no confunde.
- Algunos productos con stock bajo/cero para demostrar el indicador de inventario.

## Cantidad sugerida

~150–300 productos (50–100 por familia). Suficiente para que la búsqueda se sienta real
sin inflar el seed.

> Nota: este catálogo es de demostración. En producción, la fuente de verdad es World
> Office y el equipo de WO migra el catálogo real (~1 día). El esquema de `productos` ya
> contempla `wo_inventario_id` para ese mapeo.
