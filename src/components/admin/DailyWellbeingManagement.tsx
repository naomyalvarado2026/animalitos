import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, MapPin, PawPrint, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type AnimalRow = { id: string; name: string; status: string | null; location: string; main_image_url: string | null };
type DailyRound = {
  id: string; animal_id: string; observed_on: string; location_confirmed: boolean;
  appetite: string; water: string; behavior: string; enrichment_completed: boolean;
  notes: string | null; follow_up_required: boolean; follow_up_summary: string | null;
};

function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const statusLabel: Record<string, string> = {
  available: 'Disponible', pending: 'En proceso', medical_care: 'Atención veterinaria', medical_hold: 'En observación',
};

export function DailyWellbeingManagement() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const date = localToday();
  const animals = useQuery({
    queryKey: ['daily-round-animals'],
    queryFn: async () => {
      const { data, error } = await supabase.from('animals')
        .select('id, name, status, location, main_image_url')
        .order('name');
      if (error) throw error;
      return ((data ?? []) as AnimalRow[]).filter(animal => animal.status !== 'adopted');
    },
  });
  const rounds = useQuery({
    queryKey: ['animal-daily-rounds', date],
    queryFn: async () => {
      const { data, error } = await supabase.from('animal_daily_rounds').select('*').eq('observed_on', date);
      if (error) throw error;
      return (data ?? []) as DailyRound[];
    },
  });
  const roundsByAnimal = useMemo(() => new Map((rounds.data ?? []).map(round => [round.animal_id, round])), [rounds.data]);

  const saveRound = useMutation({
    mutationFn: async ({ animal, form }: { animal: AnimalRow; form: FormData }) => {
      if (!profile?.id) throw new Error('No se pudo identificar al usuario del equipo.');
      const followUpRequired = form.get('follow_up_required') === 'on';
      const followUpSummary = String(form.get('follow_up_summary') ?? '').trim();
      if (followUpRequired && followUpSummary.length < 3) throw new Error('Describe el seguimiento pendiente para que alguien pueda retomarlo.');
      const { error } = await supabase.from('animal_daily_rounds').upsert({
        animal_id: animal.id,
        observed_on: date,
        location_confirmed: form.get('location_confirmed') === 'on',
        appetite: String(form.get('appetite') ?? 'not_observed'),
        water: String(form.get('water') ?? 'not_observed'),
        behavior: String(form.get('behavior') ?? 'not_observed'),
        enrichment_completed: form.get('enrichment_completed') === 'on',
        notes: String(form.get('notes') ?? '').trim() || null,
        follow_up_required: followUpRequired,
        follow_up_summary: followUpRequired ? followUpSummary : null,
        checked_by: profile.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'animal_id,observed_on' });
      if (error) throw error;
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['animal-daily-rounds', date] }); toast.success('Ronda de hoy guardada.'); },
    onError: (error: Error) => toast.error(error.message),
  });

  const activeAnimalIds = new Set((animals.data ?? []).map(animal => animal.id));
  const activeRounds = (rounds.data ?? []).filter(round => activeAnimalIds.has(round.animal_id));
  const checkedCount = activeRounds.length;
  const confirmedLocationCount = activeRounds.filter(round => round.location_confirmed).length;
  const followUps = activeRounds.filter(round => round.follow_up_required).length;

  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--color-primary)]">Operación diaria · {new Date(`${date}T12:00:00`).toLocaleDateString('es-EC', { dateStyle: 'full' })}</p><h1 className="mt-2 font-heading text-3xl font-bold">Bienestar de la manada</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">Confirma presencia y ubicación; registra observaciones sobre apetito, agua, conducta y enriquecimiento. Es una herramienta de cuidado y seguimiento, no un diagnóstico veterinario.</p></div>
      <Button variant="outline" onClick={() => { void animals.refetch(); void rounds.refetch(); }}><RefreshCw className="mr-2 h-4 w-4" />Actualizar</Button>
    </header>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumen de rondas">
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4"><p className="text-sm text-[var(--color-muted-foreground)]">Animales en cuidado</p><p className="mt-1 text-2xl font-bold">{animals.data?.length ?? 0}</p></div>
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4"><p className="text-sm text-[var(--color-muted-foreground)]">Rondas registradas hoy</p><p className="mt-1 text-2xl font-bold">{checkedCount}<span className="text-sm font-normal text-[var(--color-muted-foreground)]"> / {animals.data?.length ?? 0}</span></p></div>
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4"><p className="text-sm text-[var(--color-muted-foreground)]">Ubicación confirmada</p><p className="mt-1 text-2xl font-bold">{confirmedLocationCount}<span className="text-sm font-normal text-[var(--color-muted-foreground)]"> / {animals.data?.length ?? 0}</span></p></div>
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950"><p className="text-sm">Seguimientos señalados hoy</p><p className="mt-1 text-2xl font-bold">{followUps}</p></div>
    </section>

    {animals.isLoading && <p role="status">Cargando animales…</p>}
    {animals.error && <div role="alert" className="rounded-2xl border border-rose-300 p-5 text-sm">No se pudo cargar el inventario. <Button variant="outline" size="sm" onClick={() => void animals.refetch()}>Reintentar</Button></div>}
    {!animals.isLoading && !animals.error && animals.data?.length === 0 && <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-[var(--color-muted-foreground)]">No hay animales activos para revisar.</div>}
    <section className="grid gap-4 xl:grid-cols-2" aria-label="Lista de observación diaria">
      {animals.data?.map(animal => {
        const round = roundsByAnimal.get(animal.id);
        return <form key={animal.id} onSubmit={event => { event.preventDefault(); saveRound.mutate({ animal, form: new FormData(event.currentTarget) }); }} className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 sm:p-5">
          <div className="flex items-center gap-3">
            {animal.main_image_url ? <img src={animal.main_image_url} alt="" className="h-14 w-14 rounded-2xl object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-secondary)]"><PawPrint className="h-6 w-6 text-[var(--color-primary)]" /></div>}
            <div className="min-w-0 flex-1"><h2 className="truncate font-heading text-lg font-bold">{animal.name}</h2><p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--color-muted-foreground)]"><MapPin className="h-3.5 w-3.5" />{animal.location || 'Ubicación sin registrar'} · {animal.status ? statusLabel[animal.status] ?? animal.status : 'Estado sin registrar'}</p></div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${round?.location_confirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>{round?.location_confirmed ? 'Ronda completa' : round ? 'Confirma ubicación' : 'Pendiente'}</span>
          </div>
          {round?.follow_up_required && <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"><strong>Seguimiento pendiente:</strong> {round.follow_up_summary || 'Revisar la observación registrada.'}</p>}
          <label className="flex items-start gap-2 rounded-xl border border-[var(--color-border)] p-3 text-sm"><input type="checkbox" name="location_confirmed" defaultChecked={round?.location_confirmed ?? false} className="mt-0.5 accent-[var(--color-primary)]" /><span>Vi a este animal y confirmé que está en la ubicación registrada.</span></label>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1"><Label htmlFor={`appetite-${animal.id}`}>Apetito</Label><select id={`appetite-${animal.id}`} name="appetite" required defaultValue={round?.appetite ?? 'not_observed'} className="h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] px-2 text-sm"><option value="normal">Habitual</option><option value="reduced">Menor</option><option value="none">No ingirió</option><option value="not_observed">Sin revisar</option></select></div>
            <div className="space-y-1"><Label htmlFor={`water-${animal.id}`}>Agua</Label><select id={`water-${animal.id}`} name="water" required defaultValue={round?.water ?? 'not_observed'} className="h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] px-2 text-sm"><option value="normal">Habitual</option><option value="reduced">Menor</option><option value="none">Sin acceso observado</option><option value="not_observed">Sin revisar</option></select></div>
            <div className="space-y-1"><Label htmlFor={`behavior-${animal.id}`}>Conducta</Label><select id={`behavior-${animal.id}`} name="behavior" required defaultValue={round?.behavior ?? 'not_observed'} className="h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] px-2 text-sm"><option value="usual">Habitual</option><option value="changed">Cambio observado</option><option value="concerning">Requiere atención</option><option value="not_observed">Sin revisar</option></select></div>
          </div>
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="enrichment_completed" defaultChecked={round?.enrichment_completed ?? false} className="mt-0.5 accent-[var(--color-primary)]" /><span>Actividad de enriquecimiento realizada</span></label>
          <div className="space-y-1"><Label htmlFor={`round-notes-${animal.id}`}>Observaciones breves</Label><Textarea id={`round-notes-${animal.id}`} name="notes" maxLength={1000} rows={2} defaultValue={round?.notes ?? ''} placeholder="Describe lo que observaste, sin interpretar síntomas." /></div>
          <div className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-3"><label className="flex items-start gap-2 text-sm font-semibold text-amber-950"><input type="checkbox" name="follow_up_required" defaultChecked={round?.follow_up_required ?? false} className="mt-0.5 accent-amber-700" /><span>Necesita seguimiento del equipo</span></label><Textarea aria-label={`Seguimiento pendiente para ${animal.name}`} name="follow_up_summary" maxLength={1000} rows={2} defaultValue={round?.follow_up_summary ?? ''} placeholder="Qué observaste y quién debería revisarlo" /></div>
          <Button type="submit" size="sm" variant="warm" disabled={saveRound.isPending}><ClipboardCheck className="mr-2 h-4 w-4" />Guardar ronda</Button>
        </form>;
      })}
    </section>
  </div>;
}
