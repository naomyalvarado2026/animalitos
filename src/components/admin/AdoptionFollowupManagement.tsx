import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Check, CircleAlert, ClipboardList, Mail, MessageCircle, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type ApplicationSource = {
  kind: 'application'; id: string; person: string; email: string; phone: string;
  animalName: string; animalStatus: string; adoptionDate: string | null;
};
type MessageSource = {
  kind: 'message'; id: string; person: string; email: string; phone: string;
  animalName: string; animalStatus: string; adoptionDate: string | null;
};
type FollowupSource = ApplicationSource | MessageSource;
type Followup = {
  id: string; application_id: string | null; contact_message_id: string | null;
  adopted_on: string; stage_days: number; due_on: string; status: 'pending' | 'completed' | 'skipped'; completed_at: string | null;
};
type FollowupEvent = { id: string; followup_id: string; event_type: string; summary: string; occurred_at: string; referred_resource_id: string | null };

function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function dueAfter(adoptedOn: string, days: number) {
  const result = new Date(`${adoptedOn}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

const eventLabels: Record<string, string> = { call: 'Llamada', whatsapp: 'WhatsApp', email: 'Correo', visit: 'Visita', note: 'Nota', referral: 'Derivación' };

export function AdoptionFollowupManagement() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [showHistory, setShowHistory] = useState(false);
  const [eventTypes, setEventTypes] = useState<Record<string, string>>({});
  const today = localToday();

  const resources = useQuery({
    queryKey: ['adoption-followup-verified-resources'],
    queryFn: async () => {
      const { data, error } = await supabase.from('community_resources')
        .select('id, name, city, verified_at, verified_by, is_published').order('city').order('name');
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; name: string; city: string; verified_at: string | null; verified_by: string | null; is_published: boolean }>;
    },
  });
  const verifiedResources = (resources.data ?? []).filter(resource => resource.is_published && resource.verified_at && resource.verified_by);
  const resourcesById = new Map((resources.data ?? []).map(resource => [resource.id, resource]));

  const applications = useQuery({
    queryKey: ['adoption-followup-sources-applications'],
    queryFn: async () => {
      const { data, error } = await supabase.from('adoption_applications')
        .select('id, applicant_name, applicant_email, applicant_phone, status, animal:animals(name, status, adoption_date)')
        .eq('status', 'approved').eq('post_adoption_follow_up_consent', true).order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Array<{ id: string; applicant_name: string; applicant_email: string; applicant_phone: string; animal: { name: string; status: string; adoption_date: string | null } | null }>;
    },
  });
  const localAdoptions = useQuery({
    queryKey: ['adoption-followup-sources-messages'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contact_messages')
        .select('id, name, email, subject, animal_slug')
        .eq('type', 'support').eq('source', 'adoption_modal').eq('post_adoption_follow_up_consent', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; name: string; email: string; subject: string; animal_slug: string | null }>;
    },
  });
  const sources = useMemo<FollowupSource[]>(() => [
    ...(applications.data ?? []).flatMap(row => row.animal ? [{
      kind: 'application' as const, id: row.id, person: row.applicant_name, email: row.applicant_email,
      phone: row.applicant_phone, animalName: row.animal.name, animalStatus: row.animal.status,
      adoptionDate: row.animal.adoption_date,
    }] : []),
    ...(localAdoptions.data ?? []).map(row => ({
      kind: 'message' as const, id: row.id, person: row.name, email: row.email, phone: '',
      animalName: row.animal_slug || row.subject.replace(/^\[Adopción [^\]]+\] Quiero conocer a /, ''),
      animalStatus: 'por confirmar', adoptionDate: null,
    })),
  ], [applications.data, localAdoptions.data]);

  const followups = useQuery({
    queryKey: ['adoption-followups'],
    queryFn: async () => {
      const { data, error } = await supabase.from('adoption_followups').select('*').order('due_on', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Followup[];
    },
  });
  const followupIds = (followups.data ?? []).map(item => item.id);
  const events = useQuery({
    queryKey: ['adoption-followup-events', followupIds],
    enabled: followupIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from('adoption_followup_events').select('*').in('followup_id', followupIds).order('occurred_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as FollowupEvent[];
    },
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['adoption-followups'] });
    void qc.invalidateQueries({ queryKey: ['adoption-followup-events'] });
  };

  const schedule = useMutation({
    mutationFn: async ({ source, form }: { source: FollowupSource; form: FormData }) => {
      if (!profile?.id) throw new Error('No se pudo identificar al usuario del equipo.');
      const adoptedOn = String(form.get('adopted_on') ?? '');
      if (form.get('confirm_adoption') !== 'on') throw new Error('Confirma que la adopción ya se concretó antes de programar contactos.');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(adoptedOn) || adoptedOn > today) throw new Error('Selecciona una fecha válida, igual o anterior a hoy.');

      const sourceColumn = source.kind === 'application' ? 'application_id' : 'contact_message_id';
      const { data: existing, error: existingError } = await supabase.from('adoption_followups').select('stage_days').eq(sourceColumn, source.id);
      if (existingError) throw existingError;
      const existingDays = new Set((existing ?? []).map(row => row.stage_days as number));
      const stages = form.get('include_day_90') === 'on' ? [2, 10, 45, 90] : [2, 10, 45];
      const rows = stages.filter(days => !existingDays.has(days)).map(days => ({
        application_id: source.kind === 'application' ? source.id : null,
        contact_message_id: source.kind === 'message' ? source.id : null,
        adopted_on: adoptedOn,
        stage_days: days,
        due_on: dueAfter(adoptedOn, days),
        created_by: profile.id,
      }));
      if (rows.length) {
        const { error } = await supabase.from('adoption_followups').insert(rows);
        if (error) throw error;
      }
      return rows.length;
    },
    onSuccess: count => { invalidate(); toast.success(count ? `Programados ${count} contactos de seguimiento.` : 'Este plan ya tenía esos contactos programados.'); },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ followup, status }: { followup: Followup; status: Followup['status'] }) => {
      const { error } = await supabase.from('adoption_followups').update({
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }).eq('id', followup.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: () => toast.error('No se pudo actualizar el contacto.'),
  });

  const addEvent = useMutation({
    mutationFn: async ({ followupId, form }: { followupId: string; form: FormData }) => {
      if (!profile?.id) throw new Error('No se pudo identificar al usuario del equipo.');
      const summary = String(form.get('summary') ?? '').trim();
      const eventType = String(form.get('event_type') ?? 'note');
      const referralId = String(form.get('referred_resource_id') ?? '') || null;
      if (summary.length < 2) throw new Error('Escribe una nota breve sobre el intento o acuerdo.');
      if (eventType === 'referral' && !verifiedResources.some(resource => resource.id === referralId)) {
        throw new Error('Elige un recurso publicado y verificado para registrar la derivación.');
      }
      const { error } = await supabase.from('adoption_followup_events').insert({
        followup_id: followupId,
        event_type: eventType,
        referred_resource_id: eventType === 'referral' ? referralId : null,
        summary,
        created_by: profile.id,
      });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => { setEventTypes(current => ({ ...current, [variables.followupId]: 'call' })); invalidate(); toast.success('Contacto registrado en el historial.'); },
    onError: (error: Error) => toast.error(error.message),
  });

  const sourceById = new Map(sources.map(source => [source.id, source]));
  const tasks = (followups.data ?? []).filter(item => showHistory ? item.status !== 'pending' : item.status === 'pending');
  const pendingCount = (followups.data ?? []).filter(item => item.status === 'pending').length;
  const overdueCount = (followups.data ?? []).filter(item => item.status === 'pending' && item.due_on < today).length;
  const completedCount = (followups.data ?? []).filter(item => item.status === 'completed').length;

  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--color-primary)]">Cuidado después de la adopción</p><h1 className="mt-2 font-heading text-3xl font-bold">Seguimiento a familias</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">Programa y registra contactos breves con autorización explícita. El calendario sugiere días 2, 10 y 45; el día 90 es opcional. El equipo decide si contacta y registra intentos reales.</p></div><Button variant="outline" onClick={() => { void applications.refetch(); void localAdoptions.refetch(); void followups.refetch(); }}><RefreshCw className="mr-2 h-4 w-4" />Actualizar</Button></header>

    <section className="grid gap-3 sm:grid-cols-3" aria-label="Resumen de seguimiento">
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4"><p className="text-sm text-[var(--color-muted-foreground)]">Contactos pendientes</p><p className="mt-1 text-2xl font-bold">{pendingCount}</p></div>
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950"><p className="text-sm">Atrasados por revisar</p><p className="mt-1 text-2xl font-bold">{overdueCount}</p></div>
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950"><p className="text-sm">Contactos completados</p><p className="mt-1 text-2xl font-bold">{completedCount}</p></div>
    </section>

    <section className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 sm:p-5" aria-labelledby="schedule-heading">
      <div><h2 id="schedule-heading" className="flex items-center gap-2 font-heading text-xl font-bold"><CalendarClock className="h-5 w-5 text-[var(--color-primary)]" />Programar un plan</h2><p className="mt-1 text-sm text-[var(--color-muted-foreground)]">Solo aparecen personas que aceptaron este seguimiento. Confirma la fecha real en que el animal llegó a su nuevo hogar.</p></div>
      {(applications.isLoading || localAdoptions.isLoading) && <p role="status" className="text-sm">Cargando autorizaciones…</p>}
      {(applications.error || localAdoptions.error) && <div role="alert" className="rounded-xl border border-rose-300 p-3 text-sm">No pudimos cargar algunas solicitudes autorizadas. <Button size="sm" variant="outline" onClick={() => { void applications.refetch(); void localAdoptions.refetch(); }}>Reintentar</Button></div>}
      {!applications.isLoading && !localAdoptions.isLoading && sources.length === 0 && <p className="rounded-xl border border-dashed p-5 text-sm text-[var(--color-muted-foreground)]">Todavía no hay solicitudes aprobadas con consentimiento de seguimiento.</p>}
      <div className="grid gap-3 xl:grid-cols-2">{sources.map(source => <form key={`${source.kind}-${source.id}`} onSubmit={event => { event.preventDefault(); schedule.mutate({ source, form: new FormData(event.currentTarget) }); }} className="grid gap-3 rounded-xl border border-[var(--color-border)] p-4 sm:grid-cols-[1fr_auto]">
        <div className="min-w-0"><p className="truncate font-semibold">{source.person} · {source.animalName}</p><p className="mt-1 truncate text-xs text-[var(--color-muted-foreground)]">{source.email} · {source.kind === 'application' ? `Estado del animal: ${source.animalStatus}` : 'Adopción por confirmar por el equipo'}</p><div className="mt-3 flex flex-wrap items-end gap-3"><div className="space-y-1"><Label htmlFor={`adopted-${source.kind}-${source.id}`}>Fecha de llegada al hogar</Label><input id={`adopted-${source.kind}-${source.id}`} name="adopted_on" type="date" max={today} defaultValue={source.adoptionDate && source.adoptionDate <= today ? source.adoptionDate : ''} required className="h-10 rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-sm" /></div><label className="flex items-start gap-2 pb-2 text-xs"><input type="checkbox" name="include_day_90" className="mt-0.5 accent-[var(--color-primary)]" /><span>Añadir día 90</span></label></div><label className="mt-3 flex items-start gap-2 text-xs text-[var(--color-muted-foreground)]"><input type="checkbox" name="confirm_adoption" required className="mt-0.5 accent-[var(--color-primary)]" /><span>Confirmo que la adopción se concretó y usaré esta fecha para el calendario.</span></label></div>
        <Button type="submit" size="sm" variant="warm" disabled={schedule.isPending} className="self-end"><Plus className="mr-1 h-4 w-4" />Programar</Button>
      </form>)}</div>
    </section>

    <section className="space-y-4" aria-labelledby="tasks-heading">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 id="tasks-heading" className="flex items-center gap-2 font-heading text-xl font-bold"><ClipboardList className="h-5 w-5 text-[var(--color-primary)]" />Agenda de contactos</h2><p className="mt-1 text-sm text-[var(--color-muted-foreground)]">Guarda el resultado y una próxima acción si hace falta. No se envían mensajes automáticamente.</p></div><div className="flex gap-2"><Button size="sm" variant={!showHistory ? 'warm' : 'outline'} onClick={() => setShowHistory(false)}>Pendientes</Button><Button size="sm" variant={showHistory ? 'warm' : 'outline'} onClick={() => setShowHistory(true)}>Historial</Button></div></div>
      {followups.isLoading && <p role="status">Cargando agenda…</p>}
      {followups.error && <div role="alert" className="rounded-xl border border-rose-300 p-4 text-sm">No se pudo cargar la agenda. <Button size="sm" variant="outline" onClick={() => void followups.refetch()}>Reintentar</Button></div>}
      {!followups.isLoading && !followups.error && tasks.length === 0 && <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-[var(--color-muted-foreground)]">{showHistory ? 'Todavía no hay contactos completados o descartados.' : 'No hay contactos pendientes por ahora.'}</div>}
      <div className="grid gap-4 xl:grid-cols-2">{tasks.map(followup => {
        const sourceId = followup.application_id || followup.contact_message_id || '';
        const source = sourceById.get(sourceId);
        const taskEvents = (events.data ?? []).filter(item => item.followup_id === followup.id);
        const overdue = followup.status === 'pending' && followup.due_on < today;
        return <article key={followup.id} className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${overdue ? 'bg-rose-100 text-rose-800' : followup.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-[var(--color-secondary)] text-[var(--color-foreground)]'}`}>{overdue && <CircleAlert className="h-3.5 w-3.5" />}{followup.status === 'completed' ? 'Completado' : followup.status === 'skipped' ? 'Omitido' : overdue ? 'Vencido' : 'Pendiente'} · Día {followup.stage_days}</p><h3 className="mt-2 truncate font-heading text-lg font-bold">{source ? `${source.person} · ${source.animalName}` : 'Seguimiento autorizado'}</h3><p className="mt-1 text-sm text-[var(--color-muted-foreground)]">Adopción: {followup.adopted_on} · Contacto sugerido: {followup.due_on}</p></div>{source && <div className="flex gap-2">{source.phone && <a aria-label={`Abrir WhatsApp de ${source.person}`} className="rounded-lg border border-[var(--color-border)] p-2 text-emerald-700" href={`https://wa.me/${source.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /></a>}<a aria-label={`Enviar correo a ${source.person}`} className="rounded-lg border border-[var(--color-border)] p-2 text-[var(--color-primary)]" href={`mailto:${encodeURIComponent(source.email)}`}><Mail className="h-4 w-4" /></a></div>}</div>
          {followup.status === 'pending' && <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate({ followup, status: 'completed' })}><Check className="mr-1 h-4 w-4" />Marcar completado</Button><Button size="sm" variant="ghost" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate({ followup, status: 'skipped' })}>Omitir etapa</Button></div>}
          {followup.status === 'pending' && <form onSubmit={event => { event.preventDefault(); const form = event.currentTarget; addEvent.mutate({ followupId: followup.id, form: new FormData(form) }, { onSuccess: () => form.reset() }); }} className="grid gap-2 border-t border-[var(--color-border)] pt-3 sm:grid-cols-[auto_1fr_auto] sm:items-end"><div className="space-y-1"><Label htmlFor={`event-type-${followup.id}`}>Canal / registro</Label><select id={`event-type-${followup.id}`} name="event_type" value={eventTypes[followup.id] ?? 'call'} onChange={event => setEventTypes(current => ({ ...current, [followup.id]: event.target.value }))} className="h-10 rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] px-2 text-sm">{Object.entries(eventLabels).map(([value, label]) => <option key={value} value={value} disabled={value === 'referral' && verifiedResources.length === 0}>{label}</option>)}</select></div>{eventTypes[followup.id] === 'referral' && <div className="space-y-1"><Label htmlFor={`event-resource-${followup.id}`}>Recurso verificado</Label><select id={`event-resource-${followup.id}`} name="referred_resource_id" required className="h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] px-2 text-sm"><option value="">Selecciona un recurso</option>{verifiedResources.map(resource => <option key={resource.id} value={resource.id}>{resource.name} · {resource.city}</option>)}</select></div>}<div className="space-y-1"><Label htmlFor={`event-summary-${followup.id}`}>Resultado o preocupación</Label><Textarea id={`event-summary-${followup.id}`} name="summary" minLength={2} maxLength={1500} required rows={2} placeholder="Registra el intento real, respuesta o derivación acordada." /></div><Button type="submit" size="sm" variant="outline" disabled={addEvent.isPending}>Guardar nota</Button></form>}
          <div className="border-t border-[var(--color-border)] pt-3"><p className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted-foreground)]">Historial</p>{taskEvents.length === 0 ? <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">Aún no hay intentos registrados.</p> : <ul className="mt-2 space-y-2">{taskEvents.slice(0, 3).map(item => { const referred = item.referred_resource_id ? resourcesById.get(item.referred_resource_id) : null; return <li key={item.id} className="text-sm"><span className="font-semibold">{eventLabels[item.event_type] ?? item.event_type}</span><span className="text-xs text-[var(--color-muted-foreground)]"> · {new Date(item.occurred_at).toLocaleString('es-EC')}</span><p className="mt-0.5 text-[var(--color-muted-foreground)]">{item.summary}</p>{item.referred_resource_id && <p className="mt-1 text-xs">Recurso: {referred ? `${referred.name} · ${referred.city}${referred.is_published && referred.verified_at && referred.verified_by ? '' : ' (ya no está verificado/publicado)'}` : 'Recurso no disponible en el directorio actual'}</p>}</li>; })}</ul>}</div>
        </article>;
      })}</div>
    </section>
  </div>;
}
