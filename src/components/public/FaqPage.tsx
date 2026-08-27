import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, ChevronDown, Search } from 'lucide-react';
import { PawBackground } from '@/components/layout/PawBackground';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface FaqItem {
  question: string;
  answer: string;
  category: 'adoption' | 'donation' | 'visit' | 'volunteer';
}

const FAQS: FaqItem[] = [
  {
    category: 'adoption',
    question: '¿Cuáles son los requisitos para adoptar a una mascota?',
    answer: 'Los requisitos básicos son: ser mayor de edad, presentar documento de identidad oficial, comprobante de domicilio, que todos los miembros del hogar estén de acuerdo y completar la entrevista/formulario de adopción.',
  },
  {
    category: 'adoption',
    question: '¿Tiene algún costo la adopción?',
    answer: 'La adopción no tiene costo de venta. Únicamente solicitamos una cuota voluntaria de recuperación que nos ayuda a cubrir parte de la esterilización, vacunas y desparasitación del animalito.',
  },
  {
    category: 'donation',
    question: '¿Cómo sé que mi donación se usa correctamente?',
    answer: 'En Animalitos publicamos periódicamente nuestros informes financieros detallados en la sección de Transparencia. Cada donación y gasto queda registrado públicamente.',
  },
  {
    category: 'donation',
    question: '¿Reciben donaciones en especie?',
    answer: '¡Sí! Recibimos alimento seco y húmedo para perros y gatos, medicamentos veterinarios, cobijas, transportadoras, productos de limpieza y juguetes.',
  },
  {
    category: 'visit',
    question: '¿Puedo visitar el refugio antes de adoptar?',
    answer: '¡Claro que sí! Atendemos visitas en nuestro horario regular (Lunes a Viernes de 8:00am a 6:00pm y Sábados a Domingos de 9:00am a 4:00pm). Te recomendamos agendar previamente.',
  },
  {
    category: 'volunteer',
    question: '¿Cómo me inscribo al programa de voluntariado?',
    answer: 'Puedes inscribirte completando el formulario en nuestra página de Voluntariado. Ofrecemos actividades de paseos, apoyo médico, difusión en redes y mantenimiento del refugio.',
  },
];

export function FaqPage() {
  const [search, setSearch] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filteredFaqs = FAQS.filter(
    f =>
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative py-16 overflow-hidden">
        <PawBackground className="opacity-40" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <HelpCircle className="h-12 w-12 text-[var(--color-primary)] mx-auto mb-4" />
            <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-3">Preguntas Frecuentes</h1>
            <p className="text-lg text-[var(--color-muted-foreground)] max-w-xl mx-auto leading-relaxed">
              Resolvemos tus dudas sobre el proceso de adopción, donaciones, visitas y voluntariado.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search */}
      <section className="py-6 max-w-3xl mx-auto px-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted-foreground)]" />
          <Input
            placeholder="Buscar pregunta o tema..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 py-5"
          />
        </div>
      </section>

      {/* Accordion list */}
      <section className="py-8 max-w-3xl mx-auto px-4 pb-20">
        <div className="space-y-3">
          {filteredFaqs.map((faq, i) => (
            <Card key={faq.question} className="overflow-hidden border-[var(--color-border)]">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full text-left p-5 flex items-center justify-between gap-4 font-heading font-semibold text-base hover:text-[var(--color-primary)] transition-colors cursor-pointer"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`h-5 w-5 text-[var(--color-primary)] transition-transform duration-200 shrink-0 ${
                    openIndex === i ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <CardContent className="pt-0 pb-5 px-5 text-sm text-[var(--color-muted-foreground)] leading-relaxed border-t border-[var(--color-border)]/50 mt-1">
                      <p className="pt-3">{faq.answer}</p>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
