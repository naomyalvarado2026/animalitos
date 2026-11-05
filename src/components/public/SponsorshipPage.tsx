import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Check, CheckCircle2, Copy, HeartHandshake, RotateCcw, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResilientImage } from '@/components/ui/ResilientImage';
import { Textarea } from '@/components/ui/textarea';
import { REFUGE_DOG_PROFILES } from '@/data/refugeDogProfiles';
import { assetUrl } from '@/lib/assets';
import { useAllDogEditorial } from '@/hooks/useDogEditorial';
import { supabase } from '@/lib/supabase';

const schema = z.object({
  supporter_name: z.string().min(2, 'Ingresa tu nombre'),
  supporter_email: z.string().email('Correo inválido'),
  supporter_phone: z.string().min(7, 'Teléfono requerido'),
  amount_usd: z.string().refine((value) => !value || Number(value) >= 1, 'El aporte debe ser mayor a cero'),
  frequency: z.enum(['once', 'monthly']),
  message: z.string().max(500).optional(),
  consent: z.boolean().refine(Boolean, 'Confirma que podemos contactarte'),
});

type SponsorshipForm = z.infer<typeof schema>;

export interface SponsorshipReceipt {
  reference: string;
  dogSlug: string;
  dogName: string;
  supporterName: string;
  supporterEmail: string;
  amountUSD: number | null;
  frequency: 'once' | 'monthly';
  createdAt: string;
}

export function buildSponsorshipReference(dogName: string, createdAtIso = new Date().toISOString()): string {
  const cleanName = dogName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 4)
    .padEnd(3, 'X');
  const compactDate = createdAtIso.slice(2, 10).replace(/-/g, '');
  const suffix = createdAtIso.slice(-4).replace(/[^0-9A-Z]/gi, '7').toUpperCase();
  return `APA-${cleanName}-${compactDate}-${suffix}`;
}

export function SponsorshipPage() {
  const { slug } = useParams();
  const editorial = useAllDogEditorial();
  const initial = REFUGE_DOG_PROFILES.find((dog) => dog.adoption_slug === slug) || REFUGE_DOG_PROFILES[0];
  const [selectedSlug, setSelectedSlug] = useState(initial.adoption_slug);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<SponsorshipReceipt | null>(null);

  useEffect(() => {
    if (!slug) return;
    const matched = REFUGE_DOG_PROFILES.find((item) => item.adoption_slug === slug);
    if (matched) {
      setSelectedSlug(matched.adoption_slug);
    }
  }, [slug]);

  const dog = REFUGE_DOG_PROFILES.find((item) => item.adoption_slug === selectedSlug) || initial;
  const story = editorial.find((item) => item.slug === dog.adoption_slug);
  const form = useForm<SponsorshipForm>({
    resolver: zodResolver(schema),
    defaultValues: { amount_usd: '', frequency: 'monthly', message: '', consent: false },
  });
  const options = useMemo(
    () => REFUGE_DOG_PROFILES.map((item) => ({ ...item, editorial: editorial.find((entry) => entry.slug === item.adoption_slug) })),
    [editorial],
  );

  const submit = async (data: SponsorshipForm) => {
    setSubmitting(true);
    const amountUSD = data.amount_usd ? Number(data.amount_usd) : null;
    const nowIso = new Date().toISOString();
    let reference = buildSponsorshipReference(dog.name, nowIso);

    try {
      const { data: inquiryId, error: rpcError } = await supabase.rpc('create_sponsorship_inquiry', {
        p_dog_slug: dog.adoption_slug,
        p_supporter_name: data.supporter_name.trim(),
        p_supporter_email: data.supporter_email.trim(),
        p_supporter_phone: data.supporter_phone.trim(),
        p_amount_usd: amountUSD,
        p_frequency: data.frequency,
        p_message: data.message?.trim() || '',
      });

      if (rpcError) {
        const frequencyLabel = data.frequency === 'once' ? 'única vez' : 'mensual';
        const fallbackBody = [
          `[Intención de apadrinamiento ${reference}]`,
          `Perrito: ${dog.name} (${dog.adoption_slug})`,
          `Nombre: ${data.supporter_name.trim()}`,
          `Teléfono / WhatsApp: ${data.supporter_phone.trim()}`,
          `Frecuencia: ${frequencyLabel}`,
          amountUSD ? `Aporte estimado: $${amountUSD} USD` : 'Aporte estimado: Por definir con el equipo',
          data.message?.trim() ? `\nMensaje:\n${data.message.trim()}` : '',
        ]
          .filter(Boolean)
          .join('\n');

        const { error: fallbackError } = await supabase.from('contact_messages').insert([
          {
            name: data.supporter_name.trim(),
            email: data.supporter_email.trim(),
            type: 'support',
            subject: `Apadrinamiento de ${dog.name} (${reference})`,
            message: fallbackBody,
          },
        ]);
        if (fallbackError) throw fallbackError;
      } else {
        if (typeof inquiryId !== 'string' || !inquiryId) {
          throw new Error('No se recibió la referencia del apadrinamiento.');
        }
        reference = inquiryId;
      }

      setReceipt({
        reference,
        dogSlug: dog.adoption_slug,
        dogName: dog.name,
        supporterName: data.supporter_name.trim(),
        supporterEmail: data.supporter_email.trim(),
        amountUSD,
        frequency: data.frequency,
        createdAt: nowIso,
      });
      form.reset({ amount_usd: '', frequency: 'monthly', message: '', consent: false });
      toast.success(`¡Intención de apadrinamiento para ${dog.name} registrada! 🐾`);
    } catch {
      toast.error('No pudimos enviar la solicitud en este momento. Intenta nuevamente en unos segundos.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyReference = async () => {
    if (!receipt) return;
    try {
      await navigator.clipboard.writeText(receipt.reference);
      toast.success('Código de seguimiento copiado.');
    } catch {
      toast.error('No se pudo copiar automáticamente.');
    }
  };

  return (
    <div className="overflow-hidden bg-[var(--color-background)] pt-16 text-[var(--color-foreground)]">
      <section className="bg-[#17022b] px-5 py-16 text-[#faf7fd] sm:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-end">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.18em] text-[#e0beff]">
              <HeartHandshake className="h-4 w-4 text-[#ff8069]" /> Apadrinamiento responsable
            </p>
            <h1 className="mt-5 font-heading text-5xl font-extrabold leading-[.92] tracking-[-.065em] sm:text-6xl lg:text-7xl">
              Acompaña su presente mientras llega su familia.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#f1e2ff]/78 sm:text-lg">
              Elige a un integrante de la manada, cuéntanos cómo quieres ayudar y el equipo confirmará contigo el método, destino y seguimiento del aporte.
            </p>
          </motion.div>
          <div className="rounded-[2rem] border border-white/10 bg-[#3c096c] p-7 text-white shadow-xl">
            <ShieldCheck className="h-8 w-8 text-[#ff8069]" />
            <h2 className="mt-8 font-heading text-3xl font-extrabold">Primero claridad. Después el aporte.</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#f1e2ff]/82">
              Este formulario no realiza ningún cobro ni expone tus datos personales en enlaces. Registra tu intención de forma segura para que el equipo te contacte directamente.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[var(--color-primary)]">01 · Elige a quién acompañar</p>
            <h2 className="mt-2 font-heading text-4xl font-extrabold">La ayuda también puede tener nombre.</h2>
          </div>
          <Link to="/adopta" className="font-bold text-[var(--color-primary)] hover:underline">
            Conocer sus historias →
          </Link>
        </div>
        <div className="-mx-5 mt-8 flex snap-x gap-3 overflow-x-auto px-5 pb-3 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-6 lg:px-0">
          {options.map((item) => (
            <button
              type="button"
              key={item.adoption_slug}
              onClick={() => {
                setSelectedSlug(item.adoption_slug);
                setReceipt(null);
              }}
              aria-pressed={selectedSlug === item.adoption_slug}
              className={`min-w-[9.5rem] snap-start overflow-hidden rounded-[1.25rem] border-2 text-left transition ${
                selectedSlug === item.adoption_slug
                  ? 'border-[#ff8069] shadow-lg ring-2 ring-[#ff8069]/30'
                  : 'border-[var(--color-border)] opacity-75 hover:opacity-100'
              }`}
            >
              <ResilientImage
                src={assetUrl(item.editorial?.cover_image_url || item.main_image_url)}
                alt={item.name}
                className="aspect-square w-full object-cover"
              />
              <span className="block bg-[var(--color-card)] px-3 py-2 font-heading font-extrabold text-[var(--color-foreground)]">
                {item.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--color-border)] bg-[var(--color-muted)]/60 px-5 py-14 sm:px-8 lg:py-20">
        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[2.25rem] border border-[var(--color-border)] bg-[var(--color-card)] shadow-xl lg:grid-cols-[.85fr_1.15fr]">
          <div className="relative min-h-[380px]">
            <ResilientImage
              src={assetUrl(story?.cover_image_url || dog.main_image_url)}
              alt={`${dog.name}, perrito para apadrinar`}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: `${story?.focal_x ?? 50}% ${story?.focal_y ?? 50}%` }}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#17022b]/95 via-[#17022b]/50 to-transparent p-7 pt-24 text-white">
              <p className="text-xs font-bold uppercase tracking-[.15em] text-[#e0beff]">Quiero acompañar a</p>
              <h2 className="mt-2 font-heading text-5xl font-extrabold">{dog.name}</h2>
              <Link to={`/adopta/${dog.adoption_slug}`} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#ff8069] hover:underline">
                Leer la historia completa de {dog.name} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {receipt ? (
            <div className="flex flex-col justify-between p-7 sm:p-10 lg:p-12" role="status" aria-live="polite">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-[.14em] text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" /> Intención de apadrinamiento registrada
                </div>
                <h2 className="mt-4 font-heading text-3xl font-extrabold">
                  ¡Gracias por acompañar a {receipt.dogName}, {receipt.supporterName}!
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                  Tu solicitud quedó registrada directamente en la bandeja del refugio. No necesitas volver a llenar otro formulario.
                </p>

                <div className="mt-6 flex flex-col justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[.14em] text-[var(--color-muted-foreground)]">
                      Código de seguimiento
                    </p>
                    <p className="mt-1 break-all font-mono text-2xl font-extrabold tracking-tight text-[var(--color-primary)]">
                      {receipt.reference}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                      Modalidad: {receipt.frequency === 'monthly' ? 'Mensual' : 'Aporte único'}
                      {receipt.amountUSD ? ` · $${receipt.amountUSD} USD estimados` : ' · Monto por definir con el equipo'}
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={copyReference} className="shrink-0">
                    <Copy className="h-4 w-4" /> Copiar código
                  </Button>
                </div>

                <div className="mt-6 space-y-2.5 rounded-2xl bg-[var(--color-muted)]/60 p-5 text-xs leading-relaxed">
                  <p className="font-bold uppercase tracking-[.12em] text-[var(--color-foreground)]">¿Qué sigue ahora?</p>
                  <p className="text-[var(--color-muted-foreground)]">
                    1. Nuestro equipo revisará tu solicitud y te escribirá por WhatsApp o a <strong>{receipt.supporterEmail}</strong>.
                  </p>
                  <p className="text-[var(--color-muted-foreground)]">
                    2. Te compartiremos los medios oficiales verificados y acordaremos cómo enviarte novedades de {receipt.dogName}.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button type="button" variant="outline" onClick={() => setReceipt(null)}>
                  <RotateCcw className="h-4 w-4" /> Registrar otro apadrinamiento
                </Button>
                <Button variant="warm" className="flex-1" asChild>
                  <Link to={`/adopta/${receipt.dogSlug}`}>
                    Volver a la historia de {receipt.dogName} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(submit)} className="p-7 sm:p-10 lg:p-12">
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[var(--color-primary)]">02 · Cuéntanos cómo</p>
              <h2 className="mt-2 font-heading text-3xl font-extrabold">Tu intención de apadrinamiento</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">{story?.sponsor_focus}</p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="sponsor-name">Nombre completo</Label>
                  <Input id="sponsor-name" placeholder="Tu nombre" {...form.register('supporter_name')} className="mt-1.5" />
                  {form.formState.errors.supporter_name && (
                    <p className="mt-1 text-xs text-[var(--color-destructive)]">{form.formState.errors.supporter_name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="sponsor-email">Correo electrónico</Label>
                  <Input id="sponsor-email" type="email" placeholder="tu@email.com" {...form.register('supporter_email')} className="mt-1.5" />
                  {form.formState.errors.supporter_email && (
                    <p className="mt-1 text-xs text-[var(--color-destructive)]">{form.formState.errors.supporter_email.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="sponsor-phone">WhatsApp / Teléfono</Label>
                  <Input id="sponsor-phone" placeholder="+593 99 999 9999" {...form.register('supporter_phone')} className="mt-1.5" />
                  {form.formState.errors.supporter_phone && (
                    <p className="mt-1 text-xs text-[var(--color-destructive)]">{form.formState.errors.supporter_phone.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="sponsor-amount">Aporte estimado (USD, opcional)</Label>
                  <Input id="sponsor-amount" type="number" min="1" placeholder="Ej. 25" {...form.register('amount_usd')} className="mt-1.5" />
                  {form.formState.errors.amount_usd && (
                    <p className="mt-1 text-xs text-[var(--color-destructive)]">{form.formState.errors.amount_usd.message}</p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="sponsor-frequency">Frecuencia</Label>
                  <select
                    id="sponsor-frequency"
                    {...form.register('frequency')}
                    className="mt-1.5 h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)]"
                  >
                    <option value="monthly">Mensual</option>
                    <option value="once">Una sola vez</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="sponsor-message">Mensaje o pregunta (opcional)</Label>
                  <Textarea
                    id="sponsor-message"
                    rows={3}
                    placeholder={`Cuéntanos si deseas apoyar algo específico para ${dog.name}…`}
                    {...form.register('message')}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <label className="mt-5 flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
                <input type="checkbox" {...form.register('consent')} className="mt-0.5 h-4 w-4 rounded accent-[var(--color-primary)]" />
                <span>
                  Autorizo al equipo de AdoptaME a contactarme para confirmar los detalles. No se realizará ningún cobro automático desde esta página.
                </span>
              </label>
              {form.formState.errors.consent && (
                <p className="mt-1 text-xs text-[var(--color-destructive)]">{form.formState.errors.consent.message}</p>
              )}

              <Button type="submit" variant="warm" size="lg" className="mt-6 w-full" disabled={submitting}>
                {submitting ? (
                  'Registrando intención…'
                ) : (
                  <>
                    Registrar mi apadrinamiento para {dog.name} <ArrowRight />
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-14 sm:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            'El equipo confirma el destino y método del aporte.',
            'Recibes información clara antes de realizar cualquier transferencia.',
            'Puedes seguir conociendo la historia que estás acompañando.',
          ].map((item, index) => (
            <div key={item} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#17022b] font-heading font-extrabold text-[#ff8069]">
                0{index + 1}
              </span>
              <p className="mt-5 text-sm font-semibold leading-relaxed">{item}</p>
              <Check className="mt-4 h-4 w-4 text-[#ff8069]" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
