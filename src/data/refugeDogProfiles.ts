import type { AnimalGender, AnimalSize, AnimalStatus, VaccinationStatus } from '@/types';

export type RefugeDogSeed = {
  name: string;
  adoption_slug: string;
  species: 'dog';
  breed: null;
  age_months: number | null;
  age_is_estimated: boolean;
  gender: AnimalGender;
  size: AnimalSize;
  status: AnimalStatus;
  description: string;
  story: string;
  health_status: string;
  vaccination_status: VaccinationStatus;
  is_vaccinated: boolean | null;
  is_neutered: boolean;
  is_special_needs: boolean;
  special_needs_desc: string | null;
  personality_summary: string;
  ideal_home: string | null;
  compatibility_notes: string | null;
  main_image_url: string;
  gallery_urls: string[];
  location: string;
  is_published: boolean;
  show_brand_moment: boolean;
  brand_message: string | null;
  sort_order: number;
};

const shared = { species: 'dog' as const, breed: null, size: 'unknown' as const, status: 'available' as const, vaccination_status: 'unknown' as const, is_vaccinated: null, is_neutered: true, special_needs_desc: null, gallery_urls: [], location: 'Refugio principal', is_published: true };

export const REFUGE_DOG_PROFILES: RefugeDogSeed[] = [
  {
    ...shared, name: 'Blanquita', adoption_slug: 'blanquita', age_months: 48, age_is_estimated: false, gender: 'female', sort_order: 10,
    main_image_url: '/images/refugio/blanquita.jpeg', is_special_needs: false,
    description: 'Extrovertida, aventurera, curiosa y con una energía que parece no terminar.',
    story: 'Blanquita fue rescatada en la universidad tras sufrir graves abusos. Llegó embarazada y logró sacar adelante a nueve cachorros que ya encontraron un hogar. Al principio, el trauma la mantenía tan aterrorizada y aislada que llegó a paralizarse por el miedo, haciéndonos pensar que padecía problemas neurológicos. Sin embargo, con el tiempo necesario para volver a confiar, sanó por completo. Hoy ha dejado todos sus temores atrás para convertirse en una compañera sumamente extrovertida, aventurera y con una energía inagotable.',
    health_status: 'Esterilizada, completamente sana, sin secuelas y con vacunas y desparasitación al día.', vaccination_status: 'up_to_date', is_vaccinated: true,
    personality_summary: 'Extrovertida, inquieta, curiosa y llena de vitalidad.',
    ideal_home: 'Una familia activa que disfrute los paseos y las aventuras al aire libre, dispuesta a seguirle el ritmo.', compatibility_notes: null,
    show_brand_moment: true, brand_message: 'AdoptaME: cuando vuelve la confianza, empieza otra vida.',
  },
  {
    ...shared, name: 'Brandon', adoption_slug: 'brandon', age_months: 48, age_is_estimated: true, gender: 'male', sort_order: 20,
    main_image_url: '/images/refugio/brandon.jpg', is_special_needs: false,
    description: 'Feliz, cariñoso, juguetón y listo para correr con una familia activa.',
    story: 'Rescatamos a Brandon de los exteriores de un supermercado, donde vivía aislado por un severo caso de sarna que alejaba a las personas. Su dolor lo volvía tan desconfiado y defensivo que, para alimentarlo, debíamos dejarle la comida e irnos. Con mucha paciencia logramos ganar su confianza para llevarlo al veterinario. Tras sanar su piel, su actitud cambió por completo: hoy es un perrito inmensamente feliz, cariñoso y lleno de vida. Le encanta jugar con las personas y correr a toda velocidad por campos abiertos para drenar su energía.',
    health_status: 'Esterilizado, completamente sano y recuperado al 100% de su afección en la piel.',
    personality_summary: 'Muy feliz, cariñoso, juguetón y con mucha vitalidad.',
    ideal_home: 'Una familia activa, preferiblemente con patio grande o acceso a campos abiertos, donde pueda correr y jugar.', compatibility_notes: null,
    show_brand_moment: false, brand_message: null,
  },
  {
    ...shared, name: 'Cheesy', adoption_slug: 'cheesy', age_months: 48, age_is_estimated: false, gender: 'male', sort_order: 30,
    main_image_url: '/images/refugio/cheesy.jpg', is_special_needs: false,
    description: 'Increíblemente afectuoso con las personas; necesita ser la única mascota del hogar.',
    story: 'Rescatamos a Cheesy de un entorno de maltrato extremo. Una brutal golpiza lo dejó severamente desnutrido, deprimido y sin movilidad en sus patas traseras. Afortunadamente, los exámenes descartaron daños óseos o neurológicos y, tras seis meses de intensa rehabilitación, logró volver a caminar. Hoy está recuperando su alegría y es un perrito increíblemente sociable y cariñoso con las personas, aunque debido a sus traumas pasados, no tolera la compañía de otros animales.',
    health_status: 'Esterilizado, físicamente sano y totalmente recuperado de la desnutrición y la parálisis temporal.',
    personality_summary: 'Muy afectuoso y sociable con humanos; altamente reactivo ante otros perros y gatos.',
    ideal_home: 'Una familia comprensiva donde sea la única mascota y reciba atención exclusiva.', compatibility_notes: 'Debe vivir sin otros perros ni gatos.',
    show_brand_moment: true, brand_message: 'AdoptaME: rendirse nunca fue parte de su historia.',
  },
  {
    ...shared, name: 'Lobo', adoption_slug: 'lobo', age_months: 84, age_is_estimated: true, gender: 'male', size: 'large', sort_order: 40,
    main_image_url: '/images/refugio/lobo.jpg', is_special_needs: false,
    description: 'Un gigante gentil, alegre, comelón y experto en pedir atención.',
    story: 'Lobo fue rescatado de las calles, donde lo cuidábamos y alimentábamos inicialmente. Por ser un perro de gran tamaño, las personas suelen temerle a simple vista, pero en realidad es un gigante noble que solo busca dar y recibir amor las 24 horas del día. Superó la erliquia en dos ocasiones tras fuertes recaídas y hoy se encuentra completamente sano. Es un perrito muy comelón, algo gordito y sumamente alegre; le fascina jugar para llamar tu atención, aunque se cansa rápido y disfruta mucho de sus descansos.',
    health_status: 'Totalmente sano, esterilizado y recuperado de erliquia en dos ocasiones.',
    personality_summary: 'Un gigante gentil, extremadamente cariñoso, juguetón y demandante de atención humana.',
    ideal_home: 'Una casa llena de vida, preferiblemente con niños o una familia numerosa que respete sus momentos de descanso.', compatibility_notes: 'Disfruta la compañía de una familia activa, con juegos en intervalos cortos.',
    show_brand_moment: false, brand_message: null,
  },
  {
    ...shared, name: 'Manchas', adoption_slug: 'manchas', age_months: null, age_is_estimated: false, gender: 'male', sort_order: 50,
    main_image_url: '/images/refugio/manchas.jpg', is_special_needs: true, special_needs_desc: 'Desgaste natural en el hueso de la cadera.',
    description: 'Un senior cauteloso e independiente que aprende a confiar cuando se respeta su espacio.',
    story: 'Manchas sobrevivió a un maltrato extremo antes de ser echado a la calle, donde tiempo después fue atropellado por un vehículo. Lo rescatamos desorientado y con problemas de movilidad. Afortunadamente no sufrió fracturas, pero se le diagnosticó desgaste de cadera. Este valiente perrito senior logró recuperarse del trauma del accidente, venció la erliquia y sanó una infección en su oreja. Por su duro pasado es desconfiado al inicio, pero poco a poco acepta mimos, siempre que se respete su espacio e independencia.',
    health_status: 'Senior esterilizado, recuperado de erliquia y de una infección de oído. Presenta desgaste natural de cadera.',
    personality_summary: 'Cauteloso e independiente; acepta cariño cuando se siente seguro.',
    ideal_home: 'Un entorno tranquilo y paciente que respete su espacio y le ofrezca comodidades adaptadas a su edad y cadera.', compatibility_notes: null,
    show_brand_moment: false, brand_message: null,
  },
  {
    ...shared, name: 'Max', adoption_slug: 'max', age_months: 108, age_is_estimated: false, gender: 'male', sort_order: 60,
    main_image_url: '/images/refugio/max.jpg', is_special_needs: false,
    description: 'Un senior profundamente afectuoso, dulce y agradecido que busca atención exclusiva.',
    story: 'Max es un perrito senior que vivía en las calles. Tras sufrir un brutal ataque que le hirió la cabeza, huyó aterrorizado y le perdimos el rastro por casi un año. Cuando sorpresivamente regresó a la zona, lo ingresamos de inmediato al refugio para protegerlo. Con tiempo y cuidados, sus heridas físicas y emocionales sanaron por completo. Hoy, tras superar también la erliquia, ha dejado atrás el trauma para volver a ser el perrito sumamente amoroso y confiado de siempre.',
    health_status: 'Senior esterilizado, sano y tratado con éxito por erliquia.',
    personality_summary: 'Profundamente afectuoso, dulce y agradecido.',
    ideal_home: 'Una familia donde sea la única mascota y reciba cariño exclusivo durante sus años dorados.', compatibility_notes: 'Debe ser la única mascota del hogar.',
    show_brand_moment: true, brand_message: 'AdoptaME: el amor también sabe esperar.',
  },
  {
    ...shared, name: 'Minnie', adoption_slug: 'minnie', age_months: 60, age_is_estimated: false, gender: 'female', sort_order: 70,
    main_image_url: '/images/refugio/minie.jpg', is_special_needs: false,
    description: 'Cariñosa, alegre y sumamente juguetona.',
    story: 'Minnie fue rescatada de las calles en un momento de extrema vulnerabilidad, justo cuando una manada de perros intentaba abusar de ella por encontrarse en celo. Gracias a una intervención rápida, logramos ponerla a salvo en nuestro centro y, a los pocos días, fue esterilizada para protegerla definitivamente. Aunque desconocemos los detalles de su pasado o si enfrentó embarazos anteriormente, su presente está lleno de alegría y tranquilidad. Hoy ha dejado atrás los peligros de la calle y es una compañera inmensamente cariñosa y muy juguetona.',
    health_status: 'Esterilizada, sana y en óptimas condiciones generales.',
    personality_summary: 'Muy cariñosa, alegre y sumamente juguetona.',
    ideal_home: 'Una familia que disfrute los juegos y le brinde un entorno seguro y lleno de amor.', compatibility_notes: null,
    show_brand_moment: false, brand_message: null,
  },
  {
    ...shared, name: 'Moana', adoption_slug: 'moana', age_months: 48, age_is_estimated: false, gender: 'female', sort_order: 80,
    main_image_url: '/images/refugio/moana.jpg', is_special_needs: false,
    description: 'Tímida al principio, adaptable y maravillosa cuando se siente segura.',
    story: 'La vida de Moana dio un giro gracias a una doctora de un centro de salud que intervino justo a tiempo para salvarla. Su antigua familia planeaba abandonarla o aplicarle la eutanasia debido a que cazaba pollitos y presentaba problemas de conducta por falta de un manejo adecuado. Nosotros le abrimos las puertas para darle una segunda oportunidad. Hoy, Moana es una perrita que, aunque se muestra tímida al principio, tiene una enorme capacidad de adaptación. Ha dejado atrás su pasado y está lista para florecer, demostrando que con paciencia y el entorno correcto puede ser una compañera maravillosa.',
    health_status: 'Esterilizada y en buenas condiciones generales.',
    personality_summary: 'Tímida al inicio, muy adaptable al sentirse segura y con fuerte instinto de caza.',
    ideal_home: 'Un entorno paciente donde sea la única mascota y reciba atención exclusiva.', compatibility_notes: 'Debe vivir sin otros perros, gatos ni aves.',
    show_brand_moment: false, brand_message: null,
  },
  {
    ...shared, name: 'Noah', adoption_slug: 'noah', age_months: 108, age_is_estimated: false, gender: 'female', sort_order: 90,
    main_image_url: '/images/refugio/noah.jpg', is_special_needs: false,
    description: 'Una senior cariñosa e independiente que valora la calma y su espacio personal.',
    story: 'Rescatamos a Noah de las calles a punto de dar a luz en un arbusto. Tras cuidar de ella y sus cachorros hasta que fueron adoptados, la acogimos en el refugio. Hoy es una perrita senior con excelente salud. Debido a su pasado es cautelosa al inicio, pero al sentirse segura, demuestra ser una compañera sumamente cariñosa e independiente que valora mucho su espacio personal.',
    health_status: 'Esterilizada, con chequeos médicos al día y sin afecciones. Se encuentra en etapa senior.',
    personality_summary: 'Cautelosa al inicio, profundamente cariñosa e independiente al entrar en confianza.',
    ideal_home: 'Un entorno sereno y predecible, preferiblemente sin niños pequeños ni mascotas invasivas.', compatibility_notes: 'Necesita convivencia tranquila y respeto por su espacio personal.',
    show_brand_moment: true, brand_message: 'AdoptaME: también hay amor en acompañar con calma.',
  },
  {
    ...shared, name: 'Scooby', adoption_slug: 'scooby', age_months: 72, age_is_estimated: false, gender: 'male', sort_order: 100,
    main_image_url: '/images/refugio/scooby.jpg', is_special_needs: false,
    description: 'Tímido al conocerte, muy tierno y feliz cuando llegan los mimos.',
    story: 'Rescatamos a Scooby del abandono en estado crítico por un enorme tumor infectado en su labio. Gracias a una cirugía de urgencia logramos extirparlo, aunque le quedó un pequeño orificio en el lado derecho de su boquita al no poder salvar esa piel. Hoy está totalmente recuperado y, aunque es un poco tímido al conocer gente nueva, es un perrito completamente sano que disfruta inmensamente de los mimos y las caricias.',
    health_status: 'Sano y esterilizado. Conserva una pequeña secuela estética en el labio que no afecta su calidad de vida.',
    personality_summary: 'Tímido al principio, muy tierno y amante del afecto.',
    ideal_home: 'Una familia tranquila y paciente que respete sus tiempos y le brinde muchas caricias.', compatibility_notes: null,
    show_brand_moment: false, brand_message: null,
  },
  {
    ...shared, name: 'Tigresa', adoption_slug: 'tigresa', age_months: 96, age_is_estimated: false, gender: 'female', status: 'medical_care', sort_order: 110,
    main_image_url: '/images/refugio/tigresa.jpg', is_special_needs: true, special_needs_desc: 'Requiere medicación continua por agrandamiento cardíaco y gusano del corazón.',
    description: 'Una sobreviviente senior, profundamente cariñosa y juguetona, que continúa su tratamiento cardíaco.',
    story: 'Conocimos a Tigresa viviendo en la calle, extremadamente desconfiada y con un historial de múltiples embarazos. Logramos rescatarla definitivamente durante su última gestación, la cual era de altísimo riesgo debido a que padecía TVT (tumor venéreo transmisible), gusano del corazón y agrandamiento cardíaco. Contra todo pronóstico médico, esta valiente perrita senior dio a luz de forma natural, venció el cáncer y fue esterilizada con éxito. Hoy ha dejado atrás todos sus miedos defensivos; mientras continúa su tratamiento para el corazón, nos demuestra a diario que es una sobreviviente profundamente cariñosa a la que le fascina jugar.',
    health_status: 'Senior esterilizada y libre de TVT. Requiere medicación continua por agrandamiento cardíaco y gusano del corazón.',
    personality_summary: 'Extremadamente cariñosa, juguetona y agradecida; superó su reactividad del pasado.',
    ideal_home: null, compatibility_notes: 'El texto recibido del hogar ideal está incompleto y debe confirmarse antes de publicarlo.',
    show_brand_moment: true, brand_message: 'AdoptaME: cada día de cuidado abre otra oportunidad.',
  },
  {
    ...shared, name: 'Yeri', adoption_slug: 'yeri', age_months: 72, age_is_estimated: false, gender: 'female', sort_order: 120,
    main_image_url: '/images/refugio/yeri.jpg', is_special_needs: false,
    description: 'Súper cariñosa, juguetona y llena de vida después de una recuperación extraordinaria.',
    story: 'Rescatamos a Yeri paralizada sobre el asfalto caliente, con recomendación médica de eutanasia. Nos negamos a rendirnos y, tras cuatro meses de intensa rehabilitación, volvió a caminar y hoy corre libremente. Además, superó una cirugía de alto riesgo para extirparle un enorme tumor uterino. Pese a todo su sufrimiento, es una perrita increíblemente cariñosa, juguetona y llena de vida.',
    health_status: 'Esterilizada y recuperada por completo de una parálisis temporal y de la extirpación de un tumor uterino. Actualmente es móvil y activa.',
    personality_summary: 'Súper cariñosa, sumamente juguetona y amante de las caricias y la atención.',
    ideal_home: 'Una familia amorosa que le dé muchos mimos, espacio para correr y atención constante.', compatibility_notes: null,
    show_brand_moment: false, brand_message: null,
  },
];
