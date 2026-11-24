# Acceso con Google en Android

Implementación local, 24 de noviembre de 2026. Reutiliza el botón existente del proyecto y Supabase Auth con PKCE. Android abre OAuth en el navegador externo; el verificador permanece en el almacenamiento de la WebView. El callback solo transporta un código de un uso y se convierte en la ruta HTTPS de acceso para que Supabase canjee ese código en la misma WebView.

## Configuración requerida antes de usarlo

La consulta pública a `/auth/v1/settings` del proyecto `uxktqlmffongcagaxgtr` confirmó `external.google: false` en esta fecha. No se modificaron ajustes remotos ni credenciales.

1. Crear o reutilizar un cliente OAuth de tipo aplicación web en Google Cloud. Configurar pantalla de consentimiento y usuarios de prueba si corresponde.
2. Registrar en Google el URI de retorno de Supabase: `https://uxktqlmffongcagaxgtr.supabase.co/auth/v1/callback`.
3. Habilitar Google en Supabase Authentication → Sign In / Providers con el Client ID y Client Secret de ese cliente. Mantener esos secretos fuera del repositorio y la APK.
4. Añadir a la lista de URLs de retorno permitidas de Supabase:
   - `adoptame://auth/callback`
   - `https://naomyalvarado2026.github.io/animalitos/admin/login`
5. Instalar la APK nueva y probar con una cuenta del equipo que tenga un perfil activo. Un inicio de sesión Google no concede permisos administrativos ni crea perfiles autorizados.

## Validación en dispositivo pendiente

Comprobar selección de cuenta → consentimiento → regreso a APK → panel permitido; cancelar y reintentar; cuenta sin perfil activo; teléfono sin conexión; retorno con la app cerrada. El intercambio PKCE requiere el almacenamiento original de la app. No se ha realizado un acceso real con Google mientras el proveedor está deshabilitado.

Fuentes: [Supabase Google](https://supabase.com/docs/guides/auth/social-login/auth-google), [retorno a apps nativas](https://supabase.com/docs/guides/auth/native-mobile-deep-linking), [botón shadcn](https://ui.shadcn.com/docs/components/button), [licencia MIT](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md). Se revisó también el botón local de `D:\COMPONENTES`; se conserva el botón Radix existente del proyecto, sin añadir bibliotecas ni animaciones.
