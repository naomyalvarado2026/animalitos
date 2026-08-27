import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { dataStore } from '@/lib/dataStore';
import { useCurrency } from '@/contexts/CurrencyContext';
import { TrendingUp, TrendingDown, Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { IncomeRecord, ExpenseRecord, IncomeCategory, ExpenseCategory } from '@/types';
import { formatDateShort } from '@/lib/utils';

const incomeSchema = z.object({
  description: z.string().min(1),
  amount_usd: z.coerce.number().positive(),
  date: z.string().min(1),
  category: z.enum(['donation', 'event', 'other']),
  event_name: z.string().optional(),
  is_public: z.boolean().default(true),
});

const expenseSchema = z.object({
  description: z.string().min(1),
  amount_usd: z.coerce.number().positive(),
  date: z.string().min(1),
  category: z.enum(['food', 'medical', 'infrastructure', 'salary', 'utilities', 'supplies', 'other']),
  vendor: z.string().optional(),
  is_public: z.boolean().default(true),
});

interface IncomeForm {
  description: string;
  amount_usd: number;
  date: string;
  category: 'donation' | 'event' | 'other';
  event_name?: string;
  is_public: boolean;
}

interface ExpenseForm {
  description: string;
  amount_usd: number;
  date: string;
  category: 'food' | 'medical' | 'infrastructure' | 'salary' | 'utilities' | 'supplies' | 'other';
  vendor?: string;
  is_public: boolean;
}

const INCOME_CATS: { value: IncomeCategory; label: string }[] = [
  { value: 'donation', label: 'Donación' },
  { value: 'event', label: 'Evento' },
  { value: 'other', label: 'Otro' },
];

const EXPENSE_CATS: { value: ExpenseCategory; label: string }[] = [
  { value: 'food', label: 'Alimentación' },
  { value: 'medical', label: 'Médico' },
  { value: 'infrastructure', label: 'Infraestructura' },
  { value: 'salary', label: 'Personal' },
  { value: 'utilities', label: 'Servicios' },
  { value: 'supplies', label: 'Insumos' },
  { value: 'other', label: 'Otro' },
];

export function FinanceManagement() {
  const { formatAmount } = useCurrency();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'income' | 'expense'>('income');
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const { data: incomeRecords = [] } = useQuery({
    queryKey: ['admin-income'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('income_records').select('*').order('date', { ascending: false }).limit(50);
        if (!error && data && data.length > 0) return data as IncomeRecord[];
      } catch {}
      return dataStore.getIncome();
    },
  });

  const { data: expenseRecords = [] } = useQuery({
    queryKey: ['admin-expense'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('expense_records').select('*').order('date', { ascending: false }).limit(50);
        if (!error && data && data.length > 0) return data as ExpenseRecord[];
      } catch {}
      return dataStore.getExpenses();
    },
  });

  const incomeForm = useForm<IncomeForm>({
    resolver: zodResolver(incomeSchema) as any,
    defaultValues: { category: 'donation', is_public: true, date: new Date().toISOString().split('T')[0] },
  });

  const expenseForm = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: { category: 'food', is_public: true, date: new Date().toISOString().split('T')[0] },
  });

  const addIncome = useMutation({
    mutationFn: async (data: IncomeForm) => {
      dataStore.addIncome(data);
      try {
        await supabase.from('income_records').insert([data]);
      } catch {}
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-income'] });
      qc.invalidateQueries({ queryKey: ['transparency-income'] });
      qc.invalidateQueries({ queryKey: ['public-transparency'] });
      toast.success('Ingreso registrado.');
      incomeForm.reset();
      setShowIncomeForm(false);
    },
    onError: () => toast.error('Error al registrar ingreso.'),
  });

  const addExpense = useMutation({
    mutationFn: async (data: ExpenseForm) => {
      dataStore.addExpense(data);
      try {
        await supabase.from('expense_records').insert([data]);
      } catch {}
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-expense'] });
      qc.invalidateQueries({ queryKey: ['transparency-expense'] });
      qc.invalidateQueries({ queryKey: ['public-transparency'] });
      toast.success('Egreso registrado.');
      expenseForm.reset();
      setShowExpenseForm(false);
    },
    onError: () => toast.error('Error al registrar egreso.'),
  });

  const deleteIncome = useMutation({
    mutationFn: async (id: string) => {
      dataStore.deleteIncome(id);
      try {
        await supabase.from('income_records').delete().eq('id', id);
      } catch {}
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-income'] });
      qc.invalidateQueries({ queryKey: ['transparency-income'] });
      toast.success('Ingreso eliminado.');
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expense_records').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-expense'] });
      toast.success('Egreso eliminado.');
    },
  });

  const totalIncome = incomeRecords.reduce((s, r) => s + r.amount_usd, 0);
  const totalExpense = expenseRecords.reduce((s, r) => s + r.amount_usd, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-heading text-2xl font-bold">Gestión Financiera</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setShowIncomeForm(!showIncomeForm); setShowExpenseForm(false); }}>
            <Plus className="h-4 w-4" />
            Ingreso
          </Button>
          <Button variant="warm" size="sm" onClick={() => { setShowExpenseForm(!showExpenseForm); setShowIncomeForm(false); }}>
            <Plus className="h-4 w-4" />
            Egreso
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-[var(--color-muted-foreground)]">Total Ingresos</p>
            <p className="font-heading text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatAmount(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-[var(--color-muted-foreground)]">Total Egresos</p>
            <p className="font-heading text-2xl font-bold text-rose-600 dark:text-rose-400">{formatAmount(totalExpense)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-[var(--color-muted-foreground)]">Balance</p>
            <p className={`font-heading text-2xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatAmount(totalIncome - totalExpense)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Income form */}
      {showIncomeForm && (
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Nuevo Ingreso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={incomeForm.handleSubmit(d => addIncome.mutate(d))} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="inc-desc">Descripción</Label>
                <Input id="inc-desc" {...incomeForm.register('description')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inc-amount">Monto (USD)</Label>
                <Input id="inc-amount" type="number" step="0.01" {...incomeForm.register('amount_usd')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inc-date">Fecha</Label>
                <Input id="inc-date" type="date" {...incomeForm.register('date')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inc-cat">Categoría</Label>
                <select id="inc-cat" {...incomeForm.register('category')} className="flex h-9 w-full rounded-lg border border-[var(--color-input)] bg-transparent px-3 py-1 text-sm">
                  {INCOME_CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowIncomeForm(false)}>Cancelar</Button>
                <Button type="submit" variant="default" disabled={addIncome.isPending}>Guardar Ingreso</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Expense form */}
      {showExpenseForm && (
        <Card className="border-rose-200 dark:border-rose-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-rose-500" />
              Nuevo Egreso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={expenseForm.handleSubmit(d => addExpense.mutate(d))} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="exp-desc">Descripción</Label>
                <Input id="exp-desc" {...expenseForm.register('description')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="exp-amount">Monto (USD)</Label>
                <Input id="exp-amount" type="number" step="0.01" {...expenseForm.register('amount_usd')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="exp-date">Fecha</Label>
                <Input id="exp-date" type="date" {...expenseForm.register('date')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="exp-cat">Categoría</Label>
                <select id="exp-cat" {...expenseForm.register('category')} className="flex h-9 w-full rounded-lg border border-[var(--color-input)] bg-transparent px-3 py-1 text-sm">
                  {EXPENSE_CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="exp-vendor">Proveedor (opcional)</Label>
                <Input id="exp-vendor" {...expenseForm.register('vendor')} placeholder="Nombre del proveedor" />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowExpenseForm(false)}>Cancelar</Button>
                <Button type="submit" variant="destructive" disabled={addExpense.isPending}>Guardar Egreso</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border)]">
        {(['income', 'expense'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
            }`}
          >
            {t === 'income' ? '📈 Ingresos' : '📉 Egresos'}
          </button>
        ))}
      </div>

      {/* Records table */}
      <Card>
        <CardContent className="pt-4">
          <div className="divide-y divide-[var(--color-border)]">
            {tab === 'income' ? (
              incomeRecords.length === 0 ? (
                <p className="text-center py-8 text-[var(--color-muted-foreground)] text-sm">Sin ingresos.</p>
              ) : incomeRecords.map(r => (
                <div key={r.id} className="flex items-center justify-between py-3 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant={r.is_public ? 'success' : 'secondary'} className="shrink-0 text-xs">
                      {r.is_public ? 'Público' : 'Privado'}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.description}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">{formatDateShort(r.date)} · {r.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{formatAmount(r.amount_usd)}</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-[var(--color-destructive)]"
                      onClick={() => { if (confirm('¿Eliminar este ingreso?')) deleteIncome.mutate(r.id); }}
                      aria-label="Eliminar ingreso">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              expenseRecords.length === 0 ? (
                <p className="text-center py-8 text-[var(--color-muted-foreground)] text-sm">Sin egresos.</p>
              ) : expenseRecords.map(r => (
                <div key={r.id} className="flex items-center justify-between py-3 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant={r.is_public ? 'success' : 'secondary'} className="shrink-0 text-xs">
                      {r.is_public ? 'Público' : 'Privado'}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.description}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">{formatDateShort(r.date)} · {r.category}{r.vendor ? ` · ${r.vendor}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-semibold text-rose-600 dark:text-rose-400">-{formatAmount(r.amount_usd)}</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-[var(--color-destructive)]"
                      onClick={() => { if (confirm('¿Eliminar este egreso?')) deleteExpense.mutate(r.id); }}
                      aria-label="Eliminar egreso">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
