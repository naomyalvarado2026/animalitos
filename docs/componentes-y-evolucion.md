# Componentes para que AdoptaME crezca con coherencia

Fecha de revisión: 31 de agosto de 2026.

## Investigación y criterio

Se realizó una comparación cualitativa de recorridos públicos, no un estudio estadístico de mercado. No contamos con métricas propias de abandono, consultas de soporte o conversión para atribuir mejoras porcentuales.

- [Battersea: preguntas sobre adopción](https://www.battersea.org.uk/dogs/dog-rehoming-faq) combina búsqueda, preguntas concretas y acceso al proceso. Aplicación: resolver dudas cerca de la decisión y ofrecer un centro de ayuda común.
- [Best Friends: voluntariado](https://bestfriends.org/volunteer) presenta distintas formas de participar. Aplicación: facilitar el descubrimiento de alternativas a adoptar mediante destinos y vocabulario compartidos.
- [W3C: patrón de diálogo modal](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) y [técnica H102](https://www.w3.org/WAI/WCAG21/Techniques/html/H102) fundamentan el uso de un diálogo nativo con nombre accesible, foco inicial, cierre con Escape y retorno al elemento de apertura.

La guía de sitio administrable se aplicó a la arquitectura: una fuente de contenido sirve al editor y a varias páginas, sin duplicar textos ni añadir servicios innecesarios. La validación en navegador se hizo con la skill de browser sobre el servidor local.

## Implementación entregada

| Componente | Uso actual | Cómo se amplía |
| --- | --- | --- |
| Buscador global | Cabecera y página 404; acceso con Ctrl/Cmd + K | Registrar nuevas páginas públicas en `src/lib/publicDiscovery.ts` |
| Centro de ayuda | `/faq`, búsqueda por palabras y cinco categorías, enlaces con filtros | Editar preguntas desde Contenido & Redes |
| Preguntas contextuales | Cómo funciona, Ayudar y Tienda | Reutilizar `ContextualFaq` con su categoría |
| Acordeón de preguntas | Centro de ayuda y bloques contextuales | `FaqAccordion` comparte interacción y estilos |
| Diálogo accesible | Buscador | Reutilizar `AccessibleDialog` en futuras ventanas independientes |
| Estados vacíos | Búsquedas sin coincidencias y errores recuperables | Reutilizar `EmptyState` con título, explicación y acciones |
| Recuperación 404 | Rutas desconocidas | Ofrece inicio, búsqueda, adopción, ayuda y contacto |

La búsqueda incluye 14 destinos públicos y las preguntas configuradas. No busca expedientes, usuarios, solicitudes privadas, fichas individuales de animales ni productos individuales. No envía el texto de búsqueda a un servicio externo; los filtros del centro de ayuda están en la ruta hash del navegador.

La página 404 conserva la ruta desconocida y añade `noindex`. Al ser una SPA con HashRouter, esto no cambia la respuesta HTTP del servidor a 404 ni sustituye una futura estrategia de SEO/SSR.

## Conexión con el panel admin

1. Abrir **Contenido & Redes → Preguntas frecuentes**.
2. Crear o editar una pregunta y asignar Adopción, Donaciones, Visitas, Voluntariado o Tienda.
3. Usar las flechas para cambiar el orden. Las tres primeras preguntas de una categoría alimentan su bloque contextual donde esté integrado.
4. **Ver ayuda pública** abre el contenido guardado; no es una previsualización de cambios sin publicar.
5. **Guardar Cambios** valida preguntas/respuestas completas y preguntas no repetidas, conserva el orden y utiliza la clave existente `site_settings.faq_items`.

Se mantiene la invalidación de las consultas públicas tras guardar. No hay migración de base de datos, nuevas tablas ni nuevas dependencias. Las políticas de acceso y el mecanismo de guardado existentes no se han modificado.

Un catálogo guardado como `[]` se respeta: no se repone automáticamente. Las categorías sin preguntas ocultan su bloque contextual. Los textos de respaldo se usan solamente cuando falta una configuración válida; no se mezclan con preguntas ya configuradas. Durante la carga, el buscador solo muestra páginas, no respuestas provisionales.

En el entorno revisado había cuatro preguntas configuradas y ninguna de Tienda. Por eso el bloque de Tienda está preparado pero permanece oculto hasta publicar contenido de esa categoría. Las categorías Donaciones y Visitas están disponibles en el centro de ayuda; sus páginas aún no incorporan el bloque contextual.

## Verificación y límites

- 17 pruebas automáticas de normalización, categorías, compatibilidad, catálogos vacíos, validación, búsqueda, orden, límites y enlaces codificados: correctas.
- Compilación de producción: correcta.
- Lint: sin errores; conserva advertencias anteriores de importaciones sin uso y escapes en módulos ajenos a esta entrega.
- Navegador: centro de ayuda y buscador en escritorio/móvil, navegación compacta de tablet a 820 px, editor a 390 px, preguntas contextuales de adopción y voluntariado, enlaces a preguntas con filtros, estado sin coincidencias y recuperación 404.
- Buscador: apertura con Ctrl + K, foco inicial en el campo, cierre con Escape y retorno al botón comprobados. Usa la modalidad nativa de `dialog`; queda pendiente una auditoría completa con lectores de pantalla y distintos navegadores.
- Editor: categoría y reordenamiento comprobados como cambios temporales y descartados al recargar. No se guardaron cambios de prueba en el contenido publicado. El guardado real con permisos/RLS debe verificarse en un entorno de pruebas autorizado.
- Se corrigió `npm run typecheck` para que compruebe los proyectos reales de TypeScript. Ahora revela inconsistencias anteriores en actividades, finanzas, donadores y datos de demostración; no debe interpretarse la compilación de Vite como una comprobación completa de tipos. Los nuevos componentes no figuran entre los errores detectados.

Para ejecutar las pruebas nativas que importan TypeScript, usar Node con soporte de eliminación de tipos (validado con Node 24). Comandos: `npm test`, `npm run lint`, `npm run build` y `npm run typecheck`.

## Siguientes fases propuestas (no implementadas)

1. **Base técnica:** reconciliar tipos con el esquema real, revisar permisos y probar guardados en staging. Criterio de cierre: typecheck limpio y lectura/escritura verificada por rol.
2. **Contenido y orientación:** publicar respuestas revisadas de Tienda, extender ayuda contextual a Donaciones/Contacto e incorporar breadcrumbs donde exista una jerarquía útil. Medir consultas repetidas solo con un plan de privacidad definido.
3. **Formularios robustos:** unificar resumen de errores, estados de envío y prevención de duplicados; definir borradores sin guardar datos personales sin consentimiento. Probar desconexión y reintentos.
4. **Seguimiento seguro:** consultar el estado de solicitudes/pedidos mediante un acceso autorizado o token de alcance limitado. Requiere decisiones de identidad, caducidad, permisos y canal de entrega; nunca exponer un buscador de solicitudes por correo.
5. **Contenido a escala:** búsqueda de fichas/productos desde vistas públicas, paginación y filtros con resultados reales. Añadir indexación remota solo si el tamaño y las métricas lo justifican.
6. **Servicios externos, solo después:** newsletter, notificaciones, pagos o asistente conversacional requieren responsables, proveedor, presupuesto, consentimiento y políticas. No se añaden botones que aparenten enviar o cobrar sin un servicio operativo.

Los efectos 3D no se priorizan en esta fase: el objetivo es hacer encontrable y mantenible el contenido existente, con estados claros, adaptación móvil y un lenguaje visual común.
