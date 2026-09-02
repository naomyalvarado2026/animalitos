export const FAQ_CATEGORIES = {
  adoption: 'Adopción',
  donation: 'Donaciones',
  visit: 'Visitas',
  volunteer: 'Voluntariado',
  store: 'Tienda',
} as const;

export type FaqCategory = keyof typeof FAQ_CATEGORIES;
export type FaqItem = { question: string; answer: string; category: FaqCategory };

// Fallbacks describe existing flows, not unconfirmed fees, opening hours or policies.
export const DEFAULT_FAQS: FaqItem[] = [
  { category: 'adoption', question: '¿Cómo empiezo una solicitud de adopción?', answer: 'Explora los perfiles en Adoptar, conoce las necesidades de cada perro y completa su pre-solicitud. El equipo revisará la información para conversar contigo.' },
  { category: 'adoption', question: '¿Enviar la solicitud garantiza la adopción?', answer: 'No. La solicitud inicia una conversación para conocer tu hogar, tu rutina y las necesidades del animal. La decisión se confirma con el equipo.' },
  { category: 'donation', question: '¿Dónde puedo consultar el uso de los recursos?', answer: 'Visita Transparencia para consultar la información financiera publicada por el refugio. Si necesitas más detalles, puedes escribir desde Contacto.' },
  { category: 'visit', question: '¿Cómo coordino una visita al refugio?', answer: 'Escríbenos desde Contacto para consultar disponibilidad y coordinar una cita. Confirma los detalles con el equipo antes de desplazarte.' },
  { category: 'volunteer', question: '¿Puedo ayudar si todavía no puedo adoptar?', answer: 'Sí. En Ayudar puedes elegir un área de voluntariado y compartir tu disponibilidad. También puedes explorar las actividades con cupos, la tienda solidaria y las opciones de donación.' },
  { category: 'volunteer', question: '¿Qué ocurre después de enviar mi solicitud?', answer: 'El equipo recibe tu área de interés, disponibilidad y datos de contacto para revisar tu solicitud y coordinar los siguientes pasos. La solicitud no confirma por sí sola una actividad.' },
  { category: 'store', question: '¿Cómo se confirma un pedido de la tienda?', answer: 'En los productos disponibles puedes elegir la cantidad y enviar tus datos de contacto. El equipo recibe el pedido y coordina contigo el envío y la forma de pago; este formulario no realiza un cobro en línea.' },
  { category: 'store', question: '¿El total del producto incluye el envío?', answer: 'El total mostrado corresponde al precio publicado multiplicado por la cantidad. Los detalles y cualquier costo de envío se coordinan con el equipo antes de confirmar el pedido.' },
];

export function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('es').replace(/\s+/g, ' ').trim();
}

export function isFaqCategory(value: unknown): value is FaqCategory {
  return typeof value === 'string' && Object.hasOwn(FAQ_CATEGORIES, value);
}

export function resolveFaqItems(raw?: string | null): FaqItem[] {
  if (!raw?.trim()) return DEFAULT_FAQS;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_FAQS;
    const seen = new Set<string>();
    return parsed.flatMap((item): FaqItem[] => {
      if (!item || typeof item !== 'object' || typeof item.question !== 'string' || typeof item.answer !== 'string') return [];
      const question = item.question.trim();
      const answer = item.answer.trim();
      const key = normalizeSearch(question);
      if (!question || !answer || seen.has(key)) return [];
      seen.add(key);
      return [{ question, answer, category: isFaqCategory(item.category) ? item.category : 'adoption' }];
    });
  } catch {
    return DEFAULT_FAQS;
  }
}

export function filterFaqItems(items: FaqItem[], search = '', category?: FaqCategory): FaqItem[] {
  const terms = normalizeSearch(search).split(' ').filter(Boolean);
  return items.filter((item) => (!category || item.category === category) && terms.every((term) => normalizeSearch(`${item.question} ${item.answer}`).includes(term)));
}

export function validateFaqItems(items: FaqItem[]): FaqItem[] {
  const seen = new Set<string>();
  return items.map((item, index) => {
    const question = item.question.trim();
    const answer = item.answer.trim();
    if (!question || !answer) throw new Error(`Completa la pregunta y la respuesta de la fila ${index + 1}, o quítala.`);
    if (!isFaqCategory(item.category)) throw new Error(`Elige una categoría válida en la fila ${index + 1}.`);
    const key = normalizeSearch(question);
    if (seen.has(key)) throw new Error(`La pregunta de la fila ${index + 1} está repetida.`);
    seen.add(key);
    return { question, answer, category: item.category };
  });
}
