import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Download, FileBarChart, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { downloadCsv, type CsvValue } from '@/lib/exportCsv';
import { useCurrency } from '@/contexts/CurrencyContext';

type DogRow = { id: string; name: string; breed: string | null; status: string; size: string; age_months: number; location: string; updated_at: string };
type AdoptionRow = { id: string; animal_id: string; applicant_name: string; applicant_email: string; status: string; created_at: string; updated_at: string };
type FinanceRow = { id: string; description: string; category: string; amount_usd: number; date: string; record_type: 'income' | 'expense' };
type VolunteerRow = { id: string; full_name: string; email: string; area_of_interest: string; status: string; created_at: string };

type ReportsData = {
  dogs: DogRow[];
  adoptions: AdoptionRow[];
  finance: FinanceRow[];
  volunteers: VolunteerRow[];
  errors: string[];
};

type ReportKey = keyof Pick<ReportsData, 'dogs' | 'adoptions' | 'finance' | 'volunteers'>;

const reportLabels: Record<ReportKey, { title: string; description: string; filename: string }> = {
  dogs: { title: 'Perritos', description: 'Estado y ubicación de los perritos registrados.', filename: 'adoptame-perritos' },
  adoptions: { title: 'Adopciones', description: 'Solicitudes recibidas y su estado actual.', filename: 'adoptame-solicitudes-adopcion' },
  finance: { title: 'Finanzas', description: 'Ingresos y egresos registrados en dólares estadounidenses.', filename: 'adoptame-finanzas' },
  volunteers: { title: 'Voluntariado', description: 'Personas inscritas y estado de seguimiento.', filename: 'adoptame-voluntariado' },
};

function queryError(resource: string, error: { message?: string } | null) {
  return error ? `${resource}: ${error.message || 'no fue posible consultar Supabase'}` : null;
}

function rowsForReport(key: ReportKey, data: ReportsData, formatAmount: (amount: number) => string): { headers: string[]; rows: CsvValue[][] } {
  if (key === 'dogs') {
    return { headers: ['ID', 'Nombre', 'Raza', 'Estado', 'Tamaño', 'Edad (meses)', 'Ubicación', 'Actualizado'], rows: (data.dogs || []).map((row) => [row.id, row.name || 'Perrito', row.breed ?? 'Mestizo', row.status, row.size, row.age_months ?? 12, row.location ?? 'Refugio', row.updated_at]) };
  }
  if (key === 'adoptions') {
    return { headers: ['ID', 'ID del perrito', 'Solicitante', 'Correo', 'Estado', 'Creada', 'Actualizada'], rows: (data.adoptions || []).map((row) => [row.id, row.animal_id, row.applicant_name ?? '', row.applicant_email ?? '', row.status, row.created_at, row.updated_at]) };
  }
  if (key === 'finance') {
    return { headers: ['ID', 'Tipo', 'Descripción', 'Categoría', 'Monto USD', 'Fecha'], rows: (data.finance || []).map((row) => [row.id, row.record_type, row.description, row.category, formatAmount(row.amount_usd || 0), row.date]) };
  }
  return { headers: ['ID', 'Nombre', 'Correo', 'Área de interés', 'Estado', 'Registrado'], rows: (data.volunteers || []).map((row) => [row.id, row.full_name ?? '', row.email ?? '', row.area_of_interest ?? '', row.status, row.created_at]) };
}

export function AdminReportsPage() {
  const { formatAmount } = useCurrency();
  const [activeReport, setActiveReport] = useState<ReportKey>('dogs');
  const reportsQuery = useQuery<ReportsData>({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const [dogsRes, adoptionsRes, incomeRes, expensesRes, volunteersRes] = await Promise.all([
        supabase.from('animals').select('id, name, breed, status, size, age_months, location, updated_at').eq('species', 'dog').order('updated_at', { ascending: false }),
        supabase.from('adoption_applications').select('id, animal_id, applicant_name, applicant_email, status, created_at, updated_at').order('created_at', { ascending: false }),
        supabase.from('income_records').select('id, description, category, amount_usd, date').order('date', { ascending: false }),
        supabase.from('expense_records').select('id, description, category, amount_usd, date').order('date', { ascending: false }),
        supabase.from('volunteer_applications').select('id, full_name, email, area_of_interest, status, created_at').order('created_at', { ascending: false }),
      ]);

      const errors = [
        queryError('Perritos', dogsRes.error),
        queryError('Solicitudes de adopción', adoptionsRes.error),
        queryError('Ingresos', incomeRes.error),
        queryError('Egresos', expensesRes.error),
        queryError('Voluntariado', volunteersRes.error),
      ].filter((error): error is string => Boolean(error));

      return {
        dogs: (dogsRes.data ?? []) as DogRow[],
        adoptions: (adoptionsRes.data ?? []) as AdoptionRow[],
        finance: [
          ...(incomeRes.data ?? []).map((row) => ({ ...row, record_type: 'income' as const })),
          ...(expensesRes.data ?? []).map((row) => ({ ...row, record_type: 'expense' as const })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) as FinanceRow[],
        volunteers: (volunteersRes.data ?? []) as VolunteerRow[],
        errors,
      };
    },
  });

  const data = reportsQuery.data;
  const currentRows = data ? rowsForReport(activeReport, data, formatAmount) : { headers: [], rows: [] };
  const currentItems = data?.[activeReport] ?? [];

  function exportCurrentReport() {
    if (!currentItems.length) return;
    downloadCsv(reportLabels[activeReport].filename, currentRows.headers, currentRows.rows);
  }

  return (
    <section className="space-y-6" aria-labelledby="admin-reports-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]"><FileBarChart className="h-4 w-4" />Reportes administrativos</div>
          <h1 id="admin-reports-title" className="font-heading text-2xl font-bold">Datos para tomar decisiones</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--color-muted-foreground)]">Exporta únicamente información consultada desde Supabase. No se incluyen datos de demostración ni registros locales.</p>
        </div>
        <button type="button" onClick={() => void reportsQuery.refetch()} disabled={reportsQuery.isFetching} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] px-4 text-sm font-semibold transition-colors hover:bg-[var(--color-muted)] disabled:cursor-wait disabled:opacity-60">
          <RefreshCw className={`h-4 w-4 ${reportsQuery.isFetching ? 'animate-spin' : ''}`} />Actualizar datos
        </button>
      </div>

      {reportsQuery.isLoading && <div className="rounded-2xl border border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-muted-foreground)]" aria-live="polite">Consultando reportes en Supabase…</div>}
      {reportsQuery.error && <div role="alert" className="rounded-2xl border border-rose-300 bg-rose-50 p-5 text-sm text-rose-950 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100">No fue posible cargar los reportes. Revisa la conexión y las políticas RLS de Supabase.</div>}
      {data && data.errors.length > 0 && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Algunos reportes no están disponibles</p><p className="mt-1 break-words text-xs">{data.errors.join(' · ')}</p></div></div>}

      {data && <>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(reportLabels) as ReportKey[]).map((key) => <button key={key} type="button" onClick={() => setActiveReport(key)} aria-pressed={activeReport === key} className={`rounded-2xl border p-4 text-left transition-colors ${activeReport === key ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-[var(--color-border)] hover:bg-[var(--color-muted)]'}`}><p className="font-semibold">{reportLabels[key].title}</p><p className="mt-1 text-2xl font-bold">{data[key].length}</p><p className="text-xs text-[var(--color-muted-foreground)]">{reportLabels[key].description}</p></button>)}
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]">
          <div className="flex flex-col gap-3 border-b border-[var(--color-border)] p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-heading text-lg font-bold">{reportLabels[activeReport].title}</h2><p className="text-sm text-[var(--color-muted-foreground)]">{reportLabels[activeReport].description}</p></div><button type="button" onClick={exportCurrentReport} disabled={!currentItems.length} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"><Download className="h-4 w-4" />Exportar CSV</button></div>
          {!currentItems.length ? <p className="p-10 text-center text-sm text-[var(--color-muted-foreground)]">No hay registros disponibles para este reporte.</p> : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">{currentRows.headers.slice(0, 5).map((header) => <th key={header} className="whitespace-nowrap px-5 py-3 font-semibold">{header}</th>)}</tr></thead><tbody>{currentRows.rows.slice(0, 10).map((row, index) => <tr key={`${String(row[0])}-${index}`} className="border-b border-[var(--color-border)] last:border-0"><td className="max-w-44 truncate px-5 py-3">{String(row[0] ?? '—')}</td>{row.slice(1, 5).map((cell, cellIndex) => <td key={`${index}-${cellIndex}`} className="max-w-52 truncate whitespace-nowrap px-5 py-3">{String(cell ?? '—')}</td>)}</tr>)}</tbody></table>{currentItems.length > 10 && <p className="p-4 text-xs text-[var(--color-muted-foreground)]">Vista previa de 10 registros. El CSV incluye los {currentItems.length} registros.</p>}</div>}
        </div>
      </>}
    </section>
  );
}
