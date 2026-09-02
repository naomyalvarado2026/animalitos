import type { FaqItem } from './faq.ts';
import { FAQ_CATEGORIES, normalizeSearch } from './faq.ts';

export type DiscoveryResult = { id: string; title: string; description: string; href: string; kind: 'page' | 'faq'; keywords?: string };

// Public destinations only. Add future public pages here; never include admin records.
export const PUBLIC_DESTINATIONS: DiscoveryResult[] = [
  { id: 'adopt', title: 'Encuentra a tu compañero', description: 'Perfiles, necesidades y solicitudes de adopción.', href: '/adopta', kind: 'page', keywords: 'adoptar adopcion perros mascotas familia' },
  { id: 'process', title: 'Cómo funciona la adopción', description: 'Los pasos y la preparación antes de dar el sí.', href: '/como-funciona', kind: 'page', keywords: 'requisitos proceso entrevista hogar' },
  { id: 'help', title: 'Ayudar y hacer voluntariado', description: 'Áreas de participación, agenda y solicitudes.', href: '/voluntariado', kind: 'page', keywords: 'voluntario paseos calendario actividades hogar temporal foster' },
  { id: 'shop', title: 'Tienda solidaria', description: 'Productos con propósito y consultas de pedidos.', href: '/tienda', kind: 'page', keywords: 'comprar compra regalos precio stock inventario envio' },
  { id: 'donate', title: 'Donaciones', description: 'Consulta las formas disponibles de apoyar al refugio.', href: '/donaciones', kind: 'page', keywords: 'donar dinero aportar ayuda' },
  { id: 'faq', title: 'Centro de ayuda', description: 'Respuestas sobre adopción, visitas, voluntariado y tienda.', href: '/faq', kind: 'page', keywords: 'preguntas frecuentes dudas' },
  { id: 'contact', title: 'Contacto y visitas', description: 'Habla con el equipo y consulta disponibilidad.', href: '/contacto', kind: 'page', keywords: 'telefono whatsapp correo email direccion cita horario' },
  { id: 'resources', title: 'Recursos para cuidar mejor', description: 'Material educativo para la convivencia responsable.', href: '/recursos', kind: 'page', keywords: 'guias consejos cuidados salud adaptacion' },
  { id: 'sanctuary', title: 'Santuario', description: 'Conoce a nuestros residentes permanentes.', href: '/santuario', kind: 'page', keywords: 'padrinazgo apadrinar cuidados especiales' },
  { id: 'transparency', title: 'Transparencia', description: 'Información financiera publicada por el refugio.', href: '/transparencia', kind: 'page', keywords: 'informes gastos ingresos egresos cuentas recursos' },
  { id: 'stories', title: 'Historias de éxito', description: 'Segundas oportunidades que ya encontraron un hogar.', href: '/historias-de-exito', kind: 'page', keywords: 'adoptados testimonios familias' },
  { id: 'about', title: 'Nosotros', description: 'La misión, las personas y la historia de AdoptaME.', href: '/nosotros', kind: 'page', keywords: 'equipo refugio organizacion' },
  { id: 'memory', title: 'En memoria de', description: 'Un espacio para recordar a quienes dejaron huella.', href: '/en-memoria', kind: 'page', keywords: 'memorial recuerdo homenaje' },
  { id: 'partners', title: 'Alianzas y otras formas de apoyar', description: 'Comparte tu propuesta con el equipo del refugio.', href: '/contacto/quiero-apoyar', kind: 'page', keywords: 'empresa patrocinio aliados donacion especie' },
];

export function searchPublicContent(query: string, faqs: FaqItem[] = []): DiscoveryResult[] {
  const normalized = normalizeSearch(query);
  if (!normalized) return PUBLIC_DESTINATIONS.slice(0, 6);
  const terms = normalized.split(' ');
  const candidates: DiscoveryResult[] = [
    ...PUBLIC_DESTINATIONS,
    ...faqs.map((faq) => ({ id: `faq-${faq.category}-${faq.question}`, title: faq.question, description: faq.answer, href: `/faq?${new URLSearchParams({ category: faq.category, q: faq.question })}`, kind: 'faq' as const, keywords: FAQ_CATEGORIES[faq.category] })),
  ];
  return candidates
    .filter((item) => terms.every((term) => normalizeSearch(`${item.title} ${item.description} ${item.keywords ?? ''}`).includes(term)))
    .map((item) => ({ item, score: normalizeSearch(item.title) === normalized ? 3 : normalizeSearch(item.title).includes(normalized) ? 2 : 1 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map(({ item }) => item);
}
