import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CalendarClock, CheckCircle2, FileText, HeartHandshake, Loader2, Mail, MapPin, MessageSquare, Phone, Search, UserRound, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import type {
  AdoptionApplication,
  ApplicationStatus,
  ContactMessage,
  SponsorshipInquiry,
  SponsorshipInquiryStatus,
  VolunteerApplication,
} from '@/types';
import { formatDateShort } from '@/lib/utils';

type ApplicationTab = 'adoptions' | 'volunteers' | 'sponsorships' | 'messages';
type AdoptionFilter = 'all' | ApplicationStatus;
type FollowUpFilter = 'all' | 'overdue';
type VolunteerFilter = 'all' | VolunteerApplication['status'];
type SponsorshipFilter = 'all' | SponsorshipInquiryStatus;
type MessageFilter = 'all' | 'unread' | 'read' | ContactMessage['type'];

const adoptionStatuses: Array<{ value: AdoptionFilter; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'under_review', label: 'En revisión' },
  { value: 'approved', label: 'Aprobadas' },
  { value: 'rejected', label: 'Rechazadas' },
];

const volunteerStatuses: Array<{ value: VolunteerFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'contacted', label: 'Contactados' },
  { value: 'active', label: 'Activos' },
  { value: 'archived', label: 'Archivados' },
];

const sponsorshipStatuses: Array<{ value: SponsorshipFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'contacted', label: 'Contactados' },
  { value: 'active', label: 'Activos' },
  { value: 'closed', label: 'Cerrados' },
];

const messageFilters: Array<{ value: MessageFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'unread', label: 'Sin leer' },
  { value: 'read', label: 'Leídos' },
  { value: 'support', label: 'Adopción / Apoyo' },
  { value: 'donation', label: 'Donaciones' },
  { value: 'general', label: 'General' },
];

const adoptionStatusLabel: Record<ApplicationStatus, string> = {
  pending: 'Pendiente',
  under_review: 'En revisión',
  approved: 'Aprobada',
  rejected: 'Rechazada',
};

const volunteerStatusLabel: Record<VolunteerApplication['status'], string> = {
  pending: 'Pendiente',
  contacted: 'Contactado',
  active: 'Activo',
  archived: 'Archivado',
};

const sponsorshipStatusLabel: Record<SponsorshipInquiryStatus, string> = {
  pending: 'Pendiente',
  contacted: 'Contactado',
  active: 'Apadrinando',
  closed: 'Cerrado',
};

const messageTypeLabel: Record<ContactMessage['type'], string> = {
  general: 'Consulta general',
  support: 'Adopción / Apoyo',
  donation: 'Donación',
  volunteer: 'Voluntariado',
};

function getBadgeVariant(status: ApplicationStatus | VolunteerApplication['status'] | SponsorshipInquiryStatus) {
  if (status === 'approved' || status === 'active') return 'success' as const;
  if (status === 'rejected' || status === 'archived' || status === 'closed') return 'secondary' as const;
  return 'warning' as const;
}

function confirmStatusChange(subject: string, status: string) {
  return window.confirm(`¿Confirmas cambiar el estado de ${subject} a “${status}”?`);
}

export function ApplicationsManagement() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ApplicationTab>('adoptions');
  const [adoptionFilter, setAdoptionFilter] = useState<AdoptionFilter>('all');
  const [followUpFilter, setFollowUpFilter] = useState<FollowUpFilter>('all');
  const [volunteerFilter, setVolunteerFilter] = useState<VolunteerFilter>('all');
  const [sponsorshipFilter, setSponsorshipFilter] = useState<SponsorshipFilter>('all');
  const [messageFilter, setMessageFilter] = useState<MessageFilter>('all');
  const [search, setSearch] = useState('');

  const adoptionsQuery = useQuery({
    queryKey: ['admin-adoptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('adoption_applications')
        .select('*, animal:animals(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as AdoptionApplication[];
    },
  });

  const volunteersQuery = useQuery({
    queryKey: ['admin-volunteers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('volunteer_applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as VolunteerApplication[];
    },
  });

  const sponsorshipsQuery = useQuery({
    queryKey: ['admin-sponsorships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsorship_inquiries')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as SponsorshipInquiry[];
    },
  });

  const messagesQuery = useQuery({
    queryKey: ['admin-contact-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ContactMessage[];
    },
  });

  const adoptions = adoptionsQuery.data ?? [];
  const volunteers = volunteersQuery.data ?? [];
  const sponsorships = sponsorshipsQuery.data ?? [];
  const messages = messagesQuery.data ?? [];

  const pendingAdoptionsCount = adoptions.filter((a) => a.status === 'pending').length;
  const overdueAdoptionsCount = adoptions.filter((app) => app.next_contact_at && new Date(app.next_contact_at).getTime() < Date.now() && !['approved', 'rejected'].includes(app.status)).length;
  const pendingVolunteersCount = volunteers.filter((v) => v.status === 'pending').length;
  const pendingSponsorshipsCount = sponsorships.filter((s) => s.status === 'pending').length;
  const unreadMessagesCount = messages.filter((m) => !m.is_read).length;

  const normalizedSearch = search.trim().toLowerCase();

  const filteredAdoptions = useMemo(
    () =>
      adoptions.filter((app) => {
        const matchesStatus = adoptionFilter === 'all' || app.status === adoptionFilter;
        const isOverdue = Boolean(app.next_contact_at && new Date(app.next_contact_at).getTime() < Date.now() && !['approved', 'rejected'].includes(app.status));
        const matchesFollowUp = followUpFilter === 'all' || isOverdue;
        const matchesSearch =
          !normalizedSearch ||
          [app.applicant_name ?? '', app.applicant_email ?? '', app.applicant_phone ?? '', app.animal?.name ?? ''].some((value) =>
            value.toLowerCase().includes(normalizedSearch),
          );
        return matchesStatus && matchesFollowUp && matchesSearch;
      }),
    [adoptions, adoptionFilter, followUpFilter, normalizedSearch],
  );

  const filteredVolunteers = useMemo(
    () =>
      volunteers.filter((vol) => {
        const matchesStatus = volunteerFilter === 'all' || vol.status === volunteerFilter;
        const matchesSearch =
          !normalizedSearch ||
          [vol.full_name ?? '', vol.email ?? '', vol.phone ?? '', vol.area_of_interest ?? ''].some((value) =>
            value.toLowerCase().includes(normalizedSearch),
          );
        return matchesStatus && matchesSearch;
      }),
    [volunteers, volunteerFilter, normalizedSearch],
  );

  const filteredSponsorships = useMemo(
    () =>
      sponsorships.filter((sp) => {
        const matchesStatus = sponsorshipFilter === 'all' || sp.status === sponsorshipFilter;
        const matchesSearch =
          !normalizedSearch ||
          [sp.id, sp.supporter_name ?? '', sp.supporter_email ?? '', sp.supporter_phone ?? '', sp.dog_slug ?? '', sp.message ?? ''].some((value) =>
            value.toLowerCase().includes(normalizedSearch),
          );
        return matchesStatus && matchesSearch;
      }),
    [sponsorships, sponsorshipFilter, normalizedSearch],
  );

  const filteredMessages = useMemo(
    () =>
      messages.filter((msg) => {
        const matchesFilter =
          messageFilter === 'all' ||
          (messageFilter === 'unread' && !msg.is_read) ||
          (messageFilter === 'read' && msg.is_read) ||
          msg.type === messageFilter;
        const matchesSearch =
          !normalizedSearch ||
          [msg.name ?? '', msg.email ?? '', msg.subject ?? '', msg.message ?? ''].some((value) =>
            value.toLowerCase().includes(normalizedSearch),
          );
        return matchesFilter && matchesSearch;
      }),
    [messages, messageFilter, normalizedSearch],
  );

  const updateAdoption = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApplicationStatus }) => {
      const { data, error } = await supabase
        .from('adoption_applications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('id')
        .single();
      if (error) throw error;
      if (!data) throw new Error('Supabase no confirmó la actualización.');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-adoptions'] });
      toast.success('Estado de adopción actualizado.');
    },
    onError: (error: Error) => toast.error(`No se actualizó la solicitud: ${error.message}`),
  });

  const updateVolunteer = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: VolunteerApplication['status'] }) => {
      const { data, error } = await supabase
        .from('volunteer_applications')
        .update({ status })
        .eq('id', id)
        .select('id')
        .single();
      if (error) throw error;
      if (!data) throw new Error('Supabase no confirmó la actualización.');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-volunteers'] });
      toast.success('Estado de voluntariado actualizado.');
    },
    onError: (error: Error) => toast.error(`No se actualizó el voluntariado: ${error.message}`),
  });

  const updateSponsorship = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: SponsorshipInquiryStatus }) => {
      const { data, error } = await supabase
        .from('sponsorship_inquiries')
        .update({ status })
        .eq('id', id)
        .select('id')
        .single();
      if (error) throw error;
      if (!data) throw new Error('Supabase no confirmó la actualización.');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sponsorships'] });
      toast.success('Estado de apadrinamiento actualizado.');
    },
    onError: (error: Error) => toast.error(`No se actualizó el apadrinamiento: ${error.message}`),
  });

  const toggleMessageRead = useMutation({
    mutationFn: async ({ id, is_read }: { id: string; is_read: boolean }) => {
      const { data, error } = await supabase
        .from('contact_messages')
        .update({ is_read })
        .eq('id', id)
        .select('id')
        .single();
      if (error) throw error;
      if (!data) throw new Error('Supabase no confirmó la actualización.');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contact-messages'] });
      toast.success('Mensaje actualizado.');
    },
    onError: (error: Error) => toast.error(`No se actualizó el mensaje: ${error.message}`),
  });

  const isUpdating =
    updateAdoption.isPending ||
    updateVolunteer.isPending ||
    updateSponsorship.isPending ||
    toggleMessageRead.isPending;

  const hasError =
    adoptionsQuery.error ||
    volunteersQuery.error ||
    sponsorshipsQuery.error ||
    messagesQuery.error;

  const isLoading =
    adoptionsQuery.isLoading ||
    volunteersQuery.isLoading ||
    sponsorshipsQuery.isLoading ||
    messagesQuery.isLoading;

  const retry = () => {
    void adoptionsQuery.refetch();
    void volunteersQuery.refetch();
    void sponsorshipsQuery.refetch();
    void messagesQuery.refetch();
  };

  const changeAdoptionStatus = (app: AdoptionApplication, status: ApplicationStatus) => {
    if (
      app.status === status ||
      !confirmStatusChange(`la solicitud de ${app.applicant_name ?? 'el solicitante'}`, (adoptionStatusLabel[status] ?? status).toLowerCase())
    ) {
      return;
    }
    updateAdoption.mutate({ id: app.id, status });
  };

  const changeVolunteerStatus = (vol: VolunteerApplication, status: VolunteerApplication['status']) => {
    if (
      vol.status === status ||
      !confirmStatusChange(`la solicitud de ${vol.full_name ?? 'el postulante'}`, (volunteerStatusLabel[status] ?? status).toLowerCase())
    ) {
      return;
    }
    updateVolunteer.mutate({ id: vol.id, status });
  };

  const changeSponsorshipStatus = (sp: SponsorshipInquiry, status: SponsorshipInquiryStatus) => {
    if (
      sp.status === status ||
      !confirmStatusChange(`el apadrinamiento de ${sp.supporter_name ?? 'el padrino'}`, (sponsorshipStatusLabel[status] ?? status).toLowerCase())
    ) {
      return;
    }
    updateSponsorship.mutate({ id: sp.id, status });
  };

  return (
    <div className="space-y-6">
      {hasError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">No se pudieron cargar todas las bandejas operativas.</p>
            <p className="mt-1">La lista puede estar incompleta. Comprueba la conexión antes de tomar decisiones.</p>
          </div>
          <Button size="sm" variant="outline" onClick={retry}>
            Reintentar
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]" role="status">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando bandeja operativa…
        </div>
      )}

      <div>
        <h1 className="flex items-center gap-2 font-heading text-2xl font-bold">
          <FileText className="h-6 w-6 text-[var(--color-primary)]" /> Bandeja operativa de solicitudes
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Centraliza adopciones, voluntariado, apadrinamientos y consultas públicas en un solo lugar.
        </p>
      </div>

      {/* Quick Pending Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => setTab('adoptions')}
          className={`rounded-xl border p-3.5 text-left transition ${
            tab === 'adoptions' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-[var(--color-border)] bg-[var(--color-card)]'
          }`}
        >
          <span className="text-xs font-semibold text-[var(--color-muted-foreground)]">Adopciones pendientes</span>
          <p className="mt-1 font-heading text-2xl font-extrabold">{pendingAdoptionsCount}</p>
        </button>
        <button
          type="button"
          onClick={() => setTab('volunteers')}
          className={`rounded-xl border p-3.5 text-left transition ${
            tab === 'volunteers' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-[var(--color-border)] bg-[var(--color-card)]'
          }`}
        >
          <span className="text-xs font-semibold text-[var(--color-muted-foreground)]">Voluntarios por contactar</span>
          <p className="mt-1 font-heading text-2xl font-extrabold">{pendingVolunteersCount}</p>
        </button>
        <button
          type="button"
          onClick={() => setTab('sponsorships')}
          className={`rounded-xl border p-3.5 text-left transition ${
            tab === 'sponsorships' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-[var(--color-border)] bg-[var(--color-card)]'
          }`}
        >
          <span className="text-xs font-semibold text-[var(--color-muted-foreground)]">Apadrinamientos nuevos</span>
          <p className="mt-1 font-heading text-2xl font-extrabold">{pendingSponsorshipsCount}</p>
        </button>
        <button
          type="button"
          onClick={() => setTab('messages')}
          className={`rounded-xl border p-3.5 text-left transition ${
            tab === 'messages' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-[var(--color-border)] bg-[var(--color-card)]'
          }`}
        >
          <span className="text-xs font-semibold text-[var(--color-muted-foreground)]">Mensajes sin leer</span>
          <p className="mt-1 font-heading text-2xl font-extrabold">{unreadMessagesCount}</p>
        </button>
      </div>

      <div className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Tipo de solicitud">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'adoptions'}
            onClick={() => {
              setTab('adoptions');
              setSearch('');
            }}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              tab === 'adoptions'
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'
            }`}
          >
            🐶 Adopciones <span className="ml-1 opacity-80">{adoptions.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'volunteers'}
            onClick={() => {
              setTab('volunteers');
              setSearch('');
            }}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              tab === 'volunteers'
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'
            }`}
          >
            🤝 Voluntariado <span className="ml-1 opacity-80">{volunteers.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'sponsorships'}
            onClick={() => {
              setTab('sponsorships');
              setSearch('');
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold ${
              tab === 'sponsorships'
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'
            }`}
          >
            <HeartHandshake className="h-4 w-4" /> Apadrinamientos <span className="ml-1 opacity-80">{sponsorships.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'messages'}
            onClick={() => {
              setTab('messages');
              setSearch('');
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold ${
              tab === 'messages'
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'
            }`}
          >
            <MessageSquare className="h-4 w-4" /> Mensajes y consultas <span className="ml-1 opacity-80">{messages.length}</span>
          </button>
        </div>

        <label className="relative block w-full lg:max-w-xs">
          <span className="sr-only">Buscar solicitudes</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, correo o perro…"
            className="h-10 w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2" aria-label="Filtrar solicitudes por estado">
        <span className="text-xs font-semibold text-[var(--color-muted-foreground)]">Filtrar:</span>
        {tab === 'adoptions' &&
          adoptionStatuses.map((filter) => (
            <FilterChip
              key={filter.value}
              label={filter.label}
              selected={adoptionFilter === filter.value}
              onClick={() => setAdoptionFilter(filter.value)}
            />
          ))}
        {tab === 'adoptions' && <FilterChip
          label={`Seguimiento vencido${overdueAdoptionsCount ? ` · ${overdueAdoptionsCount}` : ''}`}
          selected={followUpFilter === 'overdue'}
          onClick={() => setFollowUpFilter(followUpFilter === 'overdue' ? 'all' : 'overdue')}
        />}
        {tab === 'volunteers' &&
          volunteerStatuses.map((filter) => (
            <FilterChip
              key={filter.value}
              label={filter.label}
              selected={volunteerFilter === filter.value}
              onClick={() => setVolunteerFilter(filter.value)}
            />
          ))}
        {tab === 'sponsorships' &&
          sponsorshipStatuses.map((filter) => (
            <FilterChip
              key={filter.value}
              label={filter.label}
              selected={sponsorshipFilter === filter.value}
              onClick={() => setSponsorshipFilter(filter.value)}
            />
          ))}
        {tab === 'messages' &&
          messageFilters.map((filter) => (
            <FilterChip
              key={filter.value}
              label={filter.label}
              selected={messageFilter === filter.value}
              onClick={() => setMessageFilter(filter.value)}
            />
          ))}
      </div>

      <Card>
        <CardContent className="pt-4">
          {tab === 'adoptions' && (
            <AdoptionList
              applications={filteredAdoptions}
              total={adoptions.length}
              isUpdating={isUpdating}
              onStatusChange={changeAdoptionStatus}
            />
          )}
          {tab === 'volunteers' && (
            <VolunteerList
              applications={filteredVolunteers}
              total={volunteers.length}
              isUpdating={isUpdating}
              onStatusChange={changeVolunteerStatus}
            />
          )}
          {tab === 'sponsorships' && (
            <SponsorshipList
              inquiries={filteredSponsorships}
              total={sponsorships.length}
              isUpdating={isUpdating}
              onStatusChange={changeSponsorshipStatus}
            />
          )}
          {tab === 'messages' && (
            <ContactMessageList
              messages={filteredMessages}
              total={messages.length}
              isUpdating={isUpdating}
              onToggleRead={(msg) => toggleMessageRead.mutate({ id: msg.id, is_read: !msg.is_read })}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FilterChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
        selected
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
          : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]'
      }`}
    >
      {label}
    </button>
  );
}

function AdoptionList({
  applications,
  total,
  isUpdating,
  onStatusChange,
}: {
  applications: AdoptionApplication[];
  total: number;
  isUpdating: boolean;
  onStatusChange: (app: AdoptionApplication, status: ApplicationStatus) => void;
}) {
  if (applications.length === 0) {
    return (
      <EmptyState
        message={total === 0 ? 'Todavía no hay solicitudes de adopción directa.' : 'No hay adopciones que coincidan con los filtros.'}
      />
    );
  }
  return (
    <div className="space-y-4 divide-y divide-[var(--color-border)]">
      {applications.map((app) => {
        const rawPhone = app.applicant_phone ?? '';
        const cleanPhone = String(rawPhone).replace(/\D/g, '');
        const whatsappUrl = cleanPhone
          ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
              `Hola ${app.applicant_name ?? 'amigo'}, nos comunicamos de AdoptaME sobre tu solicitud de adopción.`,
            )}`
          : null;
        return (
          <div key={app.id} className="space-y-3 pt-4 first:pt-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-heading text-lg font-bold">{app.applicant_name ?? 'Solicitante'}</h3>
                <p className="text-xs font-semibold text-[var(--color-primary)]">
                  Interesado en: {app.animal?.name ?? 'Perro rescatado'}
                </p>
              </div>
              <Badge variant={getBadgeVariant(app.status)}>{adoptionStatusLabel[app.status] ?? app.status}</Badge>
            </div>
            <div className="grid grid-cols-1 gap-2 rounded-xl bg-[var(--color-background)] p-3 text-xs text-[var(--color-muted-foreground)] sm:grid-cols-3">
              <span className="flex items-center gap-1.5 break-all">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {app.applicant_email ?? 'Sin correo'}
              </span>
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 font-semibold text-emerald-600 hover:underline"
                >
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {rawPhone || 'WhatsApp'} · WhatsApp
                </a>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {rawPhone || 'Sin teléfono'}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {app.applicant_address ?? 'Sin dirección'}
              </span>
            </div>
            <p className="border-l-2 border-[var(--color-primary)] pl-3 text-xs italic leading-relaxed">
              “{app.reason ?? 'Sin motivo especificado'}”
            </p>
            <FollowUpPanel application={app} />
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-[var(--color-muted-foreground)]">Recibida: {formatDateShort(app.created_at)}</span>
              <div className="flex flex-wrap gap-2">
                {app.status !== 'approved' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-emerald-600"
                    disabled={isUpdating}
                    onClick={() => onStatusChange(app, 'approved')}
                  >
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Aprobar
                  </Button>
                )}
                {app.status !== 'rejected' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-rose-600"
                    disabled={isUpdating}
                    onClick={() => onStatusChange(app, 'rejected')}
                  >
                    <XCircle className="mr-1 h-4 w-4" /> Rechazar
                  </Button>
                )}
                {app.status === 'pending' && (
                  <Button size="sm" variant="secondary" disabled={isUpdating} onClick={() => onStatusChange(app, 'under_review')}>
                    Pasar a revisión
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

type ContactEvent = { id: string; event_type: 'call' | 'whatsapp' | 'email' | 'visit' | 'note'; summary: string; occurred_at: string };

function toDateTimeLocal(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function FollowUpPanel({ application }: { application: AdoptionApplication }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [nextAction, setNextAction] = useState(application.next_action ?? '');
  const [nextContactAt, setNextContactAt] = useState(toDateTimeLocal(application.next_contact_at));
  const [eventType, setEventType] = useState<ContactEvent['event_type']>('whatsapp');
  const [summary, setSummary] = useState('');
  const eventsQuery = useQuery({
    queryKey: ['admin-adoption-contact-events', application.id],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase.from('adoption_contact_events').select('id, event_type, summary, occurred_at').eq('application_id', application.id).order('occurred_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ContactEvent[];
    },
  });
  const saveMutation = useMutation({
    mutationFn: async (takeOwnership: boolean) => {
      const patch: Record<string, unknown> = {
        next_action: nextAction.trim() || null,
        next_contact_at: nextContactAt ? new Date(nextContactAt).toISOString() : null,
      };
      if (takeOwnership) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw userError ?? new Error('Inicia sesión de nuevo para tomar esta solicitud.');
        patch.assigned_to = user.id;
      }
      const { error } = await supabase.from('adoption_applications').update(patch).eq('id', application.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-adoptions'] });
      toast.success('Seguimiento actualizado.');
    },
    onError: (error: Error) => toast.error(/assigned_to|next_action|next_contact_at|column/i.test(error.message) ? 'Aplica primero la migración de seguimiento de solicitudes en Supabase.' : `No se pudo guardar el seguimiento: ${error.message}`),
  });
  const logMutation = useMutation({
    mutationFn: async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw userError ?? new Error('Inicia sesión de nuevo para registrar el contacto.');
      const { error } = await supabase.from('adoption_contact_events').insert({ application_id: application.id, event_type: eventType, summary: summary.trim(), created_by: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      setSummary('');
      void queryClient.invalidateQueries({ queryKey: ['admin-adoption-contact-events', application.id] });
      void queryClient.invalidateQueries({ queryKey: ['admin-adoptions'] });
      toast.success('Contacto agregado al historial.');
    },
    onError: (error: Error) => toast.error(/adoption_contact_events|relation|column/i.test(error.message) ? 'Aplica primero la migración de seguimiento de solicitudes en Supabase.' : `No se pudo registrar el contacto: ${error.message}`),
  });
  const eventLabels: Record<ContactEvent['event_type'], string> = { call: 'Llamada', whatsapp: 'WhatsApp', email: 'Correo', visit: 'Visita', note: 'Nota' };

  return <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)]">
    <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-semibold">
      <CalendarClock className="h-4 w-4 text-[var(--color-primary)]" /> Seguimiento interno
      {application.next_contact_at && <span className={`ml-auto font-medium ${new Date(application.next_contact_at).getTime() < Date.now() ? 'text-rose-600' : 'text-[var(--color-muted-foreground)]'}`}>{new Date(application.next_contact_at).getTime() < Date.now() ? 'Vencido · ' : 'Próximo · '}{new Date(application.next_contact_at).toLocaleString('es-EC')}</span>}
      {application.assigned_to && <span className="ml-auto inline-flex items-center gap-1 text-[var(--color-muted-foreground)]"><UserRound className="h-3.5 w-3.5" />Asignada</span>}
    </summary>
    <div className="space-y-4 border-t border-[var(--color-border)] p-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate(true)}><UserRound className="mr-1.5 h-4 w-4" />Tomar solicitud</Button>
        {application.last_contacted_at && <span className="self-center text-xs text-[var(--color-muted-foreground)]">Último contacto: {new Date(application.last_contacted_at).toLocaleString('es-EC')}</span>}
      </div>
      <form onSubmit={(event) => { event.preventDefault(); saveMutation.mutate(false); }} className="grid gap-3 sm:grid-cols-[1fr_14rem_auto] sm:items-end">
        <label className="space-y-1 text-xs font-medium">Próxima acción<input maxLength={500} value={nextAction} onChange={(event) => setNextAction(event.target.value)} placeholder="Ej. Escribir para conversar horarios" className="mt-1 h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3" /></label>
        <label className="space-y-1 text-xs font-medium">Fecha de seguimiento<input type="datetime-local" value={nextContactAt} onChange={(event) => setNextContactAt(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-2" /></label>
        <Button type="submit" size="sm" variant="secondary" disabled={saveMutation.isPending}>Guardar</Button>
      </form>
      <form onSubmit={(event) => { event.preventDefault(); if (summary.trim()) logMutation.mutate(); }} className="grid gap-2 sm:grid-cols-[9rem_1fr_auto] sm:items-end">
        <label className="space-y-1 text-xs font-medium">Canal<select value={eventType} onChange={(event) => setEventType(event.target.value as ContactEvent['event_type'])} className="mt-1 h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-2">{Object.entries(eventLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="space-y-1 text-xs font-medium">Resumen del contacto<textarea maxLength={1500} required value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Anota lo conversado y el acuerdo siguiente" className="mt-1 min-h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 py-2" /></label>
        <Button type="submit" size="sm" variant="outline" disabled={logMutation.isPending || !summary.trim()}>Registrar</Button>
      </form>
      {eventsQuery.isLoading && <p className="text-xs text-[var(--color-muted-foreground)]">Cargando historial…</p>}
      {eventsQuery.error && <p role="status" className="text-xs text-amber-700 dark:text-amber-300">Historial disponible al aplicar la migración de seguimiento en Supabase.</p>}
      {eventsQuery.data && <ol className="space-y-2 border-l border-[var(--color-border)] pl-3">{eventsQuery.data.length ? eventsQuery.data.map((entry) => <li key={entry.id} className="text-xs"><p className="font-semibold">{eventLabels[entry.event_type]} · {new Date(entry.occurred_at).toLocaleString('es-EC')}</p><p className="mt-0.5 whitespace-pre-wrap text-[var(--color-muted-foreground)]">{entry.summary}</p></li>) : <li className="text-xs text-[var(--color-muted-foreground)]">Aún no hay contactos registrados.</li>}</ol>}
    </div>
  </details>;
}

function VolunteerList({
  applications,
  total,
  isUpdating,
  onStatusChange,
}: {
  applications: VolunteerApplication[];
  total: number;
  isUpdating: boolean;
  onStatusChange: (vol: VolunteerApplication, status: VolunteerApplication['status']) => void;
}) {
  if (applications.length === 0) {
    return (
      <EmptyState
        message={total === 0 ? 'Todavía no hay solicitudes de voluntariado.' : 'No hay voluntariados que coincidan con los filtros.'}
      />
    );
  }
  return (
    <div className="space-y-4 divide-y divide-[var(--color-border)]">
      {applications.map((vol) => (
        <div key={vol.id} className="space-y-3 pt-4 first:pt-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-heading text-base font-bold">{vol.full_name ?? 'Postulante'}</h3>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {vol.area_of_interest ?? 'Voluntariado'} · {vol.availability ?? 'Flexible'}
              </p>
            </div>
            <Badge variant={getBadgeVariant(vol.status)}>{volunteerStatusLabel[vol.status] ?? vol.status}</Badge>
          </div>
          <div className="grid grid-cols-1 gap-2 rounded-xl bg-[var(--color-background)] p-3 text-xs text-[var(--color-muted-foreground)] sm:grid-cols-3">
            <span className="break-all">✉️ {vol.email ?? 'Sin correo'}</span>
            <span>📞 {vol.phone ?? 'Sin teléfono'}</span>
            <span>🗓️ {vol.availability ?? 'Flexible'}</span>
          </div>
          {vol.experience && <p className="text-xs leading-relaxed">Experiencia: {vol.experience}</p>}
          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-[var(--color-muted-foreground)]">Recibida: {formatDateShort(vol.created_at)}</span>
            <select
              aria-label={`Estado de ${vol.full_name ?? 'postulante'}`}
              value={vol.status}
              disabled={isUpdating}
              onChange={(event) => onStatusChange(vol, event.target.value as VolunteerApplication['status'])}
              className="h-9 rounded-lg border border-[var(--color-input)] bg-transparent px-2 text-xs sm:w-auto"
            >
              <option value="pending">Pendiente</option>
              <option value="contacted">Contactado</option>
              <option value="active">Activo</option>
              <option value="archived">Archivado</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}

function SponsorshipList({
  inquiries,
  total,
  isUpdating,
  onStatusChange,
}: {
  inquiries: SponsorshipInquiry[];
  total: number;
  isUpdating: boolean;
  onStatusChange: (sp: SponsorshipInquiry, status: SponsorshipInquiryStatus) => void;
}) {
  if (inquiries.length === 0) {
    return (
      <EmptyState
        message={
          total === 0
            ? 'Todavía no hay intenciones de apadrinamiento registradas.'
            : 'No hay apadrinamientos que coincidan con los filtros.'
        }
      />
    );
  }
  return (
    <div className="space-y-4 divide-y divide-[var(--color-border)]">
      {inquiries.map((sp) => {
        const cleanPhone = String(sp.supporter_phone ?? '').replace(/\D/g, '');
        const whatsappUrl = cleanPhone
          ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
              `Hola ${sp.supporter_name}, te escribimos de AdoptaME para coordinar tu apadrinamiento de ${sp.dog_slug}.`,
            )}`
          : null;
        return (
          <div key={sp.id} className="space-y-3 pt-4 first:pt-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-heading text-base font-bold">{sp.supporter_name}</h3>
                <p className="text-xs font-semibold text-[var(--color-primary)]">
                  Perrito: <span className="capitalize">{sp.dog_slug}</span> ·{' '}
                  {sp.frequency === 'monthly' ? 'Mensual' : 'Aporte único'}
                  {sp.amount_usd ? ` · $${sp.amount_usd} USD` : ''}
                </p>
                <p className="mt-1 break-all font-mono text-xs text-[var(--color-muted-foreground)]">Referencia: {sp.id}</p>
              </div>
              <Badge variant={getBadgeVariant(sp.status)}>{sponsorshipStatusLabel[sp.status] ?? sp.status}</Badge>
            </div>
            <div className="grid grid-cols-1 gap-2 rounded-xl bg-[var(--color-background)] p-3 text-xs text-[var(--color-muted-foreground)] sm:grid-cols-3">
              <span className="flex items-center gap-1.5 break-all">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {sp.supporter_email}
              </span>
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 font-semibold text-emerald-600 hover:underline"
                >
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {sp.supporter_phone} · WhatsApp
                </a>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {sp.supporter_phone || 'Sin teléfono'}
                </span>
              )}
              <span>Fecha: {formatDateShort(sp.created_at)}</span>
            </div>
            {sp.message && (
              <p className="border-l-2 border-[var(--color-primary)] pl-3 text-xs italic leading-relaxed">“{sp.message}”</p>
            )}
            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-[var(--color-muted-foreground)]">Recibida: {formatDateShort(sp.created_at)}</span>
              <select
                aria-label={`Estado de apadrinamiento de ${sp.supporter_name}`}
                value={sp.status}
                disabled={isUpdating}
                onChange={(event) => onStatusChange(sp, event.target.value as SponsorshipInquiryStatus)}
                className="h-9 rounded-lg border border-[var(--color-input)] bg-transparent px-2 text-xs sm:w-auto"
              >
                <option value="pending">Pendiente</option>
                <option value="contacted">Contactado</option>
                <option value="active">Apadrinando</option>
                <option value="closed">Cerrado</option>
              </select>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ContactMessageList({
  messages,
  total,
  isUpdating,
  onToggleRead,
}: {
  messages: ContactMessage[];
  total: number;
  isUpdating: boolean;
  onToggleRead: (msg: ContactMessage) => void;
}) {
  if (messages.length === 0) {
    return (
      <EmptyState
        message={total === 0 ? 'Todavía no hay mensajes ni consultas recibidas.' : 'No hay mensajes que coincidan con los filtros.'}
      />
    );
  }
  return (
    <div className="space-y-4 divide-y divide-[var(--color-border)]">
      {messages.map((msg) => (
        <div key={msg.id} className="space-y-3 pt-4 first:pt-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-heading text-base font-bold">{msg.subject}</h3>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                De: <strong>{msg.name}</strong> ({msg.email}) · {messageTypeLabel[msg.type] ?? msg.type}
              </p>
            </div>
            <Badge variant={msg.is_read ? 'secondary' : 'warning'}>{msg.is_read ? 'Leído' : 'Sin leer'}</Badge>
          </div>
          <pre className="whitespace-pre-wrap rounded-xl bg-[var(--color-background)] p-3.5 font-sans text-xs leading-relaxed text-[var(--color-foreground)]">
            {msg.message}
          </pre>
          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-[var(--color-muted-foreground)]">Recibido: {formatDateShort(msg.created_at)}</span>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" asChild>
                <a href={`mailto:${msg.email}?subject=${encodeURIComponent(`Re: ${msg.subject}`)}`}>
                  <Mail className="mr-1 h-3.5 w-3.5" /> Responder por correo
                </a>
              </Button>
              <Button size="sm" variant="ghost" disabled={isUpdating} onClick={() => onToggleRead(msg)}>
                <CheckCircle2 className="mr-1 h-4 w-4" />
                {msg.is_read ? 'Marcar como no leído' : 'Marcar como leído'}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="py-10 text-center text-sm text-[var(--color-muted-foreground)]">{message}</p>;
}
