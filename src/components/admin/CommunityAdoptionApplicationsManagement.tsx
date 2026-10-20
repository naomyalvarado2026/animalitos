import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Status = 'pending' | 'contacted' | 'under_review' | 'approved' | 'rejected';
type Application = {
  id: string;
  listing_id: string;
  applicant_name: string;
  applicant_email: string | null;
  applicant_phone: string;
  city: string;
  housing_type: string;
  has_yard: boolean;
  has_children: boolean;
  has_other_pets: boolean;
  other_pets_details: string | null;
  reason: string;
  status: Status;
  admin_notes: string | null;
  created_at: string;
  listing: { name: string; species: 'dog' | 'cat'; city: string } | null;
};

const labels: Record<Status, string> = {
  pending: 'Pendiente',
  contacted: 'Contactado',
  under_review: 'En revisión',
  approved: 'Aprobado',
  rejected: 'No continúa',
};

export function CommunityAdoptionApplicationsManagement() {
  const { hasAccessLevel } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const applicationsQuery = useQuery({
    queryKey: ['community-adoption-applications'],
    queryFn: async () => {
      const { data, error } = await supabase.from('community_adoption_applications')
        .select('*, listing:community_adoption_listings(name,species,city)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Application[];
    },
    enabled: hasAccessLevel(4),
  });

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (applicationsQuery.data ?? []).filter((app) => !needle || [
      app.applicant_name, app.applicant_email, app.applicant_phone, app.city, app.listing?.name,
    ].some((value) => (value ?? '').toLowerCase().includes(needle)));
  }, [applicationsQuery.data, search]);

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { error } = await supabase.from('community_adoption_applications')
        .update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['community-adoption-applications'] }); toast.success('Estado actualizado.'); },
    onError: () => toast.error('No se pudo actualizar el estado.'),
  });

  async function saveNotes(app: Application) {
    setSavingId(app.id);
    const { error } = await supabase.from('community_adoption_applications')
      .update({ admin_notes: notes[app.id] ?? app.admin_notes ?? '', updated_at: new Date().toISOString() })
      .eq('id', app.id);
    setSavingId(null);
    if (error) { toast.error('No se pudieron guardar las notas.'); return; }
    toast.success('Seguimiento guardado.');
    void queryClient.invalidateQueries({ queryKey: ['community-adoption-applications'] });
  }

  if (!hasAccessLevel(4)) return <section className="p-6"><p>No tienes permiso para ver estas solicitudes.</p></section>;

  return (
    <section className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
      <header><p className="text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">Adopciones de la comunidad</p><h1 className="mt-1 font-heading text-3xl font-extrabold">Personas interesadas</h1><p className="mt-2 max-w-2xl text-sm text-[var(--color-muted-foreground)]">Revisa cada interés, contacta a la familia y registra el avance para que ningún animalito quede sin seguimiento.</p></header>
      <div className="relative max-w-xl"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar persona, animal, ciudad o teléfono" className="pl-9" /></div>
      {applicationsQuery.isLoading ? <div className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" />Cargando solicitudes…</div> : null}
      {applicationsQuery.isError && <Card><CardContent className="p-6 text-sm">No se pudieron cargar las solicitudes. Intenta nuevamente.</CardContent></Card>}
      {!applicationsQuery.isLoading && !applicationsQuery.isError && filtered.length === 0 && <Card><CardContent className="p-8 text-center"><h2 className="font-heading text-xl font-bold">Aún no hay personas interesadas</h2><p className="mt-2 text-sm text-[var(--color-muted-foreground)]">Cuando alguien complete el formulario, aparecerá aquí.</p></CardContent></Card>}
      <div className="space-y-4">
        {filtered.map((app) => {
          const phone = app.applicant_phone.replace(/[^0-9]/g, '');
          return <Card key={app.id}><CardContent className="space-y-4 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold text-[var(--color-primary)]">Interés por {app.listing?.name ?? 'animalito'} · {app.listing?.species === 'cat' ? 'Gato' : 'Perro'}</p><h2 className="mt-1 font-heading text-xl font-bold">{app.applicant_name}</h2><p className="text-xs text-[var(--color-muted-foreground)]">Recibida {new Date(app.created_at).toLocaleString('es-EC')}</p></div><Badge variant={app.status === 'approved' ? 'success' : app.status === 'rejected' ? 'secondary' : 'outline'}>{labels[app.status]}</Badge></div>
            <div className="grid gap-2 rounded-xl bg-[var(--color-background)] p-3 text-sm sm:grid-cols-2"><a className="font-semibold text-emerald-700 hover:underline" href={'https://wa.me/' + phone} target="_blank" rel="noreferrer">WhatsApp: {app.applicant_phone}</a><span>{app.applicant_email || 'Sin correo'}</span><span>{app.city} · {app.housing_type === 'apartment' ? 'Departamento' : app.housing_type === 'house' ? 'Casa' : 'Otra vivienda'}</span><span>{app.has_yard ? 'Tiene patio' : 'Sin patio informado'} · {app.has_children ? 'Viven niños' : 'Sin niños informados'}</span></div>
            {app.has_other_pets && <p className="text-sm"><strong>Otros animales:</strong> {app.other_pets_details || 'No dio detalles'}</p>}
            <p className="border-l-2 border-[var(--color-primary)] pl-3 text-sm leading-relaxed">{app.reason}</p>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"><div className="space-y-2"><Label htmlFor={'notes-' + app.id}>Notas privadas del seguimiento</Label><Textarea id={'notes-' + app.id} maxLength={2000} rows={2} value={notes[app.id] ?? app.admin_notes ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [app.id]: event.target.value }))} placeholder="Llamada, visita, acuerdos o próximo paso…" /></div><Button variant="outline" disabled={savingId === app.id} onClick={() => void saveNotes(app)}>{savingId === app.id ? 'Guardando…' : 'Guardar notas'}</Button></div>
            <div className="flex flex-wrap items-center gap-2"><Label htmlFor={'status-' + app.id}>Estado:</Label><select id={'status-' + app.id} className="h-9 rounded-lg border border-[var(--color-input)] bg-background px-3 text-sm" value={app.status} disabled={statusMutation.isPending} onChange={(event) => statusMutation.mutate({ id: app.id, status: event.target.value as Status })}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          </CardContent></Card>;
        })}
      </div>
    </section>
  );
}
