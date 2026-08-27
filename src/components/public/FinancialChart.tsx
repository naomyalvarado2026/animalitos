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

const MOCK_FINANCIAL_DATA: MonthlyData[] = [
  { month: 'Ene', income: 1200, expense: 950 },
  { month: 'Feb', income: 1500, expense: 1100 },
  { month: 'Mar', income: 1800, expense: 1400 },
  { month: 'Abr', income: 2100, expense: 1600 },
  { month: 'May', income: 2600, expense: 1900 },
  { month: 'Jun', income: 3450, expense: 2150 },
  { month: 'Jul', income: 3950, expense: 2280 },
];

export function FinancialChart({ data = MOCK_FINANCIAL_DATA }: { data?: MonthlyData[] }) {
  const { formatAmount } = useCurrency();

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
