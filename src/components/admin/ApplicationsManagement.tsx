import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, FileText, Loader2, Mail, MapPin, Phone, Search, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import type { AdoptionApplication, ApplicationStatus, VolunteerApplication } from '@/types';
import { formatDateShort } from '@/lib/utils';

type ApplicationTab = 'adoptions' | 'volunteers';
type AdoptionFilter = 'all' | ApplicationStatus;
type VolunteerFilter = 'all' | VolunteerApplication['status'];

const adoptionStatuses: Array<{ value: AdoptionFilter; label: string }> = [
  { value: 'all', label: 'Todas' }, { value: 'pending', label: 'Pendientes' },
  { value: 'under_review', label: 'En revisión' }, { value: 'approved', label: 'Aprobadas' },
  { value: 'rejected', label: 'Rechazadas' },
];
const volunteerStatuses: Array<{ value: VolunteerFilter; label: string }> = [
  { value: 'all', label: 'Todos' }, { value: 'pending', label: 'Pendientes' },
  { value: 'contacted', label: 'Contactados' }, { value: 'active', label: 'Activos' },
  { value: 'archived', label: 'Archivados' },
];
const adoptionStatusLabel: Record<ApplicationStatus, string> = {
  pending: 'Pendiente', under_review: 'En revisión', approved: 'Aprobada', rejected: 'Rechazada',
};
const volunteerStatusLabel: Record<VolunteerApplication['status'], string> = {
  pending: 'Pendiente', contacted: 'Contactado', active: 'Activo', archived: 'Archivado',
};

function getBadgeVariant(status: ApplicationStatus | VolunteerApplication['status']) {
  if (status === 'approved' || status === 'active') return 'success' as const;
  if (status === 'rejected' || status === 'archived') return 'secondary' as const;
  return 'warning' as const;
}

function confirmStatusChange(subject: string, status: string) {
  return window.confirm(`¿Confirmas cambiar el estado de ${subject} a “${status}”?`);
}

export function ApplicationsManagement() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ApplicationTab>('adoptions');
  const [adoptionFilter, setAdoptionFilter] = useState<AdoptionFilter>('all');
  const [volunteerFilter, setVolunteerFilter] = useState<VolunteerFilter>('all');
  const [search, setSearch] = useState('');

  const adoptionsQuery = useQuery({
    queryKey: ['admin-adoptions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('adoption_applications').select('*, animal:animals(name)').order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as AdoptionApplication[];
    },
  });
  const volunteersQuery = useQuery({
    queryKey: ['admin-volunteers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('volunteer_applications').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as VolunteerApplication[];
    },
  });

  const adoptions = adoptionsQuery.data ?? [];
  const volunteers = volunteersQuery.data ?? [];
  const normalizedSearch = search.trim().toLowerCase();
  const filteredAdoptions = useMemo(() => adoptions.filter((app) => {
    const matchesStatus = adoptionFilter === 'all' || app.status === adoptionFilter;
    const matchesSearch = !normalizedSearch || [app.applicant_name ?? '', app.applicant_email ?? '', app.applicant_phone ?? '', app.animal?.name ?? ''].some((value) => value.toLowerCase().includes(normalizedSearch));
    return matchesStatus && matchesSearch;
  }), [adoptions, adoptionFilter, normalizedSearch]);
  const filteredVolunteers = useMemo(() => volunteers.filter((vol) => {
    const matchesStatus = volunteerFilter === 'all' || vol.status === volunteerFilter;
    const matchesSearch = !normalizedSearch || [vol.full_name ?? '', vol.email ?? '', vol.phone ?? '', vol.area_of_interest ?? ''].some((value) => value.toLowerCase().includes(normalizedSearch));
    return matchesStatus && matchesSearch;
  }), [volunteers, volunteerFilter, normalizedSearch]);

  const updateAdoption = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApplicationStatus }) => {
      const { data, error } = await supabase.from('adoption_applications').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select('id').single();
      if (error) throw error;
      if (!data) throw new Error('Supabase no confirmó la actualización.');
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-adoptions'] }); toast.success('Estado de adopción actualizado.'); },
    onError: (error: Error) => toast.error(`No se actualizó la solicitud: ${error.message}`),
  });
  const updateVolunteer = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: VolunteerApplication['status'] }) => {
      const { data, error } = await supabase.from('volunteer_applications').update({ status }).eq('id', id).select('id').single();
      if (error) throw error;
      if (!data) throw new Error('Supabase no confirmó la actualización.');
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-volunteers'] }); toast.success('Estado de voluntariado actualizado.'); },
    onError: (error: Error) => toast.error(`No se actualizó el voluntariado: ${error.message}`),
  });

  const isUpdating = updateAdoption.isPending || updateVolunteer.isPending;
  const retry = () => { void adoptionsQuery.refetch(); void volunteersQuery.refetch(); };
  const changeAdoptionStatus = (app: AdoptionApplication, status: ApplicationStatus) => {
    if (app.status === status || !confirmStatusChange(`la solicitud de ${app.applicant_name ?? 'el solicitante'}`, (adoptionStatusLabel[status] ?? status).toLowerCase())) return;
    updateAdoption.mutate({ id: app.id, status });
  };
  const changeVolunteerStatus = (vol: VolunteerApplication, status: VolunteerApplication['status']) => {
    if (vol.status === status || !confirmStatusChange(`la solicitud de ${vol.full_name ?? 'el postulante'}`, (volunteerStatusLabel[status] ?? status).toLowerCase())) return;
    updateVolunteer.mutate({ id: vol.id, status });
  };

  return <div className="space-y-6">
    {(adoptionsQuery.error || volunteersQuery.error) && <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div className="flex-1"><p className="font-semibold">No se pudieron cargar todas las solicitudes.</p><p className="mt-1">La lista puede estar incompleta. Comprueba la conexión antes de tomar decisiones.</p></div><Button size="sm" variant="outline" onClick={retry}>Reintentar</Button></div>}
    {(adoptionsQuery.isLoading || volunteersQuery.isLoading) && <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]" role="status"><Loader2 className="h-4 w-4 animate-spin" /> Cargando solicitudes…</div>}
    <div><h1 className="flex items-center gap-2 font-heading text-2xl font-bold"><FileText className="h-6 w-6 text-[var(--color-primary)]" /> Solicitudes recibidas</h1><p className="mt-1 text-sm text-[var(--color-muted-foreground)]">Revisa, filtra y actualiza adopciones y voluntariado.</p></div>
    <div className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex gap-2" role="tablist" aria-label="Tipo de solicitud">
        <button type="button" role="tab" aria-selected={tab === 'adoptions'} onClick={() => { setTab('adoptions'); setSearch(''); }} className={`rounded-lg px-3 py-2 text-sm font-semibold ${tab === 'adoptions' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'}`}>🐶 Adopciones <span className="ml-1 opacity-80">{adoptions.length}</span></button>
        <button type="button" role="tab" aria-selected={tab === 'volunteers'} onClick={() => { setTab('volunteers'); setSearch(''); }} className={`rounded-lg px-3 py-2 text-sm font-semibold ${tab === 'volunteers' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'}`}>🤝 Voluntariado <span className="ml-1 opacity-80">{volunteers.length}</span></button>
      </div>
      <label className="relative block w-full sm:max-w-xs"><span className="sr-only">Buscar solicitudes</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, correo o teléfono" className="h-10 w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]" /></label>
    </div>
    <div className="flex flex-wrap items-center gap-2" aria-label="Filtrar solicitudes por estado"><span className="text-xs font-semibold text-[var(--color-muted-foreground)]">Estado:</span>{(tab === 'adoptions' ? adoptionStatuses : volunteerStatuses).map((filter) => { const selected = tab === 'adoptions' ? adoptionFilter === filter.value : volunteerFilter === filter.value; return <button key={filter.value} type="button" aria-pressed={selected} onClick={() => tab === 'adoptions' ? setAdoptionFilter(filter.value as AdoptionFilter) : setVolunteerFilter(filter.value as VolunteerFilter)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${selected ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]'}`}>{filter.label}</button>; })}</div>
    <Card><CardContent className="pt-4">
      {tab === 'adoptions' ? <AdoptionList applications={filteredAdoptions} total={adoptions.length} isUpdating={isUpdating} onStatusChange={changeAdoptionStatus} /> : <VolunteerList applications={filteredVolunteers} total={volunteers.length} isUpdating={isUpdating} onStatusChange={changeVolunteerStatus} />}
    </CardContent></Card>
  </div>;
}

function AdoptionList({ applications, total, isUpdating, onStatusChange }: { applications: AdoptionApplication[]; total: number; isUpdating: boolean; onStatusChange: (app: AdoptionApplication, status: ApplicationStatus) => void }) {
  if (applications.length === 0) return <EmptyState message={total === 0 ? 'Todavía no hay solicitudes de adopción.' : 'No hay adopciones que coincidan con los filtros.'} />;
  return <div className="space-y-4 divide-y divide-[var(--color-border)]">{applications.map((app) => {
    const rawPhone = app.applicant_phone ?? '';
    const cleanPhone = String(rawPhone).replace(/\D/g, '');
    const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hola ${app.applicant_name ?? 'amigo'}, nos comunicamos de AdoptaME sobre tu solicitud de adopción.`)}` : null;
    return <div key={app.id} className="space-y-3 pt-4 first:pt-0"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-heading text-lg font-bold">{app.applicant_name ?? 'Solicitante'}</h3><p className="text-xs font-semibold text-[var(--color-primary)]">Interesado en: {app.animal?.name ?? 'Perro rescatado'}</p></div><Badge variant={getBadgeVariant(app.status)}>{adoptionStatusLabel[app.status] ?? app.status}</Badge></div><div className="grid grid-cols-1 gap-2 rounded-xl bg-[var(--color-background)] p-3 text-xs text-[var(--color-muted-foreground)] sm:grid-cols-3"><span className="flex items-center gap-1.5 break-all"><Mail className="h-3.5 w-3.5 shrink-0" />{app.applicant_email ?? 'Sin correo'}</span>{whatsappUrl ? <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-semibold text-emerald-600 hover:underline"><Phone className="h-3.5 w-3.5 shrink-0" />{rawPhone || 'WhatsApp'} · WhatsApp</a> : <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 shrink-0" />{rawPhone || 'Sin teléfono'}</span>}<span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0" />{app.applicant_address ?? 'Sin dirección'}</span></div><p className="border-l-2 border-[var(--color-primary)] pl-3 text-xs italic leading-relaxed">“{app.reason ?? 'Sin motivo especificado'}”</p><div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs text-[var(--color-muted-foreground)]">Recibida: {formatDateShort(app.created_at)}</span><div className="flex flex-wrap gap-2">{app.status !== 'approved' && <Button size="sm" variant="outline" className="text-emerald-600" disabled={isUpdating} onClick={() => onStatusChange(app, 'approved')}><CheckCircle2 className="mr-1 h-4 w-4" /> Aprobar</Button>}{app.status !== 'rejected' && <Button size="sm" variant="ghost" className="text-rose-600" disabled={isUpdating} onClick={() => onStatusChange(app, 'rejected')}><XCircle className="mr-1 h-4 w-4" /> Rechazar</Button>}{app.status === 'pending' && <Button size="sm" variant="secondary" disabled={isUpdating} onClick={() => onStatusChange(app, 'under_review')}>Pasar a revisión</Button>}</div></div></div>; })}</div>;
}

function VolunteerList({ applications, total, isUpdating, onStatusChange }: { applications: VolunteerApplication[]; total: number; isUpdating: boolean; onStatusChange: (vol: VolunteerApplication, status: VolunteerApplication['status']) => void }) {
  if (applications.length === 0) return <EmptyState message={total === 0 ? 'Todavía no hay solicitudes de voluntariado.' : 'No hay voluntariados que coincidan con los filtros.'} />;
  return <div className="space-y-4 divide-y divide-[var(--color-border)]">{applications.map((vol) => <div key={vol.id} className="space-y-3 pt-4 first:pt-0"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-heading text-base font-bold">{vol.full_name ?? 'Postulante'}</h3><p className="text-xs text-[var(--color-muted-foreground)]">{vol.area_of_interest ?? 'Voluntariado'} · {vol.availability ?? 'Flexible'}</p></div><Badge variant={getBadgeVariant(vol.status)}>{volunteerStatusLabel[vol.status] ?? vol.status}</Badge></div><div className="grid grid-cols-1 gap-2 rounded-xl bg-[var(--color-background)] p-3 text-xs text-[var(--color-muted-foreground)] sm:grid-cols-3"><span className="break-all">✉️ {vol.email ?? 'Sin correo'}</span><span>📞 {vol.phone ?? 'Sin teléfono'}</span><span>🗓️ {vol.availability ?? 'Flexible'}</span></div>{vol.experience && <p className="text-xs leading-relaxed">Experiencia: {vol.experience}</p>}<div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs text-[var(--color-muted-foreground)]">Recibida: {formatDateShort(vol.created_at)}</span><select aria-label={`Estado de ${vol.full_name ?? 'postulante'}`} value={vol.status} disabled={isUpdating} onChange={(event) => onStatusChange(vol, event.target.value as VolunteerApplication['status'])} className="h-9 rounded-lg border border-[var(--color-input)] bg-transparent px-2 text-xs sm:w-auto"><option value="pending">Pendiente</option><option value="contacted">Contactado</option><option value="active">Activo</option><option value="archived">Archivado</option></select></div></div>)}</div>;
}

function EmptyState({ message }: { message: string }) { return <p className="py-10 text-center text-sm text-[var(--color-muted-foreground)]">{message}</p>; }
