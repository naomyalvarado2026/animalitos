# AdoptaME móvil instalable — PWA

Fecha: 17 de noviembre de 2026
Estado: publicada en https://naomyalvarado2026.github.io/animalitos/. Google OAuth y las pruebas en teléfonos reales siguen pendientes.

## Decisión de arquitectura

La web ya usa React, Vite, Tailwind y Supabase, y tenía manifest, iconos, botón de instalación y un service worker básico. Se mantiene como **PWA**, instalable desde Chrome en Android y desde Safari en iPhone. Esta opción conserva una sola interfaz y permite que el contenido web publicado llegue a la experiencia instalada sin mantener proyectos Android/iOS separados.

No se incorpora Capacitor ni se inicia una publicación en tiendas: no hay una función nativa que lo requiera hoy, y una versión empaquetada necesitaría compilación, revisión y distribución para cambios de código. La PWA no equivale a una app publicada en Google Play o App Store.

## Qué incorpora este cambio local

- El `start_url` del manifest abre el modo app (`?app=1`). Al arrancar en modo instalado, la pantalla inicial pide Google. La web abierta en un navegador normal conserva su acceso público.
- El login usa Supabase OAuth y solicita elegir una cuenta de Google. No crea perfiles administrativos ni modifica los roles actuales.
- La PWA muestra el correo de la sesión y ofrece cierre de sesión; el acceso a datos administrativos continúa determinado por los perfiles y políticas existentes.
- El acceso inicial necesita internet. La sesión persiste con la configuración existente de Supabase; una sesión iniciada permite abrir la app sin conexión si el dispositivo conserva sus datos locales.
- El service worker precarga los módulos JavaScript/CSS compilados, los iconos y las fotos locales del directorio `public/images/refugio/` (24 archivos; aproximadamente 3.7 MB en este checkout). El contenido editorial de los 12 perfiles locales permite consultar sus historias guardadas.
- La precarga se genera a partir del manifest de Vite en cada build. Un identificador derivado de ese manifest cambia la versión del caché y permite al service worker preparar los recursos nuevos antes de activar esa versión.
- Los recursos visuales se buscan primero en la red y quedan guardados como respaldo. Los módulos con hash se sirven desde caché para evitar descargas repetidas.
- Cuando no hay conexión, se avisa que los perfiles guardados pueden estar desactualizados y que formularios, solicitudes, donaciones y pedidos requieren conexión. No se encolan ni se declaran completadas acciones sin respuesta del servidor.
- Si se detecta una versión nueva, la app avisa y permite aplicarla desde «Actualizar app». La persona confirma antes del reinicio para no perder un formulario abierto.

## Límites que siguen vigentes

- La sesión inicial y OAuth no pueden completarse offline.
- Historias, disponibilidad, ajustes, productos y otros datos que solo llegan de Supabase no se garantizan sin conexión; el modo offline usa contenido estático local cuando corresponde. La app no afirma que esos datos sean actuales.
- Se conservan perfiles públicos sin obligar a iniciar sesión al visitar la web en el navegador.
- No se implementan notificaciones push, pagos nativos ni envío diferido de formularios.
- El código prepara el flujo de Google, pero el proveedor debe habilitarse en el panel de Supabase y en Google Cloud. Esa configuración no se ha hecho desde el repositorio.
- No se ha comprobado todavía la instalación, OAuth, modo offline o actualización en un dispositivo físico Android/iPhone.

## Configuración externa de Google OAuth

1. En Supabase → Authentication → Providers → Google, habilitar Google e ingresar el OAuth Client ID y Secret de Google Cloud.
2. En Google Cloud, configurar el URI de retorno que muestra el panel de Supabase (normalmente `https://<proyecto>.supabase.co/auth/v1/callback`) y los orígenes autorizados que correspondan.
3. En Supabase → Authentication → URL Configuration, permitir el URL de retorno de la app publicada: `https://naomyalvarado2026.github.io/animalitos/`. Añadir también la URL local de desarrollo durante pruebas.
4. Iniciar sesión desde la PWA en Chrome Android y Safari/iPhone, revisar consentimiento, retorno a la pantalla app, refresco de sesión, expiración, cierre y reapertura sin conexión.
5. Confirmar que una cuenta Google nueva no recibe fila ni rol administrativo en `profiles`. Mantener intactas las políticas RLS existentes.

No guardar credenciales OAuth en este repositorio ni en variables `VITE_*`. El secreto del cliente Google pertenece únicamente a la configuración del proveedor en Supabase.

## Actualizaciones

- **Contenido y datos de Supabase:** se actualizan al conectar con la web/backend; los datos disponibles sin conexión pueden quedar viejos.
- **Interfaz y código de la PWA:** el flujo de publicación actual sirve el frontend nuevo; el service worker precarga el conjunto de recursos del build y ofrece aplicar la nueva versión.
- **Tiendas:** no aplica a esta entrega. Si más adelante se empaqueta el bundle en Capacitor o se publica una app nativa, los cambios de código nativo/embebido necesitarán una nueva compilación y el proceso de distribución de cada tienda. No se debe descargar y ejecutar código remoto para eludir esas revisiones.

## Pruebas de aceptación

Comprobaciones locales tras la implementación:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- Verificar que `dist/pwa-precache.json` contiene recursos `assets/` y las fotos de `images/refugio/`, que `dist/sw.js` no conserve el marcador `__PWA_CACHE_VERSION__`, y que el `start_url` compilado sea `./?app=1`.
- Servir `dist` y simular desconexión: abrir `/animalitos/`, revisar perfiles/fotos guardados, y confirmar el aviso offline. Confirmar que formularios fallen con mensaje útil y no creen una falsa confirmación.
- Volver online, comprobar que el aviso desaparece, visitar la web actualizada y confirmar detección del service worker nuevo.
- En Android Chrome e iPhone Safari: instalar desde el navegador, iniciar sesión con Google, cerrar/abrir la app, probar OAuth/retorno, desactivar red y validar las rutas anteriores. Estos casos requieren teléfonos y configuración real del proveedor.

## Fuentes de plataforma consultadas

- Chrome, instalación PWA: https://developer.chrome.com/docs/modern-web-guidance/guides/pwa/install-web-app
- Apple Support, añadir sitio web a Inicio en iPhone: https://support.apple.com/en-az/guide/iphone/iphea86e5236/26/ios/26
- Supabase, Google social login y deep links: https://supabase.com/docs/guides/auth/native-mobile-deep-linking
- Google, OAuth para apps nativas: https://developers.google.com/identity/protocols/oauth2/native-app
- Apple, App Review Guidelines (2.5.2, 4.2 y 4.8): https://developer.apple.com/app-store/review/guidelines/
- Android, riesgos de carga dinámica de código: https://developer.android.com/privacy-and-security/risks/dynamic-code-loading
