# Guía de operación de AdoptaME

## Puesta en marcha

1. Ejecuta las migraciones de `supabase/antigravity_migrations` en orden, desde `0001` hasta `0013`.
2. Crea el primer usuario desde Supabase Auth.
3. Asigna su perfil con rol `super_admin` y nivel `10`.
4. Cierra y vuelve a abrir sesión para que el menú admin recargue los permisos.

## Si solo aparece Dashboard

El menú usa permisos por nivel:

- `viewer` (1): solo lectura mínima.
- `editor` (4): perros, solicitudes, contenido, productos y módulos editoriales.
- `admin` (7): además configuración y operaciones administrativas.
- `super_admin` (10): además gestión de usuarios.

Si el perfil tiene rol `admin` pero nivel antiguo, aplica `0010_admin_access_levels.sql` o corrígelo desde **Usuarios** con un Super Admin.

## Flujo recomendado de contenido

- **Contenido y Redes:** portada, banner de emergencia, redes, FAQ, misión, visión e introducciones.
- **Editorial:** recursos, residentes del santuario y métodos de donación verificados.
- **Estructura:** pasos de adopción y línea de tiempo institucional.
- **Equipo:** nombres y cargos autorizados.
- **Historias:** casos de adopción con autorización de imagen.
- **En memoria:** homenajes publicados con autorización.
- **Productos:** precio en USD, inventario, imagen y publicación.

## Publicación segura

No publiques datos de prueba, cuentas de pago sin verificar, fotografías sin autorización ni cifras de impacto que no estén respaldadas por registros. Los productos de `0013_merchandising_catalog_drafts.sql` llegan como borradores y deben confirmarse antes de activarse.

## Imágenes

Se aceptan URLs HTTPS o rutas públicas de Supabase. El panel muestra una previsualización y el sitio usa un fallback visual si una imagen deja de estar disponible.
