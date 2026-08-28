import { motion } from 'motion/react';
import { PawBackground } from '@/components/layout/PawBackground';
import { usePublicSettings } from '@/lib/publicSettings';
import { useMemo } from 'react';

const TIMELINE: { year: string; title: string; description: string; emoji: string }[] = [];

export function HistoryPage() {
  const { data: settings } = usePublicSettings(['history_timeline']);
  const timeline = useMemo(() => { try { const parsed = JSON.parse(settings?.history_timeline ?? 'null'); return Array.isArray(parsed) ? parsed : TIMELINE; } catch { return TIMELINE; } }, [settings]);
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
              {timeline.length === 0 ? <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-8 text-center text-[var(--color-muted-foreground)]">Pronto compartiremos los principales hitos de AdoptaME.</div> : timeline.map((item, i) => (
                <motion.div
                  key={`${item.year || 'year'}-${i}`}
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
