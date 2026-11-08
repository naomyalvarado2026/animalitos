import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, HeartHandshake, Home, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type FosterApplication = {
  id: string; applicant_name: string; applicant_email: string; applicant_phone: string; city: string; area: string | null;
  housing_type: string; has_resident_pets: boolean; experience: string; availability: string; animal_preferences: string | null;
  status: string; admin_notes: string | null; created_at: string;
};
type AnimalOption = { id: string; name: string; status: string };
type FosterPlacement = {
  id: string; animal_id: string; foster_application_id: string; status: string; starts_on: string | null;
  expected_review_on: string | null; ended_on: string | null; follow_up_due_on: string | null;
  private_follow_up_notes: string | null; outcome_notes: string | null;
  animals?: { name: string } | null; foster_applications?: { applicant_name: string } | null;
};

const APPLICATION_STATUSES = [['pending', 'Pendiente'], ['under_review', 'En revisión'], ['approved', 'Aprobado'], ['declined', 'No aprobado'], ['inactive', 'Inactivo']];
const PLACEMENT_STATUSES = [['planned', 'Planificada'], ['in_home', 'En hogar temporal'], ['returned', 'Regresó al refugio'], ['adopted', 'Adoptado'], ['closed', 'Cerrada']];

export function FosterManagement() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [showPlacementForm, setShowPlacementForm] = useState(false);
  const applications = useQuery({
    queryKey: ['admin-foster-applications'],
    queryFn: async () => {
      const { data, error } = await supabase.from('foster_applications').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as FosterApplication[];
    },
  });
  const animals = useQuery({
    queryKey: ['admin-foster-animals'],
    queryFn: async () => {
      const { data, error } = await supabase.from('animals').select('id,name,status').order('name');
      if (error) throw error;
      return (data ?? []) as AnimalOption[];
    },
  });
  const placements = useQuery({
    queryKey: ['admin-foster-placements'],
    queryFn: async () => {
      const { data, error } = await supabase.from('foster_placements').select('*, animals(name), foster_applications(applicant_name)').order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as FosterPlacement[];
    },
  });

  const saveApplication = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: FormData }) => {
      const { error } = await supabase.from('foster_applications').update({
        status: String(form.get('status') ?? 'pending'),
        admin_notes: String(form.get('admin_notes') ?? '').trim() || null,
        reviewed_by: profile?.id ?? null,
        updated_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-foster-applications'] }); toast.success('Postulación actualizada.'); },
    onError: () => toast.error('No se pudo actualizar la postulación.'),
  });

  const createPlacement = useMutation({
    mutationFn: async (form: FormData) => {
      const { error } = await supabase.from('foster_placements').insert([{
        animal_id: String(form.get('animal_id') ?? ''),
        foster_application_id: String(form.get('foster_application_id') ?? ''),
        status: 'planned',
        starts_on: String(form.get('starts_on') ?? '') || null,
        expected_review_on: String(form.get('expected_review_on') ?? '') || null,
        follow_up_due_on: String(form.get('follow_up_due_on') ?? '') || null,
        assigned_by: profile?.id ?? null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-foster-placements'] }); toast.success('Acogida planificada. Confirma el inicio cuando el animal llegue al hogar.'); setShowPlacementForm(false); },
    onError: (error: Error) => toast.error(`No se guardó la acogida: ${error.message}`),
  });

  const updatePlacement = useMutation({
    mutationFn: async ({ placement, form }: { placement: FosterPlacement; form: FormData }) => {
      const status = String(form.get('status') ?? placement.status);
      const ended = String(form.get('ended_on') ?? '');
      const { error } = await supabase.from('foster_placements').update({
        status,
        follow_up_due_on: String(form.get('follow_up_due_on') ?? '') || null,
        private_follow_up_notes: String(form.get('private_follow_up_notes') ?? '').trim() || null,
        outcome_notes: String(form.get('outcome_notes') ?? '').trim() || null,
        ended_on: ended || (['returned', 'adopted', 'closed'].includes(status) ? new Date().toISOString().slice(0, 10) : null),
        updated_at: new Date().toISOString(),
      }).eq('id', placement.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-foster-placements'] }); qc.invalidateQueries({ queryKey: ['admin-foster-animals'] }); toast.success('Seguimiento de acogida guardado.'); },
    onError: () => toast.error('No se pudo guardar el seguimiento de acogida.'),
  });

  function submitPlacement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createPlacement.mutate(new FormData(event.currentTarget));
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="flex items-center gap-2 font-heading text-2xl font-bold"><HeartHandshake className="h-6 w-6 text-[#f0644a]" />Hogares temporales</h1><p className="mt-1 max-w-2xl text-sm text-[var(--color-muted-foreground)]">Revisa postulaciones, planifica una acogida y registra chequeos. Al marcar “En hogar temporal” se actualiza el estado del animal.</p></div><Button variant="warm" onClick={() => setShowPlacementForm(value => !value)}><Home className="mr-2 h-4 w-4" />Planificar acogida</Button></div>

      {showPlacementForm && <form onSubmit={submitPlacement} className="grid gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:grid-cols-2">
        <h2 className="font-heading text-lg font-bold sm:col-span-2">Nueva acogida planificada</h2>
        <div className="space-y-1"><Label htmlFor="foster-animal">Animal</Label><select id="foster-animal" name="animal_id" required className="h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-sm"><option value="">Selecciona</option>{animals.data?.filter(animal => animal.status === 'available').map(animal => <option key={animal.id} value={animal.id}>{animal.name}</option>)}</select></div>
        <div className="space-y-1"><Label htmlFor="foster-applicant">Hogar aprobado</Label><select id="foster-applicant" name="foster_application_id" required className="h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-sm"><option value="">Selecciona</option>{applications.data?.filter(application => application.status === 'approved').map(application => <option key={application.id} value={application.id}>{application.applicant_name} · {application.city}</option>)}</select></div>
        <div className="space-y-1"><Label htmlFor="foster-start">Inicio previsto</Label><Input id="foster-start" name="starts_on" type="date" /></div>
        <div className="space-y-1"><Label htmlFor="foster-review">Fecha de revisión</Label><Input id="foster-review" name="expected_review_on" type="date" /></div>
        <div className="space-y-1"><Label htmlFor="foster-follow-up">Primer seguimiento</Label><Input id="foster-follow-up" name="follow_up_due_on" type="date" /></div>
        <p className="self-center text-xs text-[var(--color-muted-foreground)]">La planificación no cambia el estado del animal hasta confirmar que ingresó al hogar.</p>
        <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="outline" onClick={() => setShowPlacementForm(false)}>Cancelar</Button><Button type="submit" variant="warm" disabled={createPlacement.isPending}>Guardar planificación</Button></div>
      </form>}

      <section className="space-y-4"><h2 className="font-heading text-xl font-bold">Postulaciones ({applications.data?.length ?? 0})</h2>
        {applications.isLoading && <p role="status">Cargando postulaciones…</p>}{applications.error && <div role="alert" className="rounded-xl border border-rose-200 p-4 text-sm">No se pudieron cargar. <Button size="sm" variant="outline" onClick={() => applications.refetch()}>Reintentar</Button></div>}
        {!applications.isLoading && !applications.error && !applications.data?.length && <p className="rounded-2xl border border-dashed p-7 text-center text-sm text-[var(--color-muted-foreground)]">Aún no hay hogares postulados.</p>}
        <div className="grid gap-4 lg:grid-cols-2">{applications.data?.map(application => <form key={application.id} onSubmit={event => { event.preventDefault(); saveApplication.mutate({ id: application.id, form: new FormData(event.currentTarget) }); }} className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-heading text-lg font-bold">{application.applicant_name}</p><p className="text-xs text-[var(--color-muted-foreground)]">{application.city}{application.area ? ` · ${application.area}` : ''} · {application.housing_type}{application.has_resident_pets ? ' · otros animales' : ''}</p></div><a href={`https://wa.me/${application.applicant_phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-sm font-semibold text-emerald-700 underline">WhatsApp</a></div>
          <p className="text-xs">{application.applicant_email} · {application.applicant_phone}</p><p className="rounded-xl bg-[var(--color-background)] p-3 text-sm leading-relaxed">{application.experience}</p><p className="text-xs"><strong>Disponibilidad:</strong> {application.availability}{application.animal_preferences ? ` · ${application.animal_preferences}` : ''}</p>
          <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1"><Label htmlFor={`foster-status-${application.id}`}>Estado</Label><select id={`foster-status-${application.id}`} name="status" defaultValue={application.status} className="h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-sm">{APPLICATION_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div className="space-y-1"><Label htmlFor={`foster-notes-${application.id}`}>Notas internas</Label><Input id={`foster-notes-${application.id}`} name="admin_notes" maxLength={2000} defaultValue={application.admin_notes ?? ''} /></div></div>
          <Button type="submit" size="sm" disabled={saveApplication.isPending}><Save className="mr-2 h-4 w-4" />Guardar evaluación</Button>
        </form>)}</div>
      </section>

      <section className="space-y-4"><h2 className="flex items-center gap-2 font-heading text-xl font-bold"><CalendarClock className="h-5 w-5 text-[#f0644a]" />Acogidas y seguimiento ({placements.data?.length ?? 0})</h2>
        {placements.isLoading && <p role="status">Cargando acogidas…</p>}{placements.error && <div role="alert" className="rounded-xl border border-rose-200 p-4 text-sm">No se pudieron cargar las acogidas. <Button size="sm" variant="outline" onClick={() => placements.refetch()}>Reintentar</Button></div>}
        {!placements.isLoading && !placements.error && placements.data?.length === 0 && <p className="rounded-2xl border border-dashed p-7 text-center text-sm text-[var(--color-muted-foreground)]">Aún no hay acogidas planificadas.</p>}
        <div className="grid gap-4 lg:grid-cols-2">{placements.data?.map(placement => <form key={placement.id} onSubmit={event => { event.preventDefault(); updatePlacement.mutate({ placement, form: new FormData(event.currentTarget) }); }} className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <div><h3 className="font-heading text-lg font-bold">{placement.animals?.name ?? 'Animal'} · {placement.foster_applications?.applicant_name ?? 'Hogar temporal'}</h3><p className="text-xs text-[var(--color-muted-foreground)]">Inicio previsto: {placement.starts_on || 'Por coordinar'} · Revisión: {placement.expected_review_on || 'Sin fecha'}</p></div>
          <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1"><Label htmlFor={`placement-status-${placement.id}`}>Estado</Label><select id={`placement-status-${placement.id}`} name="status" defaultValue={placement.status} className="h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-sm">{PLACEMENT_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div className="space-y-1"><Label htmlFor={`placement-follow-${placement.id}`}>Próximo chequeo</Label><Input id={`placement-follow-${placement.id}`} name="follow_up_due_on" type="date" defaultValue={placement.follow_up_due_on ?? ''} /></div></div>
          <div className="space-y-1"><Label htmlFor={`placement-private-${placement.id}`}>Notas privadas del seguimiento</Label><Textarea id={`placement-private-${placement.id}`} name="private_follow_up_notes" maxLength={3000} rows={2} defaultValue={placement.private_follow_up_notes ?? ''} /></div>
          <div className="space-y-1"><Label htmlFor={`placement-outcome-${placement.id}`}>Resultado (si finalizó)</Label><Textarea id={`placement-outcome-${placement.id}`} name="outcome_notes" maxLength={3000} rows={2} defaultValue={placement.outcome_notes ?? ''} /></div>
          <Button type="submit" size="sm" disabled={updatePlacement.isPending}><Save className="mr-2 h-4 w-4" />Guardar seguimiento</Button>
        </form>)}</div>
      </section>
    </div>
  );
}
