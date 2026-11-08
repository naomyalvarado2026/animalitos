import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { HeartHandshake, MapPin, Phone, ExternalLink, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CommunityResource {
  id: string;
  category: string;
  name: string;
  city: string;
  description: string;
  eligibility: string | null;
  contact_label: string | null;
  contact_value: string | null;
  website_url: string | null;
  source_url: string | null;
  verified_at: string;
}

const REQUEST_TYPES = [
  { value: 'keep_pet', label: 'Necesito apoyo para cuidar a mi animal' },
  { value: 'lost_pet', label: 'Perdí a mi animal' },
  { value: 'found_pet', label: 'Encontré un animal' },
  { value: 'post_adoption', label: 'Necesito acompañamiento después de adoptar' },
];

const CATEGORY_LABELS: Record<string, string> = {
  food: 'Alimento', veterinary: 'Atención veterinaria', training: 'Conducta y educación',
  municipal: 'Servicios municipales', lost_found: 'Animales perdidos o encontrados', other: 'Otro recurso',
};

export function CommunitySupportPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const resources = useQuery({
    queryKey: ['community-resources-public'],
    queryFn: async () => {
      const { data, error } = await supabase.from('public_community_resources').select('*').order('city').order('category');
      if (error) throw error;
      return (data ?? []) as CommunityResource[];
    },
  });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (form.get('consent') !== 'on') {
      toast.error('Acepta el uso de tus datos antes de enviar la solicitud.');
      return;
    }
    setSubmitting(true);
    const payload = {
      request_type: String(form.get('request_type') ?? ''),
      contact_name: String(form.get('name') ?? '').trim(),
      contact_email: String(form.get('email') ?? '').trim().toLowerCase() || null,
      contact_phone: String(form.get('phone') ?? '').trim(),
      city: String(form.get('city') ?? '').trim(),
      area: String(form.get('area') ?? '').trim() || null,
      animal_name: String(form.get('animal_name') ?? '').trim() || null,
      animal_description: String(form.get('details') ?? '').trim(),
      consent_at: new Date().toISOString(),
    };
    try {
      const { error } = await supabase.from('community_help_requests').insert([payload]);
      if (error) throw error;
      formElement.reset();
      setSubmitted(true);
      toast.success('Recibimos tu solicitud de apoyo.');
    } catch {
      toast.error('No pudimos enviar la solicitud. Intenta otra vez o comunícate por la página de contacto.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pt-16">
      <section className="bg-[#f0644a] px-5 py-20 text-white sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-[.16em] text-white/80">Acompañarnos también es cuidar</p>
          <h1 className="mt-4 max-w-4xl font-heading text-4xl font-extrabold sm:text-6xl">Apoyo para animales y familias.</h1>
          <p className="mt-5 max-w-2xl leading-relaxed text-white/85">Si estás pasando por una dificultad, perdiste un animal o necesitas orientación después de adoptar, cuéntanos cómo podemos ayudarte.</p>
          <div className="mt-7 flex flex-wrap gap-3"><a href="#solicitar-apoyo" className="rounded-full bg-white px-5 py-3 text-sm font-bold text-[#451c16]">Solicitar apoyo</a><Link to="/hogar-temporal" className="rounded-full border border-white/60 px-5 py-3 text-sm font-bold">Ofrecer hogar temporal</Link></div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-widest text-[#f0644a]">Directorio verificado</p><h2 className="mt-2 font-heading text-3xl font-bold">Recursos cercanos</h2><p className="mt-2 max-w-xl text-sm text-[var(--color-muted-foreground)]">Publicamos solo contactos revisados por el equipo. La disponibilidad y condiciones se confirman directamente con cada proveedor.</p></div><Search className="hidden h-8 w-8 text-[#f0644a] sm:block" /></div>
        {resources.isLoading && <p role="status" className="mt-6">Cargando recursos verificados…</p>}
        {resources.error && <div role="alert" className="mt-6 rounded-2xl border border-rose-200 p-4 text-sm">No pudimos cargar el directorio. <Button variant="outline" size="sm" onClick={() => resources.refetch()}>Reintentar</Button></div>}
        {!resources.isLoading && !resources.error && resources.data?.length === 0 && <div className="mt-6 rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-7 text-sm text-[var(--color-muted-foreground)]">El equipo todavía no ha confirmado recursos locales para publicar. Si conoces uno, escríbenos por <Link to="/contacto" className="font-bold text-[#f0644a] underline">contacto</Link> para que podamos verificarlo.</div>}
        <div className="mt-6 grid gap-4 md:grid-cols-2">{resources.data?.map(resource => <article key={resource.id} className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><span className="rounded-full bg-[#fff1ed] px-3 py-1 text-xs font-bold text-[#8d3626]">{CATEGORY_LABELS[resource.category] ?? resource.category}</span><span className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)]"><MapPin size={14} />{resource.city}</span></div>
          <h3 className="mt-4 font-heading text-xl font-bold">{resource.name}</h3><p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">{resource.description}</p>
          {resource.eligibility && <p className="mt-3 text-xs"><strong>Condiciones:</strong> {resource.eligibility}</p>}
          <div className="mt-4 flex flex-wrap gap-3 text-sm">{resource.contact_value && <a className="inline-flex items-center gap-1 font-semibold text-[#f0644a] underline" href={resource.contact_value.match(/^https?:\/\//) ? resource.contact_value : resource.contact_value.includes('@') ? `mailto:${resource.contact_value}` : `tel:${resource.contact_value.replace(/[^+\d]/g, '')}`}><Phone size={14} />{resource.contact_label || resource.contact_value}</a>}{resource.website_url && <a className="inline-flex items-center gap-1 font-semibold text-[#f0644a] underline" href={resource.website_url} target="_blank" rel="noreferrer">Sitio web <ExternalLink size={14} /></a>}</div>
          {resource.source_url && <p className="mt-3 text-[10px] text-[var(--color-muted-foreground)]">Verificado por AdoptaME · <a className="underline" href={resource.source_url} target="_blank" rel="noreferrer">fuente</a></p>}
        </article>)}</div>
      </section>

      <section id="solicitar-apoyo" className="scroll-mt-24 bg-[var(--color-background)] px-5 py-14 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[.75fr_1.25fr]">
          <div><HeartHandshake className="h-8 w-8 text-[#f0644a]" /><h2 className="mt-4 font-heading text-3xl font-bold">Cuéntanos qué necesitas</h2><p className="mt-3 text-sm leading-relaxed text-[var(--color-muted-foreground)]">La solicitud llega al equipo de coordinación para que pueda revisar el caso y registrar el seguimiento. Si existe una emergencia médica, contacta directamente a un centro veterinario.</p></div>
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:p-8">
            {submitted && <p role="status" className="mb-5 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">Tu solicitud quedó registrada para revisión. El envío no confirma asistencia, atención veterinaria ni resolución del caso.</p>}
            <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="help-type">Tipo de solicitud</Label><select id="help-type" name="request_type" required className="h-11 w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-sm">{REQUEST_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}</select></div>
              <div className="space-y-1.5"><Label htmlFor="help-name">Nombre</Label><Input id="help-name" name="name" minLength={2} maxLength={120} required /></div>
              <div className="space-y-1.5"><Label htmlFor="help-phone">Teléfono / WhatsApp</Label><Input id="help-phone" name="phone" type="tel" minLength={7} maxLength={40} required /></div>
              <div className="space-y-1.5"><Label htmlFor="help-email">Correo (opcional)</Label><Input id="help-email" name="email" type="email" /></div>
              <div className="space-y-1.5"><Label htmlFor="help-city">Ciudad</Label><Input id="help-city" name="city" minLength={2} maxLength={100} required /></div>
              <div className="space-y-1.5"><Label htmlFor="help-area">Sector (opcional)</Label><Input id="help-area" name="area" maxLength={100} placeholder="No incluyas dirección exacta" /></div>
              <div className="space-y-1.5"><Label htmlFor="help-animal">Nombre del animal (opcional)</Label><Input id="help-animal" name="animal_name" maxLength={100} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="help-details">Describe la situación</Label><Textarea id="help-details" name="details" minLength={10} maxLength={3000} required rows={5} placeholder="Comparte solo la información necesaria. No incluyas una dirección exacta." /></div>
              <label className="flex items-start gap-2 text-xs leading-relaxed text-[var(--color-muted-foreground)] sm:col-span-2"><input type="checkbox" name="consent" required className="mt-0.5" /><span>Autorizo usar estos datos para revisar y dar seguimiento a mi solicitud. Consulta la <Link to="/privacidad" className="font-bold underline">política de privacidad</Link>.</span></label>
              <Button type="submit" variant="warm" disabled={submitting} className="sm:col-span-2">{submitting ? 'Enviando…' : 'Enviar solicitud de apoyo'}</Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
