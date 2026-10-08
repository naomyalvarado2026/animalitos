# Aplicación del manual AdoptaME

Referencia: https://www.canva.com/design/DAHW3USwq8s/edit (12 páginas, revisión 87).
Recursos originales: `TRABAJOS IMPORTANTES/AdoptaME/1x` y `Manual de Marca/canva`.

- Páginas 4–5: logos horizontales originales a color y negativo. Se conserva la proporción, con espacio alrededor y sin filtros ni cambios de opacidad. Exportación WebP sin pérdida para cabecera y pie.
- Página 6: coral #ff8069; morado #3c096c; lavanda #e0beff y #f1e2ff tomados del SVG local. Tinta #17022b para texto y superficies oscuras.
- Página 7: Poppins para cuerpo y títulos; carga con `display=swap`.
- Página 8: se mantienen las fotografías y perfiles existentes de los perros.
- Página 10: se conserva la estructura de portada, sus llamadas a adoptar y ayudar, y la fotografía protagonista; se adapta la paleta al manual.

El coral identifica superficies y botones principales de portada. Los enlaces sobre blanco usan morado y los botones coral usan texto oscuro para mejorar contraste. Los tokens de paleta se limitan a la experiencia pública; se conserva la funcionalidad del administrador.

Validación: compilación de producción, TypeScript y 27 pruebas existentes correctos. Comprobación con Edge a 1440, 390 y 320 px sin desbordamiento horizontal ni errores de ejecución. Logos cargados en ambas variantes. Lint conserva advertencias previas de código ajeno a esta adaptación.

Vistas locales: `output/brand/web-1440.png` y `output/brand/web-390.png`.
