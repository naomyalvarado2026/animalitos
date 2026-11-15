# Contenido de la tienda AdoptaME — 14 de noviembre de 2026

## Alcance

Revisión de las nueve fichas del catálogo: descripciones propias para cada artículo, detalles de diseño y uso, y características propuestas expresadas como referencias. El contenido anterior está respaldado en `output/store-content-2026-11-14/catalog-before.json` del espacio de trabajo original.

El texto listo para asociar al catálogo está en [store-product-content-2026-11-14.json](store-product-content-2026-11-14.json).

## Decisiones editoriales

- Se describe el diseño de cada artículo y situaciones cotidianas en las que podría usarse.
- `Termo Huellas` pasa a llamarse `Tomatodo Huellas AdoptaME`; conserva su slug. Se retira la afirmación de cierre deslizante, porque las imágenes muestran modelos diferentes.
- Los buzos se agrupan en `Ropa solidaria`; el tomatodo, en `Uso diario`.
- La ficha textil distingue la manta de la alternativa de toalla aprobada por Nicola para su galería.
- Materiales, medidas, tallas, acabados y prestaciones continúan como propuestas pendientes de confirmar con producción. Las indicaciones de cuidado que no tienen respaldo se sustituyen por datos pendientes de validar.
- Las escenas con personas se identifican como ilustraciones generadas con IA en las características de las fichas correspondientes. No representan clientes, voluntarios ni testimonios reales.

## Escenas de uso

Generadas con la herramienta integrada ImageGen a partir de las imágenes aprobadas en este chat. Se revisaron logo, colores, forma del producto y anatomía visible antes de preparar los archivos web.

| Imagen nueva | Fichas | Variante cuya foto se actualiza |
| --- | --- | --- |
| `tomatodo-paseo-ia.webp` | Tomatodo Huellas AdoptaME | Ninguna; el negro se muestra como alternativa de diseño en galería |
| `camiseta-bolso-paseo-ia.webp` | Camiseta y tote bag | Camiseta morada y tote crema |
| `taza-en-casa-ia.webp` | Taza | Blanco |

Archivos web: `public/brand/merch/lifestyle-2026-11-14/`. Originales PNG y especificaciones completas de generación: `output/store-content-2026-11-14/` (`image-prompts.json`, `image-manifest.json`). No se sustituyen ni eliminan las fotos anteriores de las galerías.

## Publicación

Primero se publican las imágenes y se comprueba su disponibilidad; después se asocian los textos y galerías al catálogo de Supabase con una transacción que exige coincidencia con los valores revisados. Solo cambian textos, dos categorías, el nombre del tomatodo y las imágenes indicadas. Precios, inventario, estado de propuesta e identificadores se conservan.

Fuente editorial: catálogo vigente de Supabase, imágenes y decisiones de este chat, y `supabase/migrations/20261008060000_merchandise_proposal_catalog.sql`. No se añaden garantías de rendimiento, plazos de entrega, porcentajes de donación ni datos de fabricación.
