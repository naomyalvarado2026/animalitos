# Publicación integral de AdoptaME — 16 noviembre 2026

## Alcance
Integración de todas las ediciones pendientes del checkout principal sobre `af7e5df`, conservando las 12 colecciones por perrito, las 21 fichas y las galerías ya publicadas. Autorización: «publica todo de forma logica e increíble».

## Recorrido público
- Inicio: accesos directos a la manada, adultos, seniors, cuidados especiales y orientación de afinidad. Los enlaces llegan a la sección correspondiente después de cargar la galería. Se evita destacar cachorros cuando el catálogo canónico no tiene ninguno y no se asocia la edad senior con un temperamento supuesto.
- Búsqueda global: perfiles por nombre y personalidad junto con páginas y preguntas públicas; resultados con categoría identificada, entrada enfocada, navegación nativa y cierre con Escape.
- Adopción: filtros de modo, tamaño, edad y texto en la URL, con etiquetas para eliminarlos y limpieza conjunta. La URL es la fuente del estado para que recarga y navegación no lo sobrescriban con valores anteriores.
- Tienda: se conservan filtro por perrito, enlaces a su historia y apertura directa de producto. Las fotos alternativas aparecen al apuntar o enfocar la imagen, una vez cargadas; la principal sigue disponible si falla la alternativa. Limpieza completa de categoría, texto, orden y perrito. Tres controles distribuidos en móvil y escritorio.
- Navegación: progreso de lectura decorativo y botón «Volver arriba» con espacio para navegación móvil y área segura; al usarlo se enfoca el contenido principal. Se respeta movimiento reducido y se actualiza el progreso cuando cambia la altura del contenido.

## Componentes y mantenimiento
Se inspeccionaron React 19.2.8, React Router 7.18.2, Motion 12.43.0, Tailwind 4.3.3 y los controles y tokens existentes (versiones instaladas según lockfile). No se añadieron paquetes.

Catálogos consultados: Magic UI Scroll Progress (MCP, fuente y documentación) y shadcn/ui Command (documentación Radix y Base UI). Ambos repositorios publican licencia MIT; consulta del 16-11-2026. El patrón de progreso se adaptó al componente local, con Motion ya instalado y observación de cambios de altura. Se mantuvieron AccessibleDialog, enlaces y selectores nativos; Command agregaría otra dependencia para una búsqueda que ya tiene comportamiento modal.

Fuentes: https://magicui.design/docs/components/scroll-progress ; https://raw.githubusercontent.com/magicuidesign/magicui/main/LICENSE.md ; https://ui.shadcn.com/docs/components/radix/command ; https://github.com/shadcn-ui/ui/blob/main/LICENSE.md . No se envió código ni datos del proyecto a generadores externos.

## Límites
Sin cambios de precios, inventario ni asociaciones en la base de datos. Las imágenes y productos personalizados siguen identificados como propuestas. No se ejecutó la suite de pruebas unitarias; se conserva el caso de búsqueda por perro que ya estaba pendiente en el checkout original. El guardado administrativo autenticado queda fuera de esta publicación de interfaz.

## Evidencia de entrega
Typecheck, lint de los archivos afectados y build de 38 rutas correctos. La bitácora y la evidencia del despliegue y recorrido público se guardan en `output/publication-all-2026-11-16/` del checkout principal (archivos de trabajo excluidos del repositorio). La comprobación de navegador es acotada a los recorridos revisados; no constituye una certificación de accesibilidad.
