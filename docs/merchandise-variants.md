# Catálogo y variantes

Supabase es la única fuente de productos de la tienda. Ocultar un producto no activa un respaldo local. Las propuestas no admiten pedidos, incluso si se modifica su stock.

En Admin → Productos → Colores y tallas se crean o editan combinaciones (por ejemplo Morado · M), SKU, imagen, color, existencias, diferencia de precio y visibilidad. Ocultar una variante conserva sus referencias históricas. Las existencias por variante son independientes; el stock general solo se usa en productos sin variantes.

El pedido usa create_merchandise_variant_order: valida producto, variante, precio y existencias; reserva stock en una transacción; guarda nombre y variante como snapshots y devuelve número de pedido. Una misma clave de reintento no crea pedidos duplicados. No realiza cobros. Los pedidos se siguen desde el módulo existente Pedidos.

Verificación: TypeScript y build; editor guardando una variante existente sin cambiar sus datos; producto retirado de la respuesta no reaparece; móvil sin desbordamiento; prueba SQL con rollback de precio, stock, snapshots, idempotencia y rechazo por stock agotado.

## Ampliación local del catálogo · 2026-11-07

La tienda ahora tiene búsqueda por nombre, descripción, categoría, características y variante; filtros de categoría y orden por fecha, nombre o precio; y una ficha accesible con galería navegable, características, color, talla, inventario y precio de la combinación seleccionada. El pedido sigue utilizando la RPC transaccional existente y no cobra en línea.

El panel agrega carga de hasta ocho fotos por producto con compresión previa, vista previa, edición de ficha y características, duplicado como propuesta oculta sin stock, publicación/ocultación, alertas de stock, filtros y exportación CSV. Las variantes guardan talla estructurada además de color, SKU, imagen, precio e inventario.

La migración local `20261108033544_merchandise_product_gallery_variant_sizes.sql` agrega `gallery_urls`, `size_label` y el bucket público separado `merchandise-product-photos`, con escritura y borrado reservados a administración. Está pendiente de aplicar a Supabase antes de desplegar esta interfaz; hasta entonces las nuevas lecturas y cargas no funcionan contra el esquema remoto actual. No se aplicó a la base ni se publicó el sitio.
