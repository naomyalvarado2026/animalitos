import type { VolunteerArea } from '@/types';

export interface VolunteerRoleDetail {
  id: VolunteerArea;
  title: string;
  shortDesc: string;
  icon: string;
  accent: string;
  accentBorder: string;
  badge: string;
  timeCommitment: string;
  location: string;
  energyLevel: 'Baja' | 'Moderada' | 'Activa';
  keyActivities: string[];
  typicalDay: { time: string; activity: string }[];
  requirements: string[];
  benefitedDogSlug: string;
  benefitedDogName: string;
  benefitedDogImage: string;
  benefitedDogReason: string;
  quote: {
    author: string;
    role: string;
    text: string;
  };
}

export const VOLUNTEER_ROLES_DETAILED: VolunteerRoleDetail[] = [
  {
    id: 'dog_walking',
    title: 'Paseos y compañía',
    shortDesc: 'Ejercicio, confianza y momentos de calma para nuestros peluditos en recuperación.',
    icon: '🐕',
    accent: 'bg-[#ffcf5a]/25',
    accentBorder: 'border-[#ffcf5a]',
    badge: 'Mayor impacto directo',
    timeCommitment: '2 a 4 horas por jornada (fines de semana o mañanas)',
    location: 'Refugio principal y senderos naturales aledaños',
    energyLevel: 'Moderada',
    keyActivities: [
      'Paseos olfativos y relajantes con correa positiva y arnés seguro',
      'Sesiones de cepillado, masajes y desensibilización al tacto',
      'Juegos de olfato y enriquecimiento ambiental para reducir estrés',
      'Apoyo en socialización gradual con otros perros y personas',
    ],
    typicalDay: [
      { time: '09:00', activity: 'Llegada, bienvenida y asignación de perros según compatibilidad' },
      { time: '09:20', activity: 'Colocación segura de arnés de doble punto y salida a senderos' },
      { time: '10:45', activity: 'Regreso al área verde, hidratación y cepillado relajante' },
      { time: '11:45', activity: 'Premios, reporte de novedades al equipo y despedida con amor' },
    ],
    requirements: [
      'Mayor de 18 años (o 16+ acompañados por un tutor responsable)',
      'Calzado deportivo o de senderismo con buen agarre (no sandalias ni tacones)',
      'Pantalón largo y ropa que no temas ensuciar con huellitas felices',
      'Paciencia absoluta: aquí premiamos la calma y respetamos los tiempos del perro',
    ],
    benefitedDogSlug: 'scooby',
    benefitedDogName: 'Scooby',
    benefitedDogImage: '/images/refugio/scooby-garden-2026-10.jpg',
    benefitedDogReason: 'Llegó con mucho miedo a la correa; los paseos pacientes de los voluntarios le devolvieron la seguridad.',
    quote: {
      author: 'Camila Morales',
      role: 'Voluntaria de paseos (8 meses en el refugio)',
      text: 'Ver a Scooby pasar de esconderse en un rincón a mover la cola esperando su correa los sábados es la mayor satisfacción que he sentido.',
    },
  },
  {
    id: 'medical_support',
    title: 'Cuidado y salud',
    shortDesc: 'Apoyo responsable en rutinas de cuidado, medicación y bienestar físico diario.',
    icon: '🏥',
    accent: 'bg-[#d9efdc]/40',
    accentBorder: 'border-[#a8d5ad]',
    badge: 'Cuidado especializado',
    timeCommitment: '2 a 3 horas por turno (mañanas o tardes)',
    location: 'Área veterinaria y enfermería del refugio',
    energyLevel: 'Baja',
    keyActivities: [
      'Acompañamiento en pesaje y chequeos preventivos periódicos',
      'Limpieza y desinfección preventiva de orejitas y patitas',
      'Administración supervisada de suplementos y medicamentos orales',
      'Registro en fichas de apetito, energía y evolución de salud',
    ],
    typicalDay: [
      { time: '09:30', activity: 'Revisión con el médico veterinario de los perritos en tratamiento' },
      { time: '10:00', activity: 'Pesaje, preparación de dosis de desparasitantes o suplementos' },
      { time: '11:15', activity: 'Cepillado terapéutico y revisión de piel de los rescatados' },
      { time: '12:00', activity: 'Actualización de libretas de salud y orden del botiquín' },
    ],
    requirements: [
      'Afinidad por la medicina veterinaria, biología o experiencia previa en cuidados',
      'Uso de guantes y seguimiento estricto de protocolos higiénicos',
      'Atención al detalle y comunicación clara con los coordinadores',
      'Mucho cariño para acompañar a los perritos en su recuperación física',
    ],
    benefitedDogSlug: 'brandon',
    benefitedDogName: 'Brandon',
    benefitedDogImage: '/images/refugio/brandon-garden-2026-10.jpg',
    benefitedDogReason: 'Brandon superó una sarna severa gracias a meses de baños medicados y curaciones diarias.',
    quote: {
      author: 'David Paredes',
      role: 'Estudiante de Veterinaria y voluntario de salud',
      text: 'Cada pastilla administrada a tiempo y cada herida limpia significan un día menos de dolor para ellos. Aprendes más aquí que en cualquier libro.',
    },
  },
  {
    id: 'events',
    title: 'Eventos y colectas',
    shortDesc: 'Haz que la causa llegue a más personas, aliados y comunidades solidarias.',
    icon: '🎟️',
    accent: 'bg-[#f9dcd5]/40',
    accentBorder: 'border-[#f0aba0]',
    badge: 'Conexión con la comunidad',
    timeCommitment: 'Jornadas de fin de semana (3 a 5 horas según el evento)',
    location: 'Plazas públicas, centros comerciales y ferias aliadas',
    energyLevel: 'Moderada',
    keyActivities: [
      'Atención en stands informativos y de recaudación de fondos',
      'Organización y entrega de merchandising oficial de la tienda solidaria',
      'Recepción y conteo de donaciones de alimento, cobijas y medicinas',
      'Brindar información sobre el proceso de adopción responsable',
    ],
    typicalDay: [
      { time: '10:00', activity: 'Montaje del stand, banners, mesas y productos solidarios' },
      { time: '11:00', activity: 'Atención a visitantes, explicación de perfiles de perros en adopción' },
      { time: '14:30', activity: 'Registro de personas interesadas en adoptar o donar' },
      { time: '16:00', activity: 'Desmontaje, balance del día y carga de donaciones hacia el refugio' },
    ],
    requirements: [
      'Gusto por conversar y empatía con las personas',
      'Compromiso y puntualidad durante el turno del evento',
      'Manejo ordenado de inventario o dinero de donaciones',
      'Espíritu festivo y amor por difundir la causa de los animalitos',
    ],
    benefitedDogSlug: 'blanquita',
    benefitedDogName: 'Blanquita',
    benefitedDogImage: '/images/refugio/blanquita-garden-2026-10.jpg',
    benefitedDogReason: 'El alimento y vacunas que consume Blanquita provienen en gran parte de las colectas mensuales.',
    quote: {
      author: 'Carolina Vivar',
      role: 'Voluntaria de eventos y ferias solidarias',
      text: 'En cada feria conocemos personas increíbles que deciden donar o abrir su hogar. Ser la voz de los que no pueden hablar te llena el alma.',
    },
  },
  {
    id: 'foster',
    title: 'Hogar temporal',
    shortDesc: 'Abre las puertas de tu hogar durante una etapa clave de recuperación o adaptación.',
    icon: '🏡',
    accent: 'bg-[#cbdcf4]/35',
    accentBorder: 'border-[#9abde7]',
    badge: 'Salva vidas en casa',
    timeCommitment: '2 a 8 semanas según el caso (nosotros cubrimos alimento y veterinario)',
    location: 'Tu propio hogar (apartamento o casa segura)',
    energyLevel: 'Moderada',
    keyActivities: [
      'Brindar un ambiente hogareño seguro, tibio y lleno de afecto',
      'Ayudar en la recuperación posoperatoria o en cachorros recién rescatados',
      'Enseñar normas básicas de convivencia en casa (rutina de baño, correa)',
      'Compartir fotos y videos semanales de sus avances con el equipo',
    ],
    typicalDay: [
      { time: 'Rutina', activity: 'Alimentación matutina y paseo higiénico tranquilo' },
      { time: 'Tarde', activity: 'Momento de descanso en su camita y juegos supervisados' },
      { time: 'Noche', activity: 'Caricias, cena y una noche de sueño tranquilo bajo techo' },
    ],
    requirements: [
      'Espacio seguro (sin riesgo de escapes por balcones o cercas bajas)',
      'Tiempo para atender sus necesidades diarias y paseos',
      'Aprobación de todos los miembros del hogar o familia',
      'Corazón generoso para darle amor sabiendo que luego irá a su familia definitiva',
    ],
    benefitedDogSlug: 'cheesy',
    benefitedDogName: 'Cheesy',
    benefitedDogImage: '/images/refugio/cheesy-garden-2026-10.jpg',
    benefitedDogReason: 'Cheesy aprendió a caminar de nuevo gracias al reposo y cariño de un hogar de paso paciente.',
    quote: {
      author: 'Javier Restrepo',
      role: 'Hogar temporal de 3 rescatados',
      text: 'Despedirlos cuando encuentran una familia duele un poquito, pero ver que gracias a tu hogar están vivos y felices lo compensa todo.',
    },
  },
  {
    id: 'social_media',
    title: 'Historias y difusión',
    shortDesc: 'Fotografía, video, diseño y narración digital que conectan perros con familias.',
    icon: '📸',
    accent: 'bg-[#e8dcf4]/40',
    accentBorder: 'border-[#ccafea]',
    badge: '100% flexible y creativo',
    timeCommitment: 'Flexible (desde casa o visitas fotográficas puntuales al refugio)',
    location: 'En el refugio para sesiones fotográficas o remoto desde tu computadora',
    energyLevel: 'Baja',
    keyActivities: [
      'Capturar retratos dignos y emotivos que reflejen el alma de cada perro',
      'Crear reels y videos cortos que muestren su personalidad y energía',
      'Diseñar piezas gráficas y afiches de adopción urgente para redes sociales',
      'Redactar crónicas e historias de rescate con sensibilidad y respeto',
    ],
    typicalDay: [
      { time: 'Creatividad', activity: 'Visita fotográfica al refugio con cámara o smartphone de buena resolución' },
      { time: 'Edición', activity: 'Selección de tomas, ajuste de luz y redacción de textos que conmuevan' },
      { time: 'Publicación', activity: 'Coordinación con el equipo para subir posts y responder mensajes clave' },
    ],
    requirements: [
      'Cámara fotográfica o smartphone con buena cámara',
      'Nociones de composición visual, video o redacción creativa',
      'Enfoque ético: mostramos a los perros con dignidad, nunca con lástima',
      'Compromiso en la entrega de materiales para campañas de adopción',
    ],
    benefitedDogSlug: 'noah',
    benefitedDogName: 'Noah',
    benefitedDogImage: '/images/refugio/noah-garden-2026-10.jpg',
    benefitedDogReason: 'Noah encontró a su familia ideal gracias a un video que mostró cómo aprendió a convivir con otros perros.',
    quote: {
      author: 'Sofía Torres',
      role: 'Fotógrafa voluntaria y creadora de contenido',
      text: 'Una buena fotografía no cambia el pasado de un perro, pero tiene el poder absoluto de cambiar su futuro en un solo clic.',
    },
  },
  {
    id: 'shelter_maintenance',
    title: 'Refugio y logística',
    shortDesc: 'Mantenimiento, carpintería, mejoras y orden que mantienen el hogar en marcha.',
    icon: '🛠️',
    accent: 'bg-[#ede5da]',
    accentBorder: 'border-[#cfc1b0]',
    badge: 'Manos a la obra',
    timeCommitment: 'Jornadas mensuales de 3 a 4 horas (sábados o domingos)',
    location: 'Instalaciones del refugio principal',
    energyLevel: 'Activa',
    keyActivities: [
      'Construcción y reparación de casitas, techados y cercas perimetrales',
      'Pintura e impermeabilización de caniles y áreas comunes',
      'Jardinería, poda preventiva y enriquecimiento de patios de juego',
      'Organización de bodegas de alimento, insumos y herramientas',
    ],
    typicalDay: [
      { time: '08:30', activity: 'Reunión de coordinación, revisión de tareas prioritarias del día' },
      { time: '09:00', activity: 'Trabajos de reparación, carpintería o pintura en grupos de apoyo' },
      { time: '11:30', activity: 'Pausa para compartir refrigerio y jugar un ratito con los perros' },
      { time: '13:00', activity: 'Limpieza de herramientas, verificación de seguridad y cierre' },
    ],
    requirements: [
      'Gusto por el trabajo manual y ganas de poner las manos en acción',
      'Ropa de trabajo resistente, guantes y calzado cerrado protector',
      'Uso seguro de herramientas básicas (martillo, taladro, pinceles)',
      'Espíritu de equipo para dejar las instalaciones más hermosas que nunca',
    ],
    benefitedDogSlug: 'manchas',
    benefitedDogName: 'Manchas',
    benefitedDogImage: '/images/refugio/manchas-garden-2026-10.jpg',
    benefitedDogReason: 'Manchas duerme calientito gracias a los aislamientos térmicos instalados por el equipo de logística.',
    quote: {
      author: 'Carlos Andrade',
      role: 'Voluntario de mantenimiento y carpintería',
      text: 'Saber que una cerca bien colocada evita accidentes y que una casita bien techada los protege de la lluvia te da una paz infinita.',
    },
  },
];
