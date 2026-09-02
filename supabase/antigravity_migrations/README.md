# Migraciones SQL para Antigravity

Estas migraciones son una capa posterior a `supabase/migrations/001`–`008`. No se ejecutan desde esta aplicación ni incluyen datos ficticios.

## Orden de ejecución

1. `0001_security_baseline.sql` — cierra la escalada automática y endurece funciones.
2. `0002_public_views_and_rls.sql` — separa datos públicos de datos internos.
3. `0003_dogs_only_and_adoption_quality.sql` — deja el catálogo preparado únicamente para perros.
4. `0004_adoption_workflow.sql` — evita solicitudes duplicadas y registra estados.
5. `0005_merchandise_orders.sql` — crea productos, variantes, pedidos e historial.
6. `0006_public_forms_hardening.sql` — limita y valida formularios públicos.
7. `0007_public_metrics.sql` — crea métricas agregadas sin exponer finanzas sensibles.
8. `0008_audit_and_adoption_history.sql` — registra cambios administrativos y estados de adopción.
9. `0009_public_merchandise_checkout.sql` — crea el checkout público transaccional en USD y el historial de estados de pedidos.
10. `0010_admin_access_levels.sql` — corrige perfiles administrativos antiguos que solo muestran Dashboard.
11. `0011_product_admin_policies.sql` — habilita la gestión administrativa segura del catálogo.
12. `0012_memory_memorial.sql` — crea el memorial público “En memoria de” y sus políticas RLS.
13. `0013_merchandising_catalog_drafts.sql` — carga productos iniciales como borradores, sin publicarlos ni asignar inventario.
14. `0014_animal_operations.sql` — crea fichas médicas, tareas y movimientos internos por animal.
15. `0015_adoption_story_profiles.sql` — añade narrativa, publicación, orden y datos verificables para los perfiles de adopción.

## Antes de ejecutar

- Ejecuta primero las migraciones base 001–008 o el esquema equivalente.
- Haz un respaldo del proyecto.
- La moneda operativa de AdoptaME es `USD`; verifica que productos y pedidos conserven ese valor.
- Antes de probar la tienda, crea los productos reales en `products` con `slug`, precio en centavos USD, inventario e `is_active = true`.
- Crea manualmente el primer usuario administrativo desde Supabase Auth y asigna su perfil de forma controlada.
- No ejecutes los seeds antiguos en producción: contienen contactos, cuentas y animales de demostración.
- Después de aplicar las migraciones, cambia la aplicación para leer las vistas públicas y usa la función transaccional de adopción.

## Pruebas mínimas

Comprueba con `anon` y `authenticated` que el público puede leer solo vistas públicas, no puede leer solicitudes, contactos, donadores privados ni finanzas completas, y no puede cambiar roles ni estados administrativos.
