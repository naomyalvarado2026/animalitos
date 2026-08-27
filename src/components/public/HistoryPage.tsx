import { motion } from 'motion/react';
import { PawBackground } from '@/components/layout/PawBackground';

const TIMELINE = [
  {
    year: '2016',
    title: 'El Comienzo',
    description:
      'María González rescató su primera camada de cachorros de la calle. Sin saberlo, ese fue el primer paso de lo que hoy es Animalitos.',
    emoji: '🐶',
  },
  {
    year: '2017',
    title: 'Primeros Voluntarios',
    description:
      'Las redes sociales se convirtieron en nuestra voz. Sumamos los primeros 20 voluntarios y realizamos 50 adopciones en el año.',
    emoji: '🤝',
  },
  {
    year: '2018',
    title: 'Primer Refugio Oficial',
    description:
      'Conseguimos nuestro primer espacio físico: un terreno donado donde construimos las primeras instalaciones para albergar hasta 40 animales.',
    emoji: '🏠',
  },
  {
    year: '2019',
    title: 'Atención Veterinaria',
    description:
      'Firmamos convenio con clínicas veterinarias locales para brindar atención médica gratuita a todos nuestros rescatados.',
    emoji: '🏥',
  },
  {
    year: '2020',
    title: 'Resiliencia',
    description:
      'Durante la pandemia, duplicamos los rescates. La comunidad respondió con donaciones récord y adoptamos modalidades virtuales de seguimiento.',
    emoji: '💪',
  },
  {
    year: '2022',
    title: 'Expansión',
    description:
      'Ampliamos las instalaciones, sumamos un veterinario de planta y lanzamos nuestro programa de transparencia financiera.',
    emoji: '🌱',
  },
  {
    year: '2024',
    title: 'Hoy',
    description:
      'Más de 1,200 rescates, 890 adopciones y una comunidad de más de 120 voluntarios. Seguimos creciendo, guiados por el amor a los animales.',
    emoji: '⭐',
  },
];

export function HistoryPage() {
  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <PawBackground className="opacity-50" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-5xl block mb-4">📖</span>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-4">
              Nuestra Historia
            </h1>
            <p className="text-lg text-[var(--color-muted-foreground)] max-w-2xl mx-auto">
              Un camino recorrido con amor, dedicación y la certeza de que
              cada vida animal tiene un valor incalculable.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-[var(--color-primary)] via-[var(--color-accent)] to-transparent" />

            <div className="space-y-10">
              {TIMELINE.map((item, i) => (
                <motion.div
                  key={item.year}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, duration: 0.5 }}
                  className="relative pl-20"
                >
                  {/* Dot */}
                  <div className="absolute left-4 top-3 w-9 h-9 rounded-full brand-gradient-bg flex items-center justify-center shadow-md text-lg">
                    {item.emoji}
                  </div>

                  <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 hover-card">
                    <span className="inline-block text-xs font-bold tracking-widest text-[var(--color-primary)] uppercase mb-1">
                      {item.year}
                    </span>
                    <h3 className="font-heading text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
