# Perfiles e historias del refugio

Revisión: 2 de septiembre de 2026.

## Decisión de producto

Se revisaron 12 retratos y 12 historias entregadas por el refugio. La experiencia prioriza primero quién es cada perro y después presenta edad, salud, personalidad, hogar ideal y convivencia. La decisión sigue tres referencias oficiales:

- [Best Friends: cómo escribir un perfil de adopción](https://bestfriends.org/network/resources-tools/pet-profiles-how-write-pet-adoption-bio) recomienda abrir con la personalidad y desplazar la ficha técnica a un segundo nivel.
- [Humane World: encontrar un nuevo hogar](https://www.humaneworld.org/en/resources/need-find-your-pet-new-home) recomienda una foto de calidad y transparencia sobre personalidad, convivencia, salud y conducta.
- [Battersea: preguntas de reubicación](https://www.battersea.org.uk/dogs/dog-rehoming-faq) explica que cada animal tiene criterios individuales y que el objetivo es encontrar un match responsable, no prometer una adopción automática.

No es un estudio cuantitativo de mercado: no se dispone de analítica propia ni tasas comparables de conversión. Es una comparación cualitativa de prácticas de comunicación y matching.

## Datos identificados

| Perro | Edad | Dato esencial | Hogar/convivencia |
| --- | --- | --- | --- |
| Blanquita | 4 años | Sana; vacunas y desparasitación al día | Familia muy activa |
| Brandon | Aprox. 4 años | Recuperado de sarna | Espacio para correr y juego |
| Cheesy | 4 años | Recuperado tras rehabilitación | Única mascota; sin perros ni gatos |
| Lobo | Aprox. 7 años | Grande; recuperado de erliquia | Familia con atención y descansos |
| Manchas | Senior; edad sin cifra | Desgaste de cadera | Hogar tranquilo que respete su espacio |
| Max | 9 años | Senior; recuperado de erliquia | Única mascota |
| Minnie | 5 años | Sana y esterilizada | Familia que disfrute jugar |
| Moana | 4 años | Fuerte instinto de caza | Única mascota; sin perros, gatos ni aves |
| Noah | 9 años | Senior sana e independiente | Calma; preferiblemente sin niños pequeños ni mascotas invasivas |
| Scooby | 6 años | Secuela estética en el labio sin impacto funcional | Familia paciente y tranquila |
| Tigresa | 8 años | Tratamiento cardíaco continuo | El texto recibido quedó incompleto; no se inventó el dato |
| Yeri | 6 años | Recuperada de parálisis temporal y cirugía | Cariño, atención y espacio para correr |

El archivo de imagen se llama `Minie.jpg`, pero el texto fuente identifica a la perrita como **Minnie**. Se usa Minnie como nombre público. El relato de Tigresa finaliza en “que pueda garantiza”; por ello, el hogar ideal queda vacío y el panel lo señala como pendiente.

No se dedujeron razas. Solo Lobo se marca como grande porque es el único tamaño explícito. Solo Blanquita aparece con vacunas al día porque es el único texto que lo confirma. Para Brandon y Lobo se conserva la edad como aproximada; para Manchas queda sin cifra.

## Persistencia y administración

La migración `0015_adoption_story_profiles.sql` amplía `animals` con edad aproximada, vacunación verificable, personalidad, hogar ideal, convivencia, publicación, orden y momento de marca. La política pública excluye borradores y estados no adoptables.

El panel **Rescatados** permite:

1. Sincronizar los 12 perfiles base después de aplicar la migración. La sincronización crea registros ausentes y actualiza los que compartan `adoption_slug`.
2. Crear perros nuevos con los mismos campos.
3. Mantener perfiles como borrador mediante “Visible en la web”.
4. Editar historia, salud, personalidad, hogar ideal, convivencia, cuidados especiales, foto y orden.
5. Activar opcionalmente un momento editorial AdoptaME y personalizar su frase.

Las fotos se copiaron a `public/images/refugio/`. Las futuras imágenes de cuerpo completo sin fondo pueden añadirse como un campo/activo secundario sin sustituir estos retratos; la galería ya conserva `gallery_urls` para esa evolución.

## Publicación

1. Ejecutar la migración `supabase/antigravity_migrations/0015_adoption_story_profiles.sql` en el entorno de Supabase correspondiente.
2. Entrar a **Admin → Rescatados** con una cuenta que tenga nivel de edición.
3. Pulsar **Sincronizar 12 historias**. Este paso escribe en la base y debe hacerse conscientemente en el entorno deseado.
4. Revisar especialmente el hogar ideal de Tigresa, tamaños, razas y vacunación antes de completar datos que no estaban en las fuentes.

No se aplicó la migración ni se pulsó la sincronización contra una base remota durante esta implementación.

## Verificación realizada

- 23 pruebas del proyecto correctas, incluidas 6 específicas para los perfiles y la migración.
- Compilación de producción y lint de los archivos modificados correctos.
- El typecheck completo conserva errores anteriores en actividades, finanzas, donadores y datos de demostración; los archivos nuevos de perfiles no aparecen en esos errores.
- El navegador integrado no estuvo disponible en esta sesión. La comprobación visual responsive de los nuevos perfiles queda pendiente después de aplicar la migración en un entorno de pruebas; no se simuló como completada.
