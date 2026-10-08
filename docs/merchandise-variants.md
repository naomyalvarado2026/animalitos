# Catálogo y variantes

Supabase es la única fuente de productos de la tienda. Ocultar un producto no activa un respaldo local. Las propuestas no admiten pedidos, incluso si se modifica su stock.

En Admin → Productos → Colores y tallas se crean o editan combinaciones (por ejemplo Morado · M), SKU, imagen, color, existencias, diferencia de precio y visibilidad. Ocultar una variante conserva sus referencias históricas. Las existencias por variante son independientes; el stock general solo se usa en productos sin variantes.

El pedido usa create_merchandise_variant_order: valida producto, variante, precio y existencias; reserva stock en una transacción; guarda nombre y variante como snapshots y devuelve número de pedido. Una misma clave de reintento no crea pedidos duplicados. No realiza cobros. Los pedidos se siguen desde el módulo existente Pedidos.

Verificación: TypeScript y build; editor guardando una variante existente sin cambiar sus datos; producto retirado de la respuesta no reaparece; móvil sin desbordamiento; prueba SQL con rollback de precio, stock, snapshots, idempotencia y rechazo por stock agotado.
