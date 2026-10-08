# Supabase: reconciliación aplicada

Proyecto: `uxktqlmffongcagaxgtr` (Centro Integral).

Se aplicaron tres migraciones en el editor SQL y se registraron sus versiones:

- `20261008023000`: reconcilia columnas, tablas operativas, tienda, pedidos, memorial, editorial, apadrinamiento, configuración y permisos con el esquema existente.
- `20261008024500`: vistas públicas de finanzas con campos limitados y nombres de donadores no anónimos.
- `20261008025000`: solicitudes públicas pendientes, asignaciones administrativas protegidas y creación de perfiles nuevos sin privilegios administrativos.

Se excluyeron los seeds de demostración y la eliminación de animales. La reconciliación se probó con rollback antes de confirmarla. Se conserva un respaldo JSON de las tablas accesibles y del esquema REST en `.temp/`, excluido de Git. Este respaldo no incluye contraseñas, objetos de Storage ni un dump PostgreSQL completo.

Validación en servidor: tres versiones registradas, cero tablas públicas sin RLS, cero productos de prueba restantes, lectura anónima de perfiles y pedidos denegada. Una transacción con el rol autenticado y la identidad del administrador comprobó lectura de su perfil y escritura de un producto borrador, seguida de rollback. Se verificó la conservación de todos los identificadores previos en las once tablas originales.

La aplicación usa las vistas públicas de transparencia y exige perfil activo para el panel. Se retiraron la sesión demo, las credenciales demo y el perfil superadministrador de respaldo. No se cambiaron contraseñas ni proveedores OAuth.

TypeScript y compilación de producción pasan; las 27 pruebas existentes pasan. Navegación local de tienda, ingresos, egresos y donadores sin errores de ejecución. Una sesión demo local no permite entrar al administrador. No se probó un login real con contraseña.

Los archivos históricos `001`–`011` y `antigravity_migrations` no deben ejecutarse indiscriminadamente sobre esta base. El esquema previo existía sin historial; estas versiones registran únicamente la reconciliación realmente aplicada. Antes de adoptar `supabase db push`, se debe establecer una línea base y revisar las migraciones históricas pendientes.
