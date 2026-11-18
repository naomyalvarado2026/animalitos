# Prompts para seguir mejorando la PWA de AdoptaME

Usa estos prompts con el repositorio abierto en `C:\Users\Nicola\Esteban Nicola\CODE\Animalitos`. Primero pega el prompt de auditoría; luego elige una mejora concreta y ejecútala con revisión y pruebas.

## 1. Investigar ideas actuales y oportunidades reales

```text
Actúa como especialista en PWA y experiencia móvil. Analiza el repositorio AdoptaME / Animalitos antes de proponer cambios: arquitectura, Vite y GitHub Pages bajo /animalitos/, componentes, manifest, service worker, cachés, Supabase, formularios y despliegue.

Investiga la documentación oficial vigente de Chrome/Android, Apple/iOS, MDN y Supabase solo para las capacidades relacionadas con los hallazgos. Aporta enlaces y fecha; separa hechos verificados, hipótesis y recomendaciones. No presentes como disponible una API o comportamiento que no hayas confirmado.

Identifica fricciones concretas de instalación, navegación con una mano, uso offline, privacidad en teléfonos compartidos, accesibilidad, rendimiento, actualizaciones y recuperación de conexión. Ordénalas por impacto para personas adoptantes y costo de mantenimiento. Propón como máximo cinco mejoras pequeñas, cada una con evidencia, criterio verificable y riesgos. Conserva la identidad visual, las rutas públicas sin cuenta y la separación de administración. No agregues framework ni dependencia si una solución existente basta.
```

## 2. Implementar una mejora PWA de principio a fin

```text
Implementa la oportunidad [DESCRIBE UNA MEJORA] en AdoptaME. Antes de editar, inspecciona el código, el estado de Git y las instrucciones del repositorio. Conserva el trabajo del usuario y limita el cambio a los archivos necesarios.

Mantén React/Vite y el despliegue bajo /animalitos/. Respeta accesibilidad, teclado, foco visible, pantallas pequeñas, movimiento reducido y la identidad actual. No hagas públicos datos privados ni vuelvas obligatorio Google para explorar el contenido. Mantén administración, roles y políticas RLS separados.

Define el comportamiento esperado en conexión, offline, almacenamiento lleno, sesión vencida y reconexión. Añade o adapta pruebas automatizadas para los casos afectados. Ejecuta typecheck, lint, tests y build. Inspecciona el diff y reporta exactamente qué cambió, qué pruebas pasaron y qué requiere un teléfono o cuenta real. No publiques sin autorización explícita.
```

## 3. Diseñar una prueba offline segura para formularios

```text
Revisa los formularios públicos de adopción, voluntariado, contacto, donaciones, apadrinamiento y tienda. Sin enviar datos reales ni alterar Supabase, prepara pruebas con datos sintéticos y una red simulada como offline.

Verifica que cada envío falle de forma comprensible, nunca muestre una confirmación de éxito antes de una respuesta exitosa del servidor, no cree colas silenciosas y no conserve nombres, correos, teléfonos o contenido de formulario en URLs, CacheStorage o almacenamiento local. Comprueba el estado al volver la conexión. Si una prueba pudiera llegar al backend real, intercepta la petición antes del envío.

Distingue resultados de navegador automatizado y de dispositivo físico. Corrige solo fallos reproducibles y añade cobertura automatizada para evitar regresiones.
```

## 4. Revisar publicación y experiencia instalada

```text
Prepara la publicación web de la PWA AdoptaME. Comprueba el remoto y propietario correctos, el estado de Git, los cambios incluidos y el workflow de GitHub Pages. Excluye archivos personales o no relacionados. Ejecuta las comprobaciones del proyecto, publica únicamente los archivos revisados y espera el resultado del workflow.

Después verifica la URL de producción: HTTPS, manifest, start_url dentro del scope /animalitos/, iconos, service worker activo, rutas públicas, offline shell, actualización y ausencia de rutas administrativas en caché. Limpia caché únicamente en el perfil de prueba si una versión antigua impide comprobar el resultado; no cambies datos reales. Reporta URL, commit, workflow y pruebas verificadas.

Deja aparte la instalación física: explica los pasos de Android Chrome e iPhone Safari y marca esa prueba pendiente si no se hizo con el teléfono correspondiente. No publiques en tiendas, no firmes binarios y no manejes credenciales.
```

## 5. Comparar PWA, Capacitor y app nativa con una necesidad concreta

```text
Evalúa si AdoptaME necesita seguir como PWA o añadir Capacitor/app nativa para esta necesidad: [DESCRIBE LA FUNCIÓN MÓVIL]. Examina primero si la web/PWA actual ya la cubre. Consulta documentación oficial vigente para permisos, compatibilidad, actualización, políticas de tienda y costos de operación.

Compara solo las opciones que resuelvan la necesidad. Distingue cambios de contenido que llegan desde la web de cambios de código embebido que requieren nueva compilación/distribución. Estima la carga de mantenimiento sin inventar costos. Recomienda la opción suficiente y enumera la evidencia o dispositivo real necesario para confirmar la decisión. No implementes ni publiques hasta presentar la comparación.
```

