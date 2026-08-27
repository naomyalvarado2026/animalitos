import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/contexts/CurrencyContext';
import { PawBackground } from '@/components/layout/PawBackground';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Donor, DonorType } from '@/types';
import { ResilientImage } from '@/components/ui/ResilientImage';


const TYPE_LABEL: Record<DonorType, string> = {
  individual: 'Persona',
  company: 'Empresa',
  organization: 'Organización',
};

export function TopDonorsPage() {
  const { formatAmount } = useCurrency();

  const { data: donors = [], isLoading } = useQuery({
    queryKey: ['top-donors-public'],
    queryFn: async () => {
      const { data, error } = await supabase
          .from('donors')
          .select('*')
          .eq('is_featured', true)
          .eq('is_anonymous', false)
          .order('total_donated_usd', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Donor[];
    },
  });

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
            <Star className="h-14 w-14 text-amber-400 mx-auto mb-4 fill-amber-100" />
            <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-4">
              Donadores Principales
            </h1>
            <p className="text-lg text-[var(--color-muted-foreground)] max-w-2xl mx-auto">
              Con enorme gratitud reconocemos a quienes han hecho posible nuestro trabajo
              con sus generosas contribuciones. ¡Gracias de todo corazón! 🐾
            </p>
          </motion.div>
        </div>
      </section>

      {/* Donors grid */}
      <section className="py-14 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="text-center py-16 text-[var(--color-muted-foreground)]">Cargando...</div>
        ) : donors.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[var(--color-muted-foreground)]">
              Próximamente publicaremos nuestra lista de donadores destacados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {donors.map((donor, i) => (
              <motion.div
                key={donor.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <Card className="hover-card text-center h-full">
                  <CardContent className="pt-8 pb-6 px-6 flex flex-col items-center gap-3">
                    {donor.logo_url ? (
                      <ResilientImage
                        src={donor.logo_url}
                        alt={`Logo de ${donor.name}`}
                        className="w-16 h-16 rounded-2xl object-cover border border-[var(--color-border)]"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl brand-gradient-bg flex items-center justify-center text-3xl text-white">
                        {donor.type === 'company' ? '🏢' : donor.type === 'organization' ? '🌐' : '👤'}
                      </div>
                    )}

                    <div>
                      <h3 className="font-heading text-xl font-bold">{donor.name}</h3>
                      <Badge variant="secondary" className="mt-1">{TYPE_LABEL[donor.type]}</Badge>
                    </div>

                    <div className="mt-2 py-3 px-6 rounded-xl bg-[var(--color-accent)] w-full">
                      <p className="text-xs text-[var(--color-muted-foreground)] mb-0.5">Total donado</p>
                      <p className="font-heading text-2xl font-bold text-[var(--color-primary)]">
                        {formatAmount(donor.total_donated_usd)}
                      </p>
                    </div>

                    {donor.message && (
                      <p className="text-sm text-[var(--color-muted-foreground)] italic leading-relaxed">
                        "{donor.message}"
                      </p>
                    )}

                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
