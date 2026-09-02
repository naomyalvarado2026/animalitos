import { motion } from 'motion/react';
import { TrendingDown, UtensilsCrossed, Stethoscope, Building2, Users, Zap, Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/contexts/CurrencyContext';
import { PawBackground } from '@/components/layout/PawBackground';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ExpenseRecord, ExpenseCategory } from '@/types';
import { formatDateShort } from '@/lib/utils';


const CATEGORY_META: Record<ExpenseCategory, { label: string; icon: typeof TrendingDown; color: string; bg: string }> = {
  food: { label: 'Alimentación', icon: UtensilsCrossed, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/20' },
  medical: { label: 'Atención Médica', icon: Stethoscope, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/20' },
  infrastructure: { label: 'Infraestructura', icon: Building2, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20' },
  salary: { label: 'Personal', icon: Users, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/20' },
  utilities: { label: 'Servicios', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/20' },
  services: { label: 'Servicios', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/20' },
  supplies: { label: 'Insumos', icon: Package, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
  other: { label: 'Otros', icon: TrendingDown, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-950/20' },
};

export function ExpensesPage() {
  const { formatAmount } = useCurrency();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['transparency-expense'],
    queryFn: async () => {
      const { data, error } = await supabase
          .from('expense_records')
          .select('*')
          .eq('is_public', true)
          .order('date', { ascending: false })
          .limit(60);
      if (error) throw error;
      return (data ?? []) as ExpenseRecord[];
    },
  });

  const total = records.reduce((s, r) => s + (r.amount_usd ?? 0), 0);

  // Group by category for summary
  const byCat = Object.keys(CATEGORY_META).map((cat) => {
    const catRecords = records.filter(r => r.category === cat as ExpenseCategory);
    return {
      cat: cat as ExpenseCategory,
      total: catRecords.reduce((s, r) => s + (r.amount_usd ?? 0), 0),
      count: catRecords.length,
    };
  }).filter(c => c.count > 0);

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative py-16 overflow-hidden">
        <PawBackground className="opacity-40" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <TrendingDown className="h-12 w-12 text-rose-500 mx-auto mb-4" />
            <h1 className="font-heading text-4xl font-bold mb-3">Egresos</h1>
            <p className="text-[var(--color-muted-foreground)]">
              Detalle completo de en qué se usan los recursos del refugio.
            </p>
            <p className="font-heading text-3xl font-bold text-rose-600 dark:text-rose-400 mt-4">
              Total: {formatAmount(total)}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category Summary */}
      <section className="py-10 bg-[var(--color-card)] border-y border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-xl font-semibold mb-6">Por Categoría</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {byCat.map(({ cat, total: catTotal }) => {
              const meta = CATEGORY_META[cat];
              return (
                <Card key={cat}>
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className={`w-9 h-9 rounded-xl ${meta.bg} flex items-center justify-center mb-2`}>
                      <meta.icon className={`h-5 w-5 ${meta.color}`} />
                    </div>
                    <p className="text-xs text-[var(--color-muted-foreground)]">{meta.label}</p>
                    <p className="font-heading font-bold text-lg">{formatAmount(catTotal)}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* All records */}
      <section className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Registro Detallado</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-[var(--color-muted-foreground)]">Cargando...</div>
            ) : records.length === 0 ? (
              <div className="text-center py-12 text-[var(--color-muted-foreground)]">
                No hay egresos registrados todavía.
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {records.map((r, i) => {
                  const meta = CATEGORY_META[r.category];
                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.02 }}
                      className="flex items-center justify-between py-3 gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center shrink-0`}>
                          <meta.icon className={`h-4 w-4 ${meta.color}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{r.description}</p>
                          {r.vendor && (
                            <p className="text-xs text-[var(--color-muted-foreground)] truncate">{r.vendor}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-rose-600 dark:text-rose-400">
                          -{formatAmount(r.amount_usd)}
                        </p>
                        <div className="flex items-center gap-2 justify-end">
                          <Badge variant="secondary" className="text-xs">{meta.label}</Badge>
                          <p className="text-xs text-[var(--color-muted-foreground)]">{formatDateShort(r.date)}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
