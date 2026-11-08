import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Save, ShieldCheck, ClipboardList, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type HelpRequest = {
  id: string; request_type: string; contact_name: string; contact_email: string | null; contact_phone: string;
  city: string; area: string | null; animal_name: string | null; animal_description: string; status: string;
  next_contact_at: string | null; admin_notes: string | null; created_at: string;
};
type CommunityResource = {
  id: string; category: string; name: string; city: string; description: string; eligibility: string | null;
  contact_label: string | null; contact_value: string | null; website_url: string | null; source_url: string | null;
  verified_at: string | null; is_published: boolean;
};

const REQUEST_LABELS: Record<string, string> = { keep_pet: 'Apoyo para mantener a su animal', lost_pet: 'Animal perdido', found_pet: 'Animal encontrado', post_adoption: 'Seguimiento posadopción' };
const RESOURCE_CATEGORIES = [
  ['food', 'Alimento'], ['veterinary', 'Atención veterinaria'], ['training', 'Conducta y educación'],
  ['municipal', 'Servicios municipales'], ['lost_found', 'Perdidos o encontrados'], ['other', 'Otro'],
];

function toLocalDateTimeInput(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function CommunitySupportManagement() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [tab, setTab] = useState<'requests' | 'resources'>('requests');
  const requests = useQuery({
    queryKey: ['admin-community-help-requests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('community_help_requests').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as HelpRequest[];
    },
  });
  const resources = useQuery({
    queryKey: ['admin-community-resources'],
    queryFn: async () => {
      const { data, error } = await supabase.from('community_resources').select('*').order('city').order('name');
      if (error) throw error;
      return (data ?? []) as CommunityResource[];
    },
  });

  const saveRequest = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: FormData }) => {
      const nextContact = String(form.get('next_contact_at') ?? '');
      const { error } = await supabase.from('community_help_requests').update({
        status: String(form.get('status') ?? 'pending'),
        next_contact_at: nextContact ? new Date(nextContact).toISOString() : null,
        admin_notes: String(form.get('admin_notes') ?? '').trim() || null,
        reviewed_by: profile?.id ?? null,
        updated_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-community-help-requests'] }); toast.success('Seguimiento guardado.'); },
    onError: () => toast.error('No se pudo guardar el seguimiento.'),
  });

  const createResource = useMutation({
    mutationFn: async (form: FormData) => {
      const verified = form.get('verified') === 'on';
      const { error } = await supabase.from('community_resources').insert([{
        category: String(form.get('category') ?? 'other'),
        name: String(form.get('name') ?? '').trim(),
        city: String(form.get('city') ?? '').trim(),
        description: String(form.get('description') ?? '').trim(),
        eligibility: String(form.get('eligibility') ?? '').trim() || null,
        contact_label: String(form.get('contact_label') ?? '').trim() || null,
        contact_value: String(form.get('contact_value') ?? '').trim() || null,
        website_url: String(form.get('website_url') ?? '').trim() || null,
        source_url: String(form.get('source_url') ?? '').trim() || null,
        verified_at: verified ? new Date().toISOString() : null,
        verified_by: verified ? profile?.id ?? null : null,
        is_published: verified,
      }]);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-community-resources'] }); qc.invalidateQueries({ queryKey: ['community-resources-public'] }); toast.success('Recurso guardado.'); },
    onError: (error: Error) => toast.error(`No se guardó el recurso: ${error.message}`),
  });

  const setResourcePublication = useMutation({
    mutationFn: async ({ resource, publish }: { resource: CommunityResource; publish: boolean }) => {
      const { error } = await supabase.from('community_resources').update({
        is_published: publish,
        verified_at: publish ? new Date().toISOString() : resource.verified_at,
        verified_by: publish ? profile?.id ?? null : null,
        updated_at: new Date().toISOString(),
      }).eq('id', resource.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-community-resources'] }); qc.invalidateQueries({ queryKey: ['community-resources-public'] }); toast.success('Visibilidad actualizada.'); },
    onError: () => toast.error('No se pudo cambiar la visibilidad.'),
  });

  async function submitResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    try {
      await createResource.mutateAsync(new FormData(formElement));
      formElement.reset();
    } catch {
      // Keep the entered resource details available so staff can correct and retry.
    }
  }

  return (
    <div className="space-y-6">
      <div><h1 className="font-heading text-2xl font-bold">Apoyo comunitario</h1><p className="mt-1 text-sm text-[var(--color-muted-foreground)]">Revisa casos de apoyo, perdidos/encontrados y posadopción. Publica solo contactos locales comprobados.</p></div>
      <div className="flex gap-2 border-b border-[var(--color-border)]">
        <button type="button" onClick={() => setTab('requests')} className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold ${tab === 'requests' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-muted-foreground)]'}`}><ClipboardList size={16} /> Solicitudes ({requests.data?.length ?? 0})</button>
        <button type="button" onClick={() => setTab('resources')} className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold ${tab === 'resources' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-muted-foreground)]'}`}><BookOpen size={16} /> Directorio ({resources.data?.length ?? 0})</button>
      </div>

      {tab === 'requests' && <section className="space-y-4">
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Los datos de las solicitudes son privados. Registra el siguiente contacto y cambia el estado cuando haya una acción real; la web no promete respuesta automática.</p>
        {requests.isLoading && <p role="status">Cargando solicitudes…</p>}
        {requests.error && <div role="alert" className="rounded-xl border border-rose-200 p-4 text-sm">No se pudieron cargar las solicitudes. <Button size="sm" variant="outline" onClick={() => requests.refetch()}>Reintentar</Button></div>}
        {!requests.isLoading && !requests.error && requests.data?.length === 0 && <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-[var(--color-muted-foreground)]">Aún no hay solicitudes comunitarias.</p>}
        <div className="grid gap-4 xl:grid-cols-2">{requests.data?.map(request => <form key={request.id} onSubmit={event => { event.preventDefault(); saveRequest.mutate({ id: request.id, form: new FormData(event.currentTarget) }); }} className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-[#f0644a]">{REQUEST_LABELS[request.request_type] ?? request.request_type}</p><h2 className="mt-1 font-heading text-lg font-bold">{request.contact_name}{request.animal_name ? ` · ${request.animal_name}` : ''}</h2><p className="mt-1 text-xs text-[var(--color-muted-foreground)]"><MapPin className="mr-1 inline h-3 w-3" />{request.city}{request.area ? ` · ${request.area}` : ''} · {new Date(request.created_at).toLocaleDateString('es-EC')}</p></div><a className="text-sm font-semibold text-emerald-700 underline" href={`https://wa.me/${request.contact_phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">WhatsApp</a></div>
          <div className="rounded-xl bg-[var(--color-background)] p-3 text-sm leading-relaxed">{request.animal_description}</div>
          <p className="text-xs text-[var(--color-muted-foreground)]">{request.contact_phone}{request.contact_email ? ` · ${request.contact_email}` : ''}</p>
          <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1"><Label htmlFor={`status-${request.id}`}>Estado</Label><select id={`status-${request.id}`} name="status" defaultValue={request.status} className="h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-sm"><option value="pending">Pendiente</option><option value="contacted">Contactado</option><option value="in_progress">En seguimiento</option><option value="resolved">Resuelto</option><option value="referred">Referido a otro recurso</option><option value="closed">Cerrado</option></select></div><div className="space-y-1"><Label htmlFor={`next-${request.id}`}>Próximo contacto</Label><Input id={`next-${request.id}`} name="next_contact_at" type="datetime-local" defaultValue={request.next_contact_at ? toLocalDateTimeInput(request.next_contact_at) : ''} /></div></div>
          <div className="space-y-1"><Label htmlFor={`notes-${request.id}`}>Notas internas</Label><Textarea id={`notes-${request.id}`} name="admin_notes" maxLength={3000} rows={2} defaultValue={request.admin_notes ?? ''} placeholder="Solo información necesaria para el seguimiento" /></div>
          <Button type="submit" size="sm" disabled={saveRequest.isPending}><Save className="mr-2 h-4 w-4" />Guardar seguimiento</Button>
        </form>)}</div>
      </section>}

      {tab === 'resources' && <section className="space-y-5">
        <form onSubmit={submitResource} className="grid gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:grid-cols-2">
          <h2 className="font-heading text-lg font-bold sm:col-span-2">Añadir recurso local</h2>
          <div className="space-y-1"><Label htmlFor="resource-name">Nombre del servicio</Label><Input id="resource-name" name="name" minLength={2} maxLength={160} required /></div>
          <div className="space-y-1"><Label htmlFor="resource-city">Ciudad</Label><Input id="resource-city" name="city" minLength={2} maxLength={100} required /></div>
          <div className="space-y-1"><Label htmlFor="resource-category">Categoría</Label><select id="resource-category" name="category" className="h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-sm">{RESOURCE_CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div className="space-y-1"><Label htmlFor="resource-contact-label">Etiqueta de contacto</Label><Input id="resource-contact-label" name="contact_label" maxLength={80} placeholder="Teléfono, WhatsApp o correo" /></div>
          <div className="space-y-1"><Label htmlFor="resource-contact-value">Dato de contacto</Label><Input id="resource-contact-value" name="contact_value" maxLength={250} /></div>
          <div className="space-y-1"><Label htmlFor="resource-website">Sitio web (HTTPS)</Label><Input id="resource-website" name="website_url" type="url" placeholder="https://…" /></div>
          <div className="space-y-1"><Label htmlFor="resource-source">Fuente revisada (HTTPS)</Label><Input id="resource-source" name="source_url" type="url" placeholder="https://…" /></div>
          <div className="space-y-1"><Label htmlFor="resource-eligibility">Condiciones (opcional)</Label><Textarea id="resource-eligibility" name="eligibility" maxLength={800} rows={2} /></div>
          <div className="space-y-1"><Label htmlFor="resource-description">Descripción</Label><Textarea id="resource-description" name="description" minLength={10} maxLength={1500} required rows={3} /></div>
          <label className="flex items-start gap-2 text-xs leading-relaxed sm:col-span-2"><input type="checkbox" name="verified" className="mt-0.5" /><span><ShieldCheck className="mr-1 inline h-4 w-4 text-emerald-700" />Confirmo que revisé el contacto y su vigencia. Si se marca, se publica inmediatamente en el sitio.</span></label>
          <Button type="submit" disabled={createResource.isPending} className="sm:col-span-2">{createResource.isPending ? 'Guardando…' : 'Guardar recurso'}</Button>
        </form>
        {resources.error && <div role="alert" className="rounded-xl border border-rose-200 p-4 text-sm">No se pudo cargar el directorio. <Button size="sm" variant="outline" onClick={() => resources.refetch()}>Reintentar</Button></div>}
        <div className="grid gap-3 md:grid-cols-2">{resources.data?.map(resource => <article key={resource.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4"><div><p className="font-semibold">{resource.name} · {resource.city}</p><p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{resource.is_published ? 'Publicado y verificado' : 'Borrador / oculto'}{resource.source_url ? ` · ${resource.source_url}` : ''}</p></div><Button size="sm" variant={resource.is_published ? 'outline' : 'warm'} disabled={setResourcePublication.isPending} onClick={() => setResourcePublication.mutate({ resource, publish: !resource.is_published })}>{resource.is_published ? 'Ocultar' : 'Reverificar y publicar'}</Button></article>)}</div>
      </section>}
    </div>
  );
}
