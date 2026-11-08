import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { HeartHandshake, Home, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function FosterApplicationPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (form.get('consent') !== 'on') {
      toast.error('Acepta el uso de tus datos antes de enviar la postulación.');
      return;
    }
    setSubmitting(true);
    const payload = {
      applicant_name: String(form.get('name') ?? '').trim(),
      applicant_email: String(form.get('email') ?? '').trim().toLowerCase(),
      applicant_phone: String(form.get('phone') ?? '').trim(),
      city: String(form.get('city') ?? '').trim(),
      area: String(form.get('area') ?? '').trim() || null,
      housing_type: String(form.get('housing_type') ?? ''),
      has_resident_pets: form.get('has_resident_pets') === 'on',
      experience: String(form.get('experience') ?? '').trim(),
      availability: String(form.get('availability') ?? '').trim(),
      animal_preferences: String(form.get('preferences') ?? '').trim() || null,
      consent_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from('foster_applications').insert([payload]);
      if (error) throw error;
      setSubmitted(true);
      formElement.reset();
      toast.success('Recibimos tu postulación de hogar temporal.');
    } catch {
      toast.error('No se pudo enviar la postulación. Intenta nuevamente más tarde.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pt-16">
      <section className="bg-[#281043] px-5 py-20 text-white sm:px-8 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ff806a] text-[#281043]"><Home /></div>
          <p className="text-sm font-bold uppercase tracking-[.16em] text-[#ffb4a6]">Una casa, mientras llega su hogar</p>
          <h1 className="mt-4 max-w-3xl font-heading text-4xl font-extrabold sm:text-6xl">¿Puedes abrirle un espacio temporal?</h1>
          <p className="mt-5 max-w-2xl leading-relaxed text-white/80">Cuéntanos sobre tu hogar y disponibilidad. El equipo revisará tu perfil, explicará el acompañamiento y confirmará cada acogida de forma individual.</p>
          <p className="mt-4 max-w-2xl text-sm text-white/70">Enviar esta postulación no confirma una acogida ni un animal asignado. Por seguridad, solo pedimos ciudad y sector; no envíes tu dirección exacta.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:py-20">
        <aside className="space-y-5">
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
            <HeartHandshake className="h-7 w-7 text-[#f0644a]" />
            <h2 className="mt-4 font-heading text-xl font-bold">Qué viene después</h2>
            <ol className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              <li><strong className="text-[var(--color-foreground)]">1. Revisión:</strong> conoceremos tu disponibilidad y experiencia.</li>
              <li><strong className="text-[var(--color-foreground)]">2. Conversación:</strong> aclararemos cuidados, convivencia y apoyo disponible.</li>
              <li><strong className="text-[var(--color-foreground)]">3. Acuerdo:</strong> solo el equipo confirma un animal y fecha de inicio.</li>
            </ol>
          </div>
          <div className="flex gap-3 rounded-2xl bg-[#fff2ed] p-4 text-sm leading-relaxed text-[#572b23]"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><p>Usaremos los datos solo para evaluar y coordinar la acogida. Revisa la <Link to="/privacidad" className="font-bold underline">política de privacidad</Link>.</p></div>
        </aside>

        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm sm:p-8">
          {submitted && <div role="status" className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">Tu postulación quedó registrada para revisión. El equipo se pondrá en contacto para conversar; todavía no es una asignación de acogida.</div>}
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="foster-name">Nombre completo</Label><Input id="foster-name" name="name" autoComplete="name" minLength={2} maxLength={120} required /></div>
            <div className="space-y-1.5"><Label htmlFor="foster-email">Correo</Label><Input id="foster-email" name="email" type="email" autoComplete="email" required /></div>
            <div className="space-y-1.5"><Label htmlFor="foster-phone">Teléfono / WhatsApp</Label><Input id="foster-phone" name="phone" type="tel" autoComplete="tel" minLength={7} maxLength={40} required /></div>
            <div className="space-y-1.5"><Label htmlFor="foster-city">Ciudad</Label><Input id="foster-city" name="city" autoComplete="address-level2" minLength={2} maxLength={100} required /></div>
            <div className="space-y-1.5"><Label htmlFor="foster-area">Sector (opcional)</Label><Input id="foster-area" name="area" maxLength={100} placeholder="Solo barrio o sector" /></div>
            <div className="space-y-1.5"><Label htmlFor="housing-type">Tipo de vivienda</Label><select id="housing-type" name="housing_type" required className="h-11 w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-sm"><option value="">Selecciona</option><option value="house">Casa</option><option value="apartment">Departamento</option><option value="other">Otra</option></select></div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="has_resident_pets" /> Conviven otros animales en casa</label>
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="foster-experience">Experiencia y espacio disponible</Label><Textarea id="foster-experience" name="experience" minLength={10} maxLength={1500} required rows={4} placeholder="Cuéntanos cómo sería la rutina y qué apoyo necesitarías." /></div>
            <div className="space-y-1.5"><Label htmlFor="foster-availability">Disponibilidad</Label><Input id="foster-availability" name="availability" minLength={3} maxLength={300} required placeholder="Desde cuándo y por cuánto tiempo" /></div>
            <div className="space-y-1.5"><Label htmlFor="foster-preferences">Preferencias o límites (opcional)</Label><Input id="foster-preferences" name="preferences" maxLength={500} placeholder="Tamaño, edad u otras consideraciones" /></div>
            <label className="flex items-start gap-2 text-xs leading-relaxed text-[var(--color-muted-foreground)] sm:col-span-2"><input type="checkbox" name="consent" required className="mt-0.5" /><span>Autorizo usar estos datos para evaluar y coordinar una posible acogida temporal.</span></label>
            <Button type="submit" variant="warm" disabled={submitting} className="sm:col-span-2">{submitting ? 'Enviando…' : 'Enviar postulación de hogar temporal'}</Button>
          </form>
        </div>
      </section>
    </div>
  );
}
