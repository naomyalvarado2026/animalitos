import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Heart, Loader2, PawPrint } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Listing = { id: string; name: string; species: 'dog' | 'cat'; city: string };

export function CommunityAdoptionInterestPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    applicant_name: '',
    applicant_email: '',
    applicant_phone: '',
    city: '',
    housing_type: 'house',
    has_yard: false,
    has_children: false,
    has_other_pets: false,
    other_pets_details: '',
    reason: '',
    consent: false,
  });

  useEffect(() => {
    let active = true;
    void supabase.from('community_adoption_listings')
      .select('id,name,species,city')
      .eq('slug', slug)
      .eq('status', 'published')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) toast.error('No pudimos cargar este anuncio.');
        setListing((data as Listing | null) ?? null);
        setLoading(false);
      });
    return () => { active = false; };
  }, [slug]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!listing || !form.consent) return;
    setSaving(true);
    const { error } = await supabase.from('community_adoption_applications').insert({
      listing_id: listing.id,
      applicant_name: form.applicant_name.trim(),
      applicant_email: form.applicant_email.trim() || null,
      applicant_phone: form.applicant_phone.trim(),
      city: form.city.trim(),
      housing_type: form.housing_type,
      has_yard: form.has_yard,
      has_children: form.has_children,
      has_other_pets: form.has_other_pets,
      other_pets_details: form.has_other_pets ? form.other_pets_details.trim() || null : null,
      reason: form.reason.trim(),
      consent_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      toast.error('No pudimos enviar tu interés. Revisa tu conexión e inténtalo otra vez.');
      return;
    }
    setSubmitted(true);
  }

  if (loading) return <main className="mx-auto max-w-3xl px-5 py-20 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin" /><p className="mt-3 text-sm">Cargando anuncio…</p></main>;
  if (!listing) return <main className="mx-auto max-w-3xl px-5 py-20 text-center"><PawPrint className="mx-auto h-10 w-10 text-[var(--color-primary)]" /><h1 className="mt-4 font-heading text-2xl font-bold">Este anuncio ya no está disponible</h1><Button asChild variant="warm" className="mt-5"><Link to="/comunidad">Ver otros animalitos</Link></Button></main>;
  if (submitted) return <main className="mx-auto max-w-3xl px-5 py-16"><Card><CardContent className="p-8 text-center sm:p-12"><Heart className="mx-auto h-10 w-10 text-[var(--color-primary)]" /><h1 className="mt-4 font-heading text-3xl font-extrabold">¡Gracias por interesarte en {listing.name}!</h1><p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">Naomy recibió tus datos para dar seguimiento. La persona responsable del anuncio podrá contactarte para conversar sobre el hogar que buscas ofrecer.</p><Button variant="warm" className="mt-6" onClick={() => navigate('/comunidad/' + slug)}>Volver al anuncio</Button></CardContent></Card></main>;

  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <Link to={'/comunidad/' + slug} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)]"><ArrowLeft className="h-4 w-4" />Volver a {listing.name}</Link>
      <Card className="mt-5 overflow-hidden">
        <CardHeader className="bg-[var(--color-accent)] p-6 sm:p-8"><span className="text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">Solicitud de adopción comunitaria</span><CardTitle className="mt-2 font-heading text-3xl font-extrabold">Cuéntanos sobre tu hogar</CardTitle><p className="text-sm text-[var(--color-muted-foreground)]">Tu interés por {listing.name} llegará al equipo de AdoptaME para darle seguimiento.</p></CardHeader>
        <CardContent className="p-5 sm:p-8">
          <form onSubmit={(event) => void submit(event)} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="applicant_name">Tu nombre *</Label><Input id="applicant_name" required minLength={2} maxLength={120} value={form.applicant_name} onChange={(event) => update('applicant_name', event.target.value)} autoComplete="name" /></div>
              <div className="space-y-2"><Label htmlFor="applicant_phone">WhatsApp o teléfono *</Label><Input id="applicant_phone" required type="tel" minLength={9} maxLength={20} value={form.applicant_phone} onChange={(event) => update('applicant_phone', event.target.value)} autoComplete="tel" /></div>
              <div className="space-y-2"><Label htmlFor="applicant_email">Correo (opcional)</Label><Input id="applicant_email" type="email" maxLength={200} value={form.applicant_email} onChange={(event) => update('applicant_email', event.target.value)} autoComplete="email" /></div>
              <div className="space-y-2"><Label htmlFor="city">Ciudad *</Label><Input id="city" required maxLength={120} value={form.city} onChange={(event) => update('city', event.target.value)} autoComplete="address-level2" /></div>
              <div className="space-y-2"><Label htmlFor="housing_type">Tipo de vivienda *</Label><select id="housing_type" required value={form.housing_type} onChange={(event) => update('housing_type', event.target.value)} className="h-10 w-full rounded-md border border-[var(--color-input)] bg-background px-3 text-sm"><option value="house">Casa</option><option value="apartment">Departamento</option><option value="other">Otra</option></select></div>
            </div>
            <fieldset className="space-y-3 rounded-xl border border-[var(--color-border)] p-4"><legend className="px-1 text-sm font-semibold">Sobre tu hogar</legend>
              <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.has_yard} onChange={(event) => update('has_yard', event.target.checked)} />Tengo patio o espacio exterior seguro</label>
              <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.has_children} onChange={(event) => update('has_children', event.target.checked)} />Viven niños en casa</label>
              <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.has_other_pets} onChange={(event) => update('has_other_pets', event.target.checked)} />Tengo otros animales</label>
              {form.has_other_pets && <div className="space-y-2"><Label htmlFor="other_pets_details">Cuéntanos sobre ellos</Label><Input id="other_pets_details" maxLength={500} value={form.other_pets_details} onChange={(event) => update('other_pets_details', event.target.value)} /></div>}
            </fieldset>
            <div className="space-y-2"><Label htmlFor="reason">¿Por qué te gustaría darle un hogar? *</Label><Textarea id="reason" required minLength={10} maxLength={1200} rows={4} value={form.reason} onChange={(event) => update('reason', event.target.value)} placeholder="Cuéntanos cómo sería su vida contigo." /></div>
            <label className="flex items-start gap-3 text-sm leading-relaxed"><input className="mt-1" type="checkbox" checked={form.consent} onChange={(event) => update('consent', event.target.checked)} required /><span>Autorizo a AdoptaME a compartir estos datos con la persona responsable del anuncio para coordinar la adopción. Mis datos no se mostrarán en la página pública.</span></label>
            <Button type="submit" variant="warm" size="lg" className="w-full" disabled={saving || !form.consent}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enviar mi interés</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
