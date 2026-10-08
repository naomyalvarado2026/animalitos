# Campañas y registros de práctica

La web y el admin leen `seasonal_campaigns` de Supabase. Los administradores de nivel 4 o superior pueden editar descripción, fechas, acciones, imagen y visibilidad en `/admin/campanas`. Las campañas están identificadas como propuestas; publicar su contenido no confirma una actividad presencial.

Se añadieron cuatro propuestas de producto con renders generados: buzo ($32), manta ($22), termo ($24) y adorno navideño ($9). Precios, composición, medidas y fabricación requieren validación. El inventario permanece en cero y `is_proposal=true` impide crear pedidos reales.

`income_records`, `expense_records` y `orders` tienen `is_demo=false` por defecto. Los ejemplos usan clientes de `example.com`, identificadores estables y descripciones explícitas. La vista **Ejemplos de práctica** del admin permite ensayar el flujo; el dashboard y los reportes solo consultan registros reales. Las restricciones de base de datos impiden publicar un ingreso o egreso de demostración y las proyecciones públicas también los excluyen. Los pedidos de ejemplo no descuentan inventario ni registran pagos.

Aplicar primero `20261008120000_seasonal_content_demo_records.sql`, después ejecutar `node scripts/seed-seasonal-content.mjs` con la credencial privada en `.env.local`. El script comprueba el proyecto esperado y solo inserta filas nuevas, sin sobrescribir cambios del equipo. Nunca subir `.env.local` al repositorio.

Contenido inicial: seis campañas, cinco ingresos de ejemplo, cinco egresos de ejemplo y seis pedidos de ejemplo. Los ingresos simulados suman $469 y los egresos $260; el balance de práctica es $209, sin efecto sobre el balance real.
