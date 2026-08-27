import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Heart, MessageSquare, Users, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { dataStore } from '@/lib/dataStore';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateShort } from '@/lib/utils';

interface StatItem {
  label: string;
  value: string;
  icon: typeof TrendingUp;
  color: string;
  bg: string;
}

export function AdminDashboard() {
  const { profile } = useAuth();
  const { formatAmount } = useCurrency();

  const { data: stats } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      let incomeList = dataStore.getIncome();
      let expenseList = dataStore.getExpenses();
      let donorsList = dataStore.getDonors();
      let appsList = dataStore.getAdoptionApplications();

      try {
        const [incomeRes, expenseRes, donorRes] = await Promise.all([
          supabase.from('income_records').select('*'),
          supabase.from('expense_records').select('*'),
          supabase.from('donors').select('*'),
        ]);
        if (incomeRes.data && incomeRes.data.length > 0) incomeList = incomeRes.data as any;
        if (expenseRes.data && expenseRes.data.length > 0) expenseList = expenseRes.data as any;
        if (donorRes.data && donorRes.data.length > 0) donorsList = donorRes.data as any;
      } catch {}

      const totalIncome = incomeList.reduce((s, r) => s + r.amount_usd, 0);
      const totalExpense = expenseList.reduce((s, r) => s + r.amount_usd, 0);

      return {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        donorCount: donorsList.length,
        unreadMessages: appsList.filter(a => a.status === 'pending').length,
        activeUsers: 4,
      };
    },
  });

  const { data: recentActivity = [] } = useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: async () => {
      try {
        const [income, expense] = await Promise.all([
          supabase.from('income_records').select('id, description, amount_usd, date, category').order('created_at', { ascending: false }).limit(5),
          supabase.from('expense_records').select('id, description, amount_usd, date, category').order('created_at', { ascending: false }).limit(5),
        ]);
        const all = [
          ...(income.data ?? []).map(r => ({ ...r, type: 'income' as const })),
          ...(expense.data ?? []).map(r => ({ ...r, type: 'expense' as const })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);
        
        if (all.length > 0) return all;

        // Fallback recent activity for demo
        return [
          { id: '1', description: 'Donación mensual - Familia García', amount_usd: 500.00, date: '2026-08-03', category: 'donation', type: 'income' as const },
          { id: '2', description: 'Alimento seco - Julio', amount_usd: 295.00, date: '2026-08-01', category: 'food', type: 'expense' as const },
          { id: '3', description: 'Aporte corporativo - PetCare S.A.', amount_usd: 2500.00, date: '2026-07-28', category: 'donation', type: 'income' as const },
          { id: '4', description: 'Consultas veterinarias', amount_usd: 350.00, date: '2026-07-25', category: 'medical', type: 'expense' as const },
          { id: '5', description: 'Bingo Solidario', amount_usd: 450.00, date: '2026-07-20', category: 'event', type: 'income' as const },
        ];
      } catch {
        return [
          { id: '1', description: 'Donación mensual - Familia García', amount_usd: 500.00, date: '2026-08-03', category: 'donation', type: 'income' as const },
          { id: '2', description: 'Alimento seco - Julio', amount_usd: 295.00, date: '2026-08-01', category: 'food', type: 'expense' as const },
          { id: '3', description: 'Aporte corporativo - PetCare S.A.', amount_usd: 2500.00, date: '2026-07-28', category: 'donation', type: 'income' as const },
          { id: '4', description: 'Consultas veterinarias', amount_usd: 350.00, date: '2026-07-25', category: 'medical', type: 'expense' as const },
        ];
      }
    },
  });

  const statItems: StatItem[] = [
    { label: 'Total Ingresos', value: formatAmount(stats?.totalIncome ?? 0), icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
    { label: 'Total Egresos', value: formatAmount(stats?.totalExpense ?? 0), icon: TrendingDown, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/20' },
    { label: 'Balance', value: formatAmount(stats?.balance ?? 0), icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20' },
    { label: 'Donadores', value: String(stats?.donorCount ?? 0), icon: Heart, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-950/20' },
    { label: 'Mensajes No Leídos', value: String(stats?.unreadMessages ?? 0), icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20' },
    { label: 'Usuarios Activos', value: String(stats?.activeUsers ?? 0), icon: Users, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/20' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="font-heading text-2xl font-bold">
          Bienvenido, {profile?.full_name?.split(' ')[0] ?? 'Admin'} 👋
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          Aquí está el resumen del refugio.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statItems.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.4 }}
          >
            <Card className="hover-card">
              <CardContent className="pt-6 pb-4 flex items-start gap-4">
                <div className={`p-3 rounded-2xl ${stat.bg} shrink-0`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted-foreground)] mb-0.5">{stat.label}</p>
                  <p className="font-heading text-2xl font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-center text-[var(--color-muted-foreground)] py-8">
              No hay actividad registrada todavía.
            </p>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {recentActivity.map((item) => (
                <div key={`${item.type}-${item.id}`} className="flex items-center justify-between py-3 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      item.type === 'income'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30'
                        : 'bg-rose-100 dark:bg-rose-900/30'
                    }`}>
                      {item.type === 'income'
                        ? <TrendingUp className="h-4 w-4 text-emerald-500" />
                        : <TrendingDown className="h-4 w-4 text-rose-500" />
                      }
                    </div>
                    <p className="text-sm truncate">{item.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-semibold text-sm ${
                      item.type === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {item.type === 'income' ? '+' : '-'}{formatAmount(item.amount_usd)}
                    </p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">{formatDateShort(item.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
