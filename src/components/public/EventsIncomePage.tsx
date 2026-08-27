import { motion } from 'motion/react';
import { Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/contexts/CurrencyContext';
import { PawBackground } from '@/components/layout/PawBackground';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { IncomeRecord } from '@/types';
import { formatDateShort } from '@/lib/utils';

export function EventsIncomePage() {
  const { formatAmount } = useCurrency();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['income_records', 'events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('income_records')
        .select('*')
        .eq('is_public', true)
        .eq('category', 'event')
        .order('date', { ascending: false });
      if (error) throw error;
      return data as IncomeRecord[];
    },
  });

  const total = records.reduce((s, r) => s + r.amount_usd, 0);

  return (
    <div className="pt-16">
      <section className="relative py-16 overflow-hidden">
        <PawBackground className="opacity-40" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Calendar className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h1 className="font-heading text-4xl font-bold mb-3">Eventos y Actividades</h1>
            <p className="text-[var(--color-muted-foreground)]">
              Ingresos generados a través de nuestros eventos, rifas, bazares y actividades especiales.
            </p>
            <p className="font-heading text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-4">
              Total: {formatAmount(total)}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="text-center py-16 text-[var(--color-muted-foreground)]">Cargando...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[var(--color-muted-foreground)]">No hay eventos registrados todavía.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
              >
                <Card className="hover-card">
                  <CardContent className="py-4 px-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                        <Calendar className="h-4 w-4 text-amber-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{r.event_name ?? r.description}</p>
                        {r.event_name && r.description && (
                          <p className="text-xs text-[var(--color-muted-foreground)] truncate">{r.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                        +{formatAmount(r.amount_usd)}
                      </p>
                      <div className="flex items-center gap-2 justify-end">
                        <Badge variant="warning" className="text-xs">Evento</Badge>
                        <p className="text-xs text-[var(--color-muted-foreground)]">{formatDateShort(r.date)}</p>
                      </div>
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
