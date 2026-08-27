import { motion } from 'motion/react';
import { Star, Sparkles, Quote } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PawBackground } from '@/components/layout/PawBackground';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SuccessStory } from '@/types';
import { formatDateShort } from '@/lib/utils';
import { assetUrl } from '@/lib/assets';
import { ResilientImage } from '@/components/ui/ResilientImage';

export function SuccessStoriesPage() {
  const storiesQuery = useQuery({
    queryKey: ['success-stories-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('success_stories')
        .select('*')
        .order('adoption_date', { ascending: false });
      if (error) throw error;
      return data as SuccessStory[];
    },
  });

  const stories = storiesQuery.data ?? [];

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative py-16 overflow-hidden">
        <PawBackground className="opacity-40" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Sparkles className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-3">Historias de Éxito</h1>
            <p className="text-lg text-[var(--color-muted-foreground)] max-w-2xl mx-auto leading-relaxed">
              Cada adopción es una vida transformada. Conoce los conmovedores testimonios de los peluditos que encontraron su final feliz.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stories list */}
      <section className="py-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {storiesQuery.error && <div role="alert" className="mb-8 rounded-2xl border border-rose-300 bg-rose-50 p-5 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100">No pudimos cargar las historias publicadas. Intenta nuevamente más tarde.</div>}
        {!storiesQuery.isLoading && !storiesQuery.error && stories.length === 0 && <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-12 text-center text-[var(--color-muted-foreground)]">Pronto compartiremos nuevas historias de adopción.</div>}
        <div className="space-y-12">
          {stories.map((story, i) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <Card className="hover-card overflow-hidden border-[var(--color-border)]">
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                    {/* Image section */}
                    <div className="lg:col-span-5 relative bg-muted min-h-[300px]">
                      <ResilientImage
                        src={assetUrl(story.after_image_url)}
                        alt={story.animal_name}
                        className="w-full h-full object-cover min-h-[300px]"
                      />
                      <div className="absolute top-4 left-4">
                        <Badge variant="warm" className="shadow-md">
                          ❤️ Adoptado/a
                        </Badge>
                      </div>
                    </div>

                    {/* Text content */}
                    <div className="lg:col-span-7 p-8 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-4 mb-3">
                          <span className="text-xs font-semibold text-[var(--color-primary)] uppercase tracking-wider">
                            Adoptado por {story.adopter_name}
                          </span>
                          <span className="text-xs text-[var(--color-muted-foreground)]">
                            {formatDateShort(story.adoption_date)}
                          </span>
                        </div>

                        <h2 className="font-heading text-2xl font-bold text-[var(--color-foreground)] mb-3">
                          {story.title}
                        </h2>

                        <div className="relative pl-6 border-l-2 border-[var(--color-primary)] my-4">
                          <Quote className="absolute -left-3 -top-2 h-5 w-5 text-[var(--color-primary)] fill-[var(--color-primary)] opacity-30" />
                          <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed italic">
                            "{story.story}"
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-amber-500 pt-4">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} className="h-4 w-4 fill-current" />
                        ))}
                        <span className="text-xs font-medium text-[var(--color-muted-foreground)] ml-2">
                          Familia Feliz 🐾
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
