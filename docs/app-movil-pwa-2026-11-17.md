# AdoptaME móvil instalable — PWA

Fecha: 17 de noviembre de 2026
Estado: PWA publicada en https://naomyalvarado2026.github.io/animalitos/. El acceso a páginas públicas funciona sin cuenta; falta verificar la instalación en teléfonos reales.

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

- El `start_url` del manifest abre el modo app (`?app=1`), pero ese parámetro no cambia quién puede leer el contenido público. La app abre perfiles y páginas de adopción sin pedir una cuenta.
- No se exige Google ni se crea una sesión solo para navegar: adopción, perfiles, tienda y demás contenido público no tienen una necesidad de cuenta que justifique bloquear la entrada. Esto también permite usar la PWA mientras OAuth no esté configurado.
- El acceso administrativo continúa separado y protegido por el inicio existente, perfiles autorizados y políticas RLS. Autenticarse con Google no concede permisos administrativos.
- El service worker precarga el shell, las dependencias públicas que descubre desde las entradas públicas de Vite, los iconos y la página offline. Las fotos locales del directorio `public/images/refugio/` se precargan como recursos opcionales (24 archivos; aproximadamente 3.7 MB en este checkout), para que una foto ausente no impida instalar la app.
- La precarga se genera a partir del manifest de Vite en cada build. Un identificador derivado de ese manifest cambia la versión del caché y permite al service worker preparar los recursos necesarios antes de activar esa versión. Los módulos administrativos no se agregan por defecto a la precarga pública.
- Los recursos visuales se buscan primero en la red y quedan guardados como respaldo. Los módulos con hash se sirven desde caché para evitar descargas repetidas.
- Las navegaciones públicas sin parámetros se guardan bajo su propia ruta, no sobre el shell genérico. Las URLs con parámetros no se persisten, para no guardar códigos OAuth, filtros o valores de formularios. Si falta la ruta y el shell no está disponible, el service worker puede mostrar la página offline independiente.
- Solo se almacenan rutas públicas emitidas en `public-routes.json`; las rutas administrativas o desconocidas no se agregan a la caché de páginas. Las copias de página vencen a los 7 días; el shell y los recursos compilados conservan su versión hasta que se activa otra versión del service worker, que elimina la caché anterior.
- Cuando no hay conexión, se avisa que los perfiles guardados pueden estar desactualizados y que formularios, solicitudes, donaciones y pedidos requieren conexión. El estado combina eventos del navegador con una comprobación ligera de conectividad; esto detecta casos donde `navigator.onLine` permanece en `true` durante una desconexión. No se encolan ni se declaran completadas acciones sin respuesta del servidor.
- Si se detecta una versión nueva, la app avisa y permite aplicarla desde «Actualizar app». La persona confirma antes del reinicio para no perder un formulario abierto.

## Límites que siguen vigentes

- Las funciones públicas no necesitan sesión. Si más adelante se añade un beneficio personal que sí requiera cuenta, el acceso OAuth debe configurarse y probarse antes de hacerlo obligatorio.
- Historias, disponibilidad, ajustes, productos y otros datos que solo llegan de Supabase no se garantizan sin conexión; el modo offline usa contenido estático local cuando corresponde. La app no afirma que esos datos sean actuales.
- Se conservan perfiles públicos sin obligar a iniciar sesión al visitar la web en el navegador.
- No se implementan notificaciones push, pagos nativos ni envío diferido de formularios.
- No se habilitó Google OAuth porque el contenido público no necesita cuenta y no existe una función personal que requiera iniciar sesión en esta app. No se guardaron ni solicitaron credenciales.
- No se ha comprobado todavía la instalación ni la actualización en un dispositivo físico Android/iPhone.

## Cuentas y Google OAuth

Las páginas públicas y la navegación instalada son accesibles sin cuenta. Las rutas de administración conservan el inicio de sesión y las comprobaciones de perfil/rol ya existentes. Google no se habilita solo por instalar la PWA: se configurará cuando exista una función personal concreta que lo requiera, con retorno aprobado en Supabase y Google Cloud y pruebas de sesión/logout. Una cuenta Google nunca debe recibir un rol administrativo automáticamente.

No guardar credenciales OAuth en el repositorio ni en variables `VITE_*`. Si se añade este flujo en el futuro, el secreto del cliente Google pertenece únicamente a la configuración privada del proveedor en Supabase.

## Actualizaciones

- **Contenido y datos de Supabase:** se actualizan al conectar con la web/backend; los datos disponibles sin conexión pueden quedar viejos.
- **Interfaz y código de la PWA:** el sitio sirve el frontend nuevo; el service worker precarga los recursos públicos de ese build y ofrece aplicar la nueva versión.
- **Tiendas:** no aplica a esta entrega. Si más adelante se empaqueta el bundle en Capacitor o se publica una app nativa, los cambios de código nativo/embebido necesitarán una nueva compilación y el proceso de distribución de cada tienda. No se debe descargar y ejecutar código remoto para eludir esas revisiones.

## Pruebas de aceptación

Comprobaciones locales tras la implementación:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- Verificar que `dist/pwa-precache.json` contiene los recursos requeridos, las fotos opcionales de `images/refugio/` y `offline.html`; `dist/public-routes.json` solo las rutas públicas; `dist/sw.js` sin el marcador `__PWA_CACHE_VERSION__`; y el `start_url` compilado `./?app=1`.
- Resultado local: typecheck, lint, 36 pruebas y build pasan. La precarga compilada contiene 95 recursos requeridos, 24 fotos opcionales y 38 rutas públicas.
- Vista previa local con `?app=1`: el inicio público aparece sin pedir Google ni ocultar los controles de navegación.
- Despliegue público verificado: GitHub Actions completó la publicación del commit `e35e92f` con éxito. La web entrega `offline.html`, `public-routes.json` y `pwa-precache.json` con HTTP 200; la lista contiene 38 rutas públicas, 0 rutas administrativas, y la precarga tiene 95 recursos requeridos y 24 fotos opcionales sin bundles administrativos.
- Lighthouse móvil local: accesibilidad 100 y mejores prácticas 100. Observó un canonical no válido en la vista previa local (SEO 92) y CLS 0.078 (Agentic Browsing 98); estas puntuaciones no son mediciones de producción.
- Producción, Playwright en contexto aislado: se visitó Blanquita con conexión para completar la caché (120 recursos iniciales; 123 tras guardar la ficha y fotos) y luego se desconectó realmente la red con `context.setOffline(true)`. La ruta abrió el título, la historia y el aviso de contenido guardado potencialmente desactualizado.
- Producción, Playwright: al vaciar la caché del shell y abrir una ruta sin copia, apareció la página independiente «Sin conexión | AdoptaME» con opción para reintentar.
- Las pruebas automatizadas del service worker comprueban ruta fresca offline, descarte a los 7 días, respaldo del shell, página offline independiente y no persistencia de rutas administrativas ni URLs con parámetros.
- Aún falta verificar que formularios fallen con mensaje útil y no creen una falsa confirmación, la transición visual de actualización y la recuperación tras volver a conectarse.
- En Android Chrome e iPhone Safari: instalar desde el navegador, abrir contenido público, desactivar red, validar la caché y comprobar actualización al regresar en línea. La app no requiere OAuth para estas pruebas; aún hace falta probarlas en teléfonos físicos.

## Fuentes de plataforma consultadas

- Chrome, instalación PWA: https://developer.chrome.com/docs/modern-web-guidance/guides/pwa/install-web-app
- MDN, instalación y compatibilidad de PWA: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
- Apple Support, añadir sitio web a Inicio en iPhone: https://support.apple.com/en-az/guide/iphone/iphea86e5236/26/ios/26
- Supabase, Google social login y deep links: https://supabase.com/docs/guides/auth/native-mobile-deep-linking
- Google, OAuth para apps nativas: https://developers.google.com/identity/protocols/oauth2/native-app
- Apple, App Review Guidelines (2.5.2, 4.2 y 4.8): https://developer.apple.com/app-store/review/guidelines/
- Android, riesgos de carga dinámica de código: https://developer.android.com/privacy-and-security/risks/dynamic-code-loading
