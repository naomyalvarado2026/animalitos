# AdoptaME móvil instalable — PWA

Fecha: 17 de noviembre de 2026
Estado: la versión anterior está publicada en https://naomyalvarado2026.github.io/animalitos/. Este refuerzo PWA está implementado y verificado localmente; todavía no está publicado. Google OAuth y las pruebas en teléfonos reales siguen pendientes.

## Decisión de arquitectura

La web ya usa React, Vite, Tailwind y Supabase, y tenía manifest, iconos, botón de instalación y un service worker básico. Se mantiene como **PWA**, instalable desde Chrome en Android y desde Safari en iPhone. Esta opción conserva una sola interfaz y permite que el contenido web publicado llegue a la experiencia instalada sin mantener proyectos Android/iOS separados.

No se incorpora Capacitor ni se inicia una publicación en tiendas: no hay una función nativa que lo requiera hoy, y una versión empaquetada necesitaría compilación, revisión y distribución para cambios de código. La PWA no equivale a una app publicada en Google Play o App Store.

### Comparación de alternativas

| Alternativa | Encaje para AdoptaME | Actualizaciones | Carga de mantenimiento |
| --- | --- | --- | --- |
| PWA existente (recomendada) | Android y iPhone desde el mismo sitio; ya hay manifest, iconos, instalación y service worker. No requiere funciones nativas específicas. | El contenido conectado llega desde el sitio/backend. La interfaz llega al actualizar o reabrir y el service worker prepara la nueva versión; no depende de que una tienda revise cada cambio. | Menor: conserva React/Vite, GitHub Pages y un único código. |
| Capacitor | Añadiría puentes para APIs nativas si fueran necesarias; hoy no se identificó una necesidad concreta. | Los recursos de una versión empaquetada y el código nativo requieren compilar y distribuir una nueva versión. | Mayor: añade proyecto nativo, dependencias y ciclos de compilación para Android/iOS. |
| Nativa por plataforma | Puede cubrir integraciones específicas del sistema, pero duplicaría el recorrido actual sin beneficio identificado. | Publicación y revisión por plataforma para cambios de la app. | Mayor: dos implementaciones y procesos separados. |

La PWA se sirve desde el alojamiento web actual; instalarla no requiere publicarla en una tienda. Mantener la web evita crear dos binarios, aunque no reemplaza las pruebas en equipos reales.

## Qué incorpora este cambio local

- El `start_url` del manifest abre el modo app (`?app=1`). Al arrancar en modo instalado, la pantalla inicial pide Google. La web abierta en un navegador normal conserva su acceso público.
- El login usa Supabase OAuth y solicita elegir una cuenta de Google. No crea perfiles administrativos ni modifica los roles actuales.
- La PWA muestra el correo de la sesión y ofrece cierre de sesión; el acceso a datos administrativos continúa determinado por los perfiles y políticas existentes.
- El acceso inicial necesita internet. La sesión persiste con la configuración existente de Supabase; una sesión iniciada permite abrir la app sin conexión si el dispositivo conserva sus datos locales.
- El service worker precarga el shell, las dependencias públicas que descubre desde las entradas públicas de Vite, los iconos y la página offline. Las fotos locales del directorio `public/images/refugio/` se precargan como recursos opcionales (24 archivos; aproximadamente 3.7 MB en este checkout), para que una foto ausente no impida instalar la app.
- La precarga se genera a partir del manifest de Vite en cada build. Un identificador derivado de ese manifest cambia la versión del caché y permite al service worker preparar los recursos necesarios antes de activar esa versión. Los módulos administrativos no se agregan por defecto a la precarga pública.
- Los recursos visuales se buscan primero en la red y quedan guardados como respaldo. Los módulos con hash se sirven desde caché para evitar descargas repetidas.
- Las navegaciones públicas sin parámetros se guardan bajo su propia ruta, no sobre el shell genérico. Las URLs con parámetros no se persisten, para no guardar códigos OAuth, filtros o valores de formularios. Si falta la ruta y el shell no está disponible, el service worker puede mostrar la página offline independiente.
- Solo se almacenan rutas públicas emitidas en `public-routes.json`; las rutas administrativas o desconocidas no se agregan a la caché de páginas. Las copias de página vencen a los 7 días; el shell y los recursos compilados conservan su versión hasta que se activa otra versión del service worker, que elimina la caché anterior.
- Cuando no hay conexión, se avisa que los perfiles guardados pueden estar desactualizados y que formularios, solicitudes, donaciones y pedidos requieren conexión. El estado combina eventos del navegador con una comprobación ligera de conectividad; esto detecta casos donde `navigator.onLine` permanece en `true` durante una desconexión. No se encolan ni se declaran completadas acciones sin respuesta del servidor.
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
- **Interfaz y código de la PWA:** al publicar estos cambios, el sitio servirá el frontend nuevo; el service worker precargará los recursos públicos de ese build y ofrecerá aplicar la nueva versión.
- **Tiendas:** no aplica a esta entrega. Si más adelante se empaqueta el bundle en Capacitor o se publica una app nativa, los cambios de código nativo/embebido necesitarán una nueva compilación y el proceso de distribución de cada tienda. No se debe descargar y ejecutar código remoto para eludir esas revisiones.

## Pruebas de aceptación

Comprobaciones locales tras la implementación:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- Verificar que `dist/pwa-precache.json` contiene los recursos requeridos, las fotos opcionales de `images/refugio/` y `offline.html`; `dist/public-routes.json` solo las rutas públicas; `dist/sw.js` sin el marcador `__PWA_CACHE_VERSION__`; y el `start_url` compilado `./?app=1`.
- Resultado local: typecheck, lint, 32 pruebas y build pasan. La simulación móvil sin conexión abrió el perfil de Blanquita desde caché y mostró el aviso offline. El aviso también detectó la desconexión aunque `navigator.onLine` siguiera en `true`.
- Lighthouse móvil local: accesibilidad 100 y mejores prácticas 100. Observó un canonical no válido en la vista previa local (SEO 92) y CLS 0.078 (Agentic Browsing 98); estas puntuaciones no son mediciones de producción.
- Servir `dist` y comprobar el fallback offline cuando falta una ruta pública cacheada, además de confirmar que formularios fallen con mensaje útil y no creen una falsa confirmación.
- Volver online, comprobar que el aviso desaparece, visitar la web actualizada y confirmar detección del service worker nuevo. La verificación del perfil sin conexión ya se hizo localmente; el fallback sin shell, formularios offline y transición de actualización quedan pendientes.
- En Android Chrome e iPhone Safari: instalar desde el navegador, iniciar sesión con Google, cerrar/abrir la app, probar OAuth/retorno, desactivar red y validar las rutas anteriores. Estos casos requieren teléfonos y configuración real del proveedor.

## Fuentes de plataforma consultadas

- Chrome, instalación PWA: https://developer.chrome.com/docs/modern-web-guidance/guides/pwa/install-web-app
- MDN, instalación y compatibilidad de PWA: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
- Apple Support, añadir sitio web a Inicio en iPhone: https://support.apple.com/en-az/guide/iphone/iphea86e5236/26/ios/26
- Supabase, Google social login y deep links: https://supabase.com/docs/guides/auth/native-mobile-deep-linking
- Google, OAuth para apps nativas: https://developers.google.com/identity/protocols/oauth2/native-app
- Apple, App Review Guidelines (2.5.2, 4.2 y 4.8): https://developer.apple.com/app-store/review/guidelines/
- Android, riesgos de carga dinámica de código: https://developer.android.com/privacy-and-security/risks/dynamic-code-loading
