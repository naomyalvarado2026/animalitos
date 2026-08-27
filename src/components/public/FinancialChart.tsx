import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { useCurrency } from '@/contexts/CurrencyContext';

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

export function FinancialChart({ data = [] }: { data?: MonthlyData[] }) {
  const { formatAmount } = useCurrency();

  if (data.length === 0) {
    return <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] px-6 text-center text-sm text-[var(--color-muted-foreground)]">Aún no hay datos financieros publicados.</div>;
  }

  return (
    <div className="w-full h-72 pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(val) => `$${val}`} />
          <Tooltip
            formatter={(value: any) => [formatAmount(Number(value)), '']}
            contentStyle={{
              borderRadius: '12px',
              backgroundColor: 'var(--color-card)',
              borderColor: 'var(--color-border)',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[6, 6, 0, 0]} />
          <Bar dataKey="expense" name="Egresos" fill="#f43f5e" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
