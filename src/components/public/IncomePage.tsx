import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { TrendingUp, Heart, Calendar, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/contexts/CurrencyContext';
import { PawBackground } from '@/components/layout/PawBackground';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { IncomeRecord } from '@/types';
import { formatDateShort } from '@/lib/utils';


const CATEGORY_LABEL: Record<string, string> = {
  donation: 'Donación',
  event: 'Evento',
  other: 'Otro',
};

const CATEGORY_VARIANT: Record<string, 'success' | 'warning' | 'secondary'> = {
  donation: 'success',
  event: 'warning',
  other: 'secondary',
};

export function IncomePage() {
  const { formatAmount } = useCurrency();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['transparency-income'],
    queryFn: async () => {
      const { data, error } = await supabase
          .from('income_records')
          .select('*, donor:donors(name, is_anonymous)')
          .eq('is_public', true)
          .order('date', { ascending: false })
          .limit(50);
      if (error) throw error;
      return (data ?? []) as IncomeRecord[];
    },
  });

  const totalUSD = records.reduce((sum, r) => sum + r.amount_usd, 0);
  const donationsTotal = records.filter(r => r.category === 'donation').reduce((s, r) => s + r.amount_usd, 0);
  const eventsTotal = records.filter(r => r.category === 'event').reduce((s, r) => s + r.amount_usd, 0);

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative py-16 overflow-hidden">
        <PawBackground className="opacity-40" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <TrendingUp className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-3">Ingresos</h1>
            <p className="text-[var(--color-muted-foreground)] max-w-xl mx-auto">
              Registro completo de todos los recursos que recibimos. Actualizado regularmente.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Summary cards */}
      <section className="py-8 bg-[var(--color-card)] border-y border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: 'Total Ingresos', value: formatAmount(totalUSD), icon: TrendingUp, color: 'text-emerald-500' },
              { label: 'Por Donaciones', value: formatAmount(donationsTotal), icon: Heart, color: 'text-rose-500' },
              { label: 'Por Eventos', value: formatAmount(eventsTotal), icon: Calendar, color: 'text-amber-500' },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="pt-6 pb-4 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-[var(--color-background)]">
                    <s.icon className={`h-6 w-6 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-muted-foreground)] mb-0.5">{s.label}</p>
                    <p className="font-heading text-2xl font-bold">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sub-categories */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Link to="/transparencia/ingresos/donaciones" className="block group">
              <Card className="hover-card h-full">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 shrink-0">
                    <Heart className="h-6 w-6 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg mb-1 group-hover:text-[var(--color-primary)] transition-colors">
                      Donaciones
                    </h3>
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      Aportes de personas y empresas que apoyan nuestra causa.
                    </p>
                    <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-[var(--color-primary)]">
                      Ver detalle <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/transparencia/ingresos/eventos" className="block group">
              <Card className="hover-card h-full">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 shrink-0">
                    <Calendar className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg mb-1 group-hover:text-[var(--color-primary)] transition-colors">
                      Eventos y Actividades
                    </h3>
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      Recaudaciones de bingos, rifas, bazares y actividades especiales.
                    </p>
                    <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-[var(--color-primary)]">
                      Ver detalle <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Recent records */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Registros Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12 text-[var(--color-muted-foreground)]">Cargando...</div>
              ) : records.length === 0 ? (
                <div className="text-center py-12 text-[var(--color-muted-foreground)]">
                  No hay registros publicados todavía.
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-border)]">
                  {records.map((r) => (
                    <div key={r.id} className="flex items-center justify-between py-3 gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge variant={CATEGORY_VARIANT[r.category] ?? 'secondary'} className="shrink-0">
                          {CATEGORY_LABEL[r.category] ?? r.category}
                        </Badge>
                        <span className="text-sm truncate">{r.description}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          +{formatAmount(r.amount_usd)}
                        </span>
                        <p className="text-xs text-[var(--color-muted-foreground)]">{formatDateShort(r.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-8 text-center">
        <Button variant="outline" asChild>
          <Link to="/transparencia/egresos">Ver Egresos →</Link>
        </Button>
      </section>
    </div>
  );
}
