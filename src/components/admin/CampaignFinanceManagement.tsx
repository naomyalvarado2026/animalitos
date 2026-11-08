import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, FileCheck2, LockKeyhole, Plus, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useCampaigns } from '@/lib/campaigns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type FinancialReport = {
  id: string; campaign_id: string; period_start: string; period_end: string;
  income_total_usd: number; expense_total_usd: number; public_summary: string;
  evidence_url: string | null; is_reconciled: boolean; verified_at: string | null; is_published: boolean;
};

export function CampaignFinanceManagement() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const campaigns = useCampaigns(true);
  const reports = useQuery({
    queryKey: ['campaign-financial-reports'],
    queryFn: async () => {
      const { data, error } = await supabase.from('campaign_financial_reports').select('*').order('period_start', { ascending: false });
      if (error) throw error;
      return (data ?? []) as FinancialReport[];
    },
  });

  const createReport = useMutation({
    mutationFn: async (form: FormData) => {
      const { error } = await supabase.from('campaign_financial_reports').insert([{
        campaign_id: String(form.get('campaign_id') ?? ''),
        period_start: String(form.get('period_start') ?? ''),
        period_end: String(form.get('period_end') ?? ''),
        public_summary: String(form.get('public_summary') ?? '').trim(),
        evidence_url: String(form.get('evidence_url') ?? '').trim() || null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaign-financial-reports'] }); setShowForm(false); toast.success('Borrador de rendición creado. Revisa los registros antes de conciliar.'); },
    onError: (error: Error) => toast.error(`No se creó el borrador: ${error.message}`),
  });

  const updateReport = useMutation({
    mutationFn: async ({ report, patch }: { report: FinancialReport; patch: Partial<FinancialReport> }) => {
      const { error } = await supabase.from('campaign_financial_reports').update(patch).eq('id', report.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['campaign-financial-reports'] }),
        qc.invalidateQueries({ queryKey: ['campaign-financial-reports-public'] }),
        qc.invalidateQueries({ queryKey: ['seasonal-campaigns'] }),
      ]);
      toast.success('Rendición actualizada.');
    },
    onError: (error: Error) => toast.error(`No se actualizó la rendición: ${error.message}`),
  });

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (String(data.get('period_end')) < String(data.get('period_start'))) {
      toast.error('La fecha final debe ser posterior o igual a la inicial.');
      return;
    }
    createReport.mutate(data);
  }

  const formatAmount = (value: number) => new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(Number(value) || 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-heading text-2xl font-bold">Rendición por campaña</h1><p className="mt-1 max-w-3xl text-sm text-[var(--color-muted-foreground)]">Los totales se calculan en la base desde ingresos completados y egresos reales, nunca desde datos de demostración. Si cambia el libro, la rendición se despublica y requiere nueva conciliación.</p></div><Button variant="warm" onClick={() => setShowForm(value => !value)}><Plus className="mr-2 h-4 w-4" />Nuevo borrador</Button></div>

      <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><LockKeyhole className="h-5 w-5 shrink-0" /><p>Vincula primero cada ingreso o egreso real con su campaña en <strong>Finanzas</strong>. Después revisa el período y los soportes. El portal público solo muestra rendiciones conciliadas y publicadas por Finanzas.</p></div>

      {showForm && <form onSubmit={submitForm} className="grid gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:grid-cols-2">
        <h2 className="font-heading text-lg font-bold sm:col-span-2">Crear borrador de rendición</h2>
        <div className="space-y-1"><Label htmlFor="report-campaign">Campaña</Label><select id="report-campaign" name="campaign_id" required className="h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-sm"><option value="">Selecciona</option>{campaigns.data?.map(campaign => <option key={campaign.id} value={campaign.id}>{campaign.title}</option>)}</select></div>
        <div className="space-y-1"><Label htmlFor="report-evidence">Soporte público (HTTPS, opcional)</Label><Input id="report-evidence" name="evidence_url" type="url" placeholder="Enlace a informe o documento público" /></div>
        <div className="space-y-1"><Label htmlFor="report-start">Desde</Label><Input id="report-start" name="period_start" type="date" required /></div>
        <div className="space-y-1"><Label htmlFor="report-end">Hasta</Label><Input id="report-end" name="period_end" type="date" required /></div>
        <div className="space-y-1 sm:col-span-2"><Label htmlFor="report-summary">Nota pública de conciliación</Label><Textarea id="report-summary" name="public_summary" minLength={10} maxLength={2000} required rows={3} placeholder="Describe el alcance del período y cualquier limitación de los registros." /></div>
        <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button><Button type="submit" disabled={createReport.isPending}>{createReport.isPending ? 'Creando…' : 'Crear borrador'}</Button></div>
      </form>}

      {reports.isLoading && <p role="status">Cargando rendiciones…</p>}{reports.error && <div role="alert" className="rounded-xl border border-rose-200 p-4 text-sm">No se pudieron cargar las rendiciones. <Button size="sm" variant="outline" onClick={() => reports.refetch()}>Reintentar</Button></div>}
      {!reports.isLoading && !reports.error && !reports.data?.length && <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-[var(--color-muted-foreground)]">No hay borradores ni cifras publicadas. No se han creado cifras de ejemplo.</p>}
      <div className="grid gap-4 lg:grid-cols-2">{reports.data?.map(report => {
        const campaign = campaigns.data?.find(item => item.id === report.campaign_id);
        const period = `${new Date(`${report.period_start}T12:00:00`).toLocaleDateString('es-EC')} — ${new Date(`${report.period_end}T12:00:00`).toLocaleDateString('es-EC')}`;
        return <article key={report.id} className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold text-[#f0644a]">{campaign?.season ?? 'Campaña'}</p><h2 className="font-heading text-lg font-bold">{campaign?.title ?? 'Campaña eliminada'}</h2><p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{period}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${report.is_published ? 'bg-emerald-100 text-emerald-800' : report.is_reconciled ? 'bg-amber-100 text-amber-900' : 'bg-zinc-100 text-zinc-700'}`}>{report.is_published ? 'Público' : report.is_reconciled ? 'Conciliado · privado' : 'Borrador'}</span></div>
          <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">{report.public_summary}</p>
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-[var(--color-background)] p-4"><p className="text-xs">Ingresos reales<br /><strong className="text-lg">{formatAmount(report.income_total_usd)}</strong></p><p className="text-xs">Egresos reales<br /><strong className="text-lg">{formatAmount(report.expense_total_usd)}</strong></p></div>
          <p className="text-xs text-[var(--color-muted-foreground)]">{report.verified_at ? `Última conciliación: ${new Date(report.verified_at).toLocaleString('es-EC')}` : 'Aún no conciliado'}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={updateReport.isPending} onClick={() => updateReport.mutate({ report, patch: { is_reconciled: true, is_published: false } })}><FileCheck2 className="mr-2 h-4 w-4" />Conciliar cifras</Button>
            {report.is_reconciled && !report.is_published && <Button size="sm" variant="warm" disabled={updateReport.isPending} onClick={() => updateReport.mutate({ report, patch: { is_published: true } })}><Send className="mr-2 h-4 w-4" />Publicar rendición</Button>}
            {report.is_published && <Button size="sm" variant="outline" disabled={updateReport.isPending} onClick={() => updateReport.mutate({ report, patch: { is_published: false } })}><BadgeCheck className="mr-2 h-4 w-4" />Retirar de la web</Button>}
          </div>
        </article>;
      })}</div>
    </div>
  );
}
