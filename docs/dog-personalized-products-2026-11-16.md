# Productos personalizados por perrito — 16 de noviembre de 2026

## Colección inicial

12 propuestas de camiseta, una por cada ficha real de la manada: Blanquita, Brandon, Cheesy, Lobo, Manchas, Max, Minnie, Moana, Noah, Scooby, Tigresa y Yeri. Se conservaron las referencias de Blanquita y Brandon; se cambió la patita del corazón a coral en Lobo y Cheesy; los otros ocho retratos se generaron con sus fotos de ficha y la composición de referencia. La gorra que aparece en los mockups es ambientación, no otro producto incluido.

Imágenes web: `public/brand/merch/dogs-2026-11-16`, con versiones 960 y 480 px. Textos y asociaciones: `dog-personalized-products-2026-11-16.json`. Los PNG, prompts y respaldos originales están en `output/dog-products-2026-11-16/` del espacio de trabajo original. Herramienta integrada ImageGen; no se usó la API/CLI de generación.

## Vinculación

La columna `products.dog_slugs` permite asociar un producto con uno o más perfiles, y mostrar todos los productos asociados a cada perrito. Se utilizan los slugs canónicos porque las doce fichas reales pueden proceder del catálogo editorial local y no tienen necesariamente un UUID en `animals`. No se alteran las historias, fotos ni estados de adopción para crear esta relación.

- Ficha del perrito: sección «La colección de…» con productos publicados y enlaces directos.
- Tienda: filtro «Productos por perrito», búsqueda por nombre, enlaces a su historia y apertura directa con `?perrito=lobo&producto=camiseta-lobo`.
- Admin → Productos → editor: selección múltiple «Perritos de este diseño». Se guarda junto con el producto en la misma actualización; sin selección es un producto general. Duplicar conserva las asociaciones, como propuesta oculta.
- Una consulta compartida del catálogo mantiene la misma información en tienda y perfiles. Cargas, errores y ausencia de productos tienen tratamiento explícito.

## Datos y permisos

Migración aditiva `20261116121004_dog_personalized_products.sql`: array validado e índice GIN; se conservan los permisos/RLS actuales de productos (lectura pública de activos y escritura administrativa nivel 4). No se añaden funciones privilegiadas ni tablas con datos privados.

El alta de doce propuestas usa slugs, no UUID prefijados. Hereda el precio de referencia de la camiseta general vigente (18 USD al preparar la colección). Las doce fichas inician sin existencias y como propuestas; no hay pago ni fabricación confirmados. El alta es idempotente y conserva productos previos.

## Selección de interfaz

Se aplicó `pick-ui-library`. shadcn MCP no devolvió registros configurados y se consultaron su Checkbox y licencia MIT oficiales; Radix Checkbox se revisó como referencia accesible. HeroUI v3.2.7 Card/CheckboxGroup fue consultado, pero sumaría otro sistema visual y dependencias. Magic UI Dither Field Card Demo fue revisado: su efecto no aporta a esta selección ni a las fotos. Se conservaron Card/Button/tokens locales y casillas HTML nativas con etiquetas, fieldset, foco visible y área táctil suficiente. No hay nueva dependencia ni animación decorativa.

Fuentes: https://ui.shadcn.com/docs/components/checkbox ; https://github.com/shadcn-ui/ui/blob/main/LICENSE.md ; https://www.radix-ui.com/primitives/docs/components/checkbox ; https://heroui.com/docs/react/components/card.mdx ; registro MCP de Magic UI `dither-field-card-demo`.

## Comprobaciones

Typecheck, lint de archivos afectados y build de 38 rutas correctos. Se revisa la publicación de archivos antes de dar de alta las doce propuestas. Evidencias de catálogo y navegador se conservan en `output/dog-products-2026-11-16/`. No se cambian las ediciones ajenas existentes en el checkout original.
