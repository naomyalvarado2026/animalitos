import { REFUGE_DOG_PROFILES } from './refugeDogProfiles.ts';

export type DogStoryMilestone = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
};

export type DogEditorialProfile = {
  slug: string;
  voice_line: string;
  social_caption: string;
  sponsor_focus: string;
  accent_color: string;
  cover_image_url: string;
  gallery_urls: string[];
  focal_x: number;
  focal_y: number;
  featured: boolean;
  appearances: string[];
  timeline: DogStoryMilestone[];
};

const storyFacts: Record<string, [string, string, string]> = {
  blanquita: ['Fue puesta a salvo en la universidad después de sufrir graves abusos.', 'Cuidó a nueve cachorros y recuperó poco a poco la confianza que el miedo le había quitado.', 'Hoy es extrovertida, curiosa y está lista para compartir aventuras con una familia activa.'],
  brandon: ['Vivía aislado afuera de un supermercado por un caso severo de sarna.', 'Con paciencia aceptó ayuda, recibió tratamiento y sanó por completo su piel.', 'Hoy corre, juega y busca una familia con energía para disfrutar la vida junto a él.'],
  cheesy: ['Llegó desnutrido y sin movilidad en las patas traseras después de una golpiza.', 'Seis meses de rehabilitación le permitieron volver a caminar y recuperar su alegría.', 'Hoy adora a las personas y necesita un hogar donde sea la única mascota.'],
  lobo: ['Sobrevivía en la calle y su gran tamaño hacía que muchas personas le tuvieran miedo.', 'Superó dos recaídas de erliquia y descubrió que podía confiar en quienes lo cuidaban.', 'Hoy es un gigante gentil, juguetón y experto en pedir cariño y descansos.'],
  manchas: ['Fue expulsado a la calle tras sufrir maltrato y después fue atropellado.', 'Se recuperó del accidente, la erliquia y una infección de oído; conserva desgaste de cadera.', 'Hoy necesita calma, paciencia y una familia que respete su independencia.'],
  max: ['Vivía en la calle y desapareció casi un año después de un ataque que le hirió la cabeza.', 'Al regresar fue protegido, tratado por erliquia y acompañado hasta sanar física y emocionalmente.', 'Hoy es un senior dulce que sueña con atención exclusiva durante sus años dorados.'],
  minnie: ['Fue rescatada de la calle durante un momento de extrema vulnerabilidad.', 'Una intervención rápida y su esterilización le permitieron empezar una vida segura.', 'Hoy es alegre, cariñosa y siempre está lista para jugar.'],
  moana: ['Una doctora intervino cuando su antigua familia pensaba abandonarla o practicarle eutanasia.', 'Recibió una segunda oportunidad y un entorno capaz de comprender sus necesidades.', 'Hoy es tímida al inicio, muy adaptable y necesita ser la única mascota.'],
  noah: ['Fue encontrada en la calle a punto de dar a luz en un arbusto.', 'Cuidó a sus cachorros hasta que encontraron familia y luego recibió un lugar seguro en el refugio.', 'Hoy es una senior sana, afectuosa e independiente que valora la tranquilidad.'],
  scooby: ['Llegó en estado crítico con un enorme tumor infectado en el labio.', 'Una cirugía de urgencia salvó su vida y dejó solo una pequeña secuela estética.', 'Hoy está sano, es tierno y disfruta profundamente los mimos cuando entra en confianza.'],
  tigresa: ['Vivía en la calle, desconfiaba de todos y atravesaba una gestación de altísimo riesgo.', 'Venció el TVT, fue esterilizada y continúa su tratamiento cardíaco.', 'Hoy es una sobreviviente senior, cariñosa y juguetona que necesita cuidados constantes.'],
  yeri: ['Fue encontrada paralizada sobre el asfalto caliente con recomendación de eutanasia.', 'Cuatro meses de rehabilitación y una cirugía de alto riesgo cambiaron su pronóstico.', 'Hoy camina, corre y comparte una alegría extraordinaria con quienes se acercan.'],
};

const voices: Record<string, string> = {
  blanquita: 'ME llamo Blanquita. Ya aprendí a confiar; ahora quiero descubrir cómo se siente pertenecer a una familia.',
  brandon: 'ME llamo Brandon. Antes nadie quería acercarse; hoy corro hacia las personas que me ofrecen cariño.',
  cheesy: 'ME llamo Cheesy. Volví a caminar y estoy listo para caminar junto a alguien que me elija solo a mí.',
  lobo: 'ME llamo Lobo. Mi tamaño impresiona, pero mi especialidad es pedir amor y quedarme cerca.',
  manchas: 'ME llamo Manchas. No necesito prisa: necesito a alguien que sepa que la confianza también se espera.',
  max: 'ME llamo Max. He esperado mucho tiempo; todavía tengo todo mi cariño para una familia.',
  minnie: 'ME llamo Minnie. Mi lugar favorito será donde podamos jugar y sentirnos seguros juntos.',
  moana: 'ME llamo Moana. Dame un poco de tiempo y te mostraré todo lo que puede florecer con paciencia.',
  noah: 'ME llamo Noah. Disfruto el cariño tranquilo, los espacios serenos y la compañía que sabe respetar.',
  scooby: 'ME llamo Scooby. Al principio observo desde lejos; después, no quiero que terminen los mimos.',
  tigresa: 'ME llamo Tigresa. He vencido mucho y sigo eligiendo jugar, querer y confiar cada día.',
  yeri: 'ME llamo Yeri. Dijeron que no volvería a caminar; ahora corro hacia cada nueva oportunidad.',
};

const sponsorFocus: Record<string, string> = {
  blanquita: 'Alimento, prevención veterinaria y actividades de enriquecimiento.',
  brandon: 'Alimento, prevención veterinaria y jornadas de ejercicio seguro.',
  cheesy: 'Bienestar diario y acompañamiento conductual como mascota única.',
  lobo: 'Alimento, controles preventivos y cuidado para un perro de gran tamaño.',
  manchas: 'Comodidad senior, controles de movilidad y cuidado de su cadera.',
  max: 'Bienestar senior, controles preventivos y una rutina tranquila.',
  minnie: 'Alimento, prevención veterinaria y juegos de enriquecimiento.',
  moana: 'Acompañamiento conductual y un entorno seguro de baja presión.',
  noah: 'Bienestar senior, chequeos médicos y espacios cómodos para descansar.',
  scooby: 'Controles preventivos y acompañamiento para fortalecer su confianza.',
  tigresa: 'Medicación continua, seguimiento cardíaco y controles veterinarios.',
  yeri: 'Controles preventivos, actividad segura y seguimiento de su movilidad.',
};

const accents = ['#dca2e8', '#36acee', '#ffe48d', '#70dfe4', '#ffe28a', '#66dde4', '#ffb78f', '#ffb58b', '#f45dbd', '#8ad7ff', '#ff8e78', '#f45dbd'];

export const DEFAULT_DOG_EDITORIAL_PROFILES: DogEditorialProfile[] = REFUGE_DOG_PROFILES.map((dog, index) => {
  const facts = storyFacts[dog.adoption_slug];
  return {
    slug: dog.adoption_slug,
    voice_line: voices[dog.adoption_slug] || `ME llamo ${dog.name}. ${dog.description}`,
    social_caption: `${dog.name} tiene una historia que merece continuar en familia. Conócela y comparte su perfil. #AdoptaME #AdopciónResponsable`,
    sponsor_focus: sponsorFocus[dog.adoption_slug] || 'Alimento, salud preventiva y bienestar diario.',
    accent_color: accents[index % accents.length],
    cover_image_url: dog.main_image_url,
    gallery_urls: dog.gallery_urls.length ? dog.gallery_urls : [dog.main_image_url],
    focal_x: 50,
    focal_y: 50,
    featured: index < 6,
    appearances: index % 3 === 0 ? ['home', 'adoption', 'donations'] : index % 3 === 1 ? ['adoption', 'volunteer'] : ['adoption', 'store'],
    timeline: [
      { id: `${dog.adoption_slug}-rescate`, eyebrow: 'El rescate', title: 'Alguien decidió no mirar hacia otro lado', description: facts?.[0] || dog.story },
      { id: `${dog.adoption_slug}-recuperacion`, eyebrow: 'La recuperación', title: 'Cuidar también es devolver confianza', description: facts?.[1] || dog.health_status },
      { id: `${dog.adoption_slug}-hoy`, eyebrow: 'Quién es hoy', title: 'Su siguiente capítulo todavía está abierto', description: facts?.[2] || dog.description },
    ],
  };
});

export function getDefaultDogEditorial(slug: string): DogEditorialProfile | undefined {
  return DEFAULT_DOG_EDITORIAL_PROFILES.find((profile) => profile.slug === slug);
}
