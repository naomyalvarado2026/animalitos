import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, CheckCircle2, Copy, Heart, PawPrint, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { AccessibleDialog } from '@/components/ui/AccessibleDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResilientImage } from '@/components/ui/ResilientImage';
import { Textarea } from '@/components/ui/textarea';
import { assetUrl } from '@/lib/assets';
import { isLocalRefugeDog } from '@/lib/refugeDogs';
import { supabase } from '@/lib/supabase';
import { trackAnimalEvent } from '@/lib/analytics';
import type { Animal } from '@/types';

const adoptionSchema = z.object({
  applicant_name: z.string().trim().min(2, 'Ingresa tu nombre completo (mínimo 2 caracteres)').max(120),
  applicant_email: z.string().trim().email('Ingresa un correo electrónico válido'),
  applicant_phone: z.string().trim().min(7, 'Ingresa un teléfono o WhatsApp válido').max(40),
  applicant_address: z.string().trim().min(5, 'Ingresa tu ciudad y sector de residencia').max(200),
  housing_type: z.enum(['house', 'apartment', 'farm']).optional(),
  has_yard: z.boolean().optional(),
  has_children: z.boolean().optional(),
  has_other_pets: z.boolean().optional(),
  other_pets_desc: z.string().max(400).optional(),
  preferred_contact_window: z.enum(['morning', 'afternoon', 'evening', 'flexible']).optional(),
  reason: z.string().trim().max(1500).optional(),
  consent: z.boolean().refine(Boolean, 'Confirma que podemos contactarte para dar seguimiento'),
  post_adoption_follow_up_consent: z.boolean().optional(),
});

export type AdoptionRequestFormData = z.infer<typeof adoptionSchema>;

export interface AdoptionReceipt {
  reference: string;
  animalName: string;
  animalSlug: string;
  applicantName: string;
  applicantEmail: string;
  createdAt: string;
  channel: 'adoption_applications' | 'contact_messages';
}

const ADOPTION_RECEIPTS_KEY = 'animalitos_adoption_receipts_v1';

const housingLabels = {
  house: 'Casa',
  apartment: 'Departamento',
  farm: 'Finca / Casa de campo',
} as const;

export function buildAdoptionReference(dogName: string, seed = Date.now().toString(36)): string {
  const prefix = (dogName || 'PER')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, 'X');
  const suffix = seed.slice(-5).toUpperCase();
  return `ADO-${prefix}-${suffix}`;
}

export function formatAdoptionContactMessage(animal: Pick<Animal, 'name' | 'adoption_slug'>, data: AdoptionRequestFormData, reference: string): string {
  const lines = [
    `Solicitud de adopción responsable para ${animal.name} (${reference})`,
    `• Solicitante: ${data.applicant_name.trim()}`,
    `• Teléfono / WhatsApp: ${data.applicant_phone.trim()}`,
    `• Correo: ${data.applicant_email.trim().toLowerCase()}`,
    `• Residencia: ${data.applicant_address.trim()}`,
    ...(data.housing_type ? [`• Vivienda: ${housingLabels[data.housing_type]}${data.has_yard === undefined ? '' : ` (${data.has_yard ? 'con patio/jardín cercado' : 'sin patio cercado'})`}`] : []),
    ...(data.has_children !== undefined || data.has_other_pets !== undefined
      ? [`• Convivencia: ${data.has_children === undefined ? 'por conversar' : data.has_children ? 'convive con niños' : 'solo adultos'} · ${data.has_other_pets === undefined ? 'otras mascotas por conversar' : data.has_other_pets ? `con otras mascotas (${data.other_pets_desc?.trim() || 'sí'})` : 'sin otras mascotas'}`]
      : []),
    ...(data.preferred_contact_window ? [`• Horario preferido: ${data.preferred_contact_window}`] : []),
    '',
    ...(data.reason?.trim() ? ['Motivo y rutina ofrecida:', data.reason.trim()] : []),
  ];
  return lines.join('\n');
}

function saveLocalAdoptionReceipt(receipt: AdoptionReceipt): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(ADOPTION_RECEIPTS_KEY);
    const existing: unknown = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(existing) ? existing : [];
    window.localStorage.setItem(ADOPTION_RECEIPTS_KEY, JSON.stringify([receipt, ...list].slice(0, 50)));
  } catch {
    // Ignore storage quota errors
  }
}

function getDogImage(animal: Animal): string {
  if (animal.main_image_url) return assetUrl(animal.main_image_url);
  if (animal.gallery_urls && animal.gallery_urls.length > 0) return assetUrl(animal.gallery_urls[0]);
  return assetUrl('/images/dog_max.jpg');
}

export function AdoptionRequestDialog({
  animal,
  open,
  onClose,
}: {
  animal: Animal | null;
  open: boolean;
  onClose: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<AdoptionReceipt | null>(null);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    trigger,
    setError,
  } = useForm<AdoptionRequestFormData>({
    resolver: zodResolver(adoptionSchema),
    defaultValues: {
      consent: false,
      post_adoption_follow_up_consent: false,
    },
  });

  const hasOtherPets = watch('has_other_pets');
  const formCapabilitiesQuery = useQuery({
    queryKey: ['adoption-form-capabilities'],
    enabled: open && Boolean(animal) && !isLocalRefugeDog(animal!),
    retry: false,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('adoption_form_supports_optional_details', {}, { get: true });
      return !error && data === true;
    },
  });
  const optionalDetailsEnabled = animal ? isLocalRefugeDog(animal) || formCapabilitiesQuery.data === true : false;
  const capabilitiesPending = Boolean(animal && !isLocalRefugeDog(animal) && formCapabilitiesQuery.isLoading);

  if (!animal) return null;

  const handleDialogClose = () => {
    if (submitting) return;
    setReceipt(null);
    setCopied(false);
    setStep(1);
    reset();
    onClose();
  };

  const copyReference = async (refCode: string) => {
    try {
      await navigator.clipboard.writeText(refCode);
      setCopied(true);
      toast.success('Código de referencia copiado.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No pudimos copiar el código automáticamente.');
    }
  };

  async function onSubmit(data: AdoptionRequestFormData) {
    if (!animal || submitting) return;
    if (!isLocalRefugeDog(animal) && !optionalDetailsEnabled) {
      let missingDetails = false;
      if (!data.housing_type) { setError('housing_type', { type: 'required', message: 'Por ahora necesitamos conocer tu tipo de vivienda' }); missingDetails = true; }
      if (data.has_yard === undefined) { setError('has_yard', { type: 'required', message: 'Indica si tienes patio o prefieres conversarlo con el equipo' }); missingDetails = true; }
      if (data.has_children === undefined) { setError('has_children', { type: 'required', message: 'Indica si viven niños en casa o prefieres conversarlo' }); missingDetails = true; }
      if (data.has_other_pets === undefined) { setError('has_other_pets', { type: 'required', message: 'Indica si convives con otras mascotas o prefieres conversarlo' }); missingDetails = true; }
      if (!data.reason?.trim() || data.reason.trim().length < 15) { setError('reason', { type: 'required', message: 'Cuéntanos brevemente sobre el hogar que ofreces (mínimo 15 caracteres)' }); missingDetails = true; }
      if (missingDetails) {
        toast.error('Por ahora completa vivienda, convivencia y un breve comentario para registrar tu interés.');
        return;
      }
    }
    setSubmitting(true);
    const reference = buildAdoptionReference(animal.name);
    const nowIso = new Date().toISOString();
    const slug = animal.adoption_slug || animal.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    try {
      let channel: AdoptionReceipt['channel'] = 'adoption_applications';

      if (!isLocalRefugeDog(animal)) {
        const application = {
          animal_id: animal.id,
          applicant_name: data.applicant_name.trim(),
          applicant_email: data.applicant_email.trim().toLowerCase(),
          applicant_phone: data.applicant_phone.trim(),
          applicant_address: data.applicant_address.trim(),
          housing_type: data.housing_type ?? null,
          has_yard: data.has_yard ?? null,
          has_children: data.has_children ?? null,
          has_other_pets: data.has_other_pets ?? null,
          other_pets_desc: data.has_other_pets ? data.other_pets_desc?.trim() || null : null,
          reason: data.reason?.trim() ? `[Ref: ${reference}] ${data.reason.trim()}` : null,
          consent_at: nowIso,
          post_adoption_follow_up_consent: data.post_adoption_follow_up_consent ?? false,
        };
        if (optionalDetailsEnabled) Object.assign(application, { preferred_contact_window: data.preferred_contact_window ?? null });
        const { error } = await supabase.from('adoption_applications').insert([
          application,
        ]);
        if (error) throw error;
      } else {
        channel = 'contact_messages';
        const { error } = await supabase.from('contact_messages').insert([
          {
            name: data.applicant_name.trim(),
            email: data.applicant_email.trim().toLowerCase(),
            type: 'support',
            subject: `[Adopción ${reference}] Quiero conocer a ${animal.name}`,
            message: formatAdoptionContactMessage(animal, data, reference),
            consent_at: nowIso,
            source: 'adoption_modal',
            animal_slug: slug,
            post_adoption_follow_up_consent: data.post_adoption_follow_up_consent ?? false,
          },
        ]);
        if (error) throw error;
      }

      trackAnimalEvent('adoption_submit', slug);
      const savedReceipt: AdoptionReceipt = {
        reference,
        animalName: animal.name,
        animalSlug: slug,
        applicantName: data.applicant_name.trim(),
        applicantEmail: data.applicant_email.trim().toLowerCase(),
        createdAt: nowIso,
        channel,
      };
      saveLocalAdoptionReceipt(savedReceipt);
      setReceipt(savedReceipt);
      reset();
      setStep(1);
      toast.success(`Solicitud registrada para ${animal.name} (${reference}).`);
    } catch (err) {
      const msg = err instanceof Error && /solicitud activa/i.test(err.message)
        ? 'Ya tenemos una solicitud activa con este correo para este perrito.'
        : 'No pudimos registrar tu solicitud en este momento. Revisa tu conexión e inténtalo nuevamente.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === 1) {
      const valid = await trigger(['applicant_name', 'applicant_email', 'applicant_phone', 'applicant_address', 'consent']);
      if (valid) setStep(2);
      return;
    }
    await handleSubmit(onSubmit)(event);
  }

  return (
    <AccessibleDialog
      open={open}
      onClose={handleDialogClose}
      title={receipt ? `Solicitud recibida · ${animal.name}` : `Quiero conocer a ${animal.name}`}
    >
      {receipt ? (
        <div className="space-y-6 p-6 sm:p-8">
          <div className="rounded-2xl bg-[#17022b] p-6 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ff8069] text-[#17022b]">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[.15em] text-[#e0beff]">Paso 1 completado</p>
                <h3 className="font-heading text-2xl font-extrabold">Recibimos tu interés por {receipt.animalName}</h3>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/75">
              Conserva tu código de referencia. Nuestro equipo revisará la compatibilidad de tu hogar con las necesidades de {receipt.animalName} y te contactará al correo o WhatsApp indicado.
            </p>
            <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-[.14em] text-[#e0beff]">Código de seguimiento</span>
                <span className="font-mono text-lg font-extrabold tracking-wider text-white">{receipt.reference}</span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void copyReference(receipt.reference)}
                className="border-white/25 text-white hover:bg-white/15"
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5">
            <p className="text-xs font-extrabold uppercase tracking-[.14em] text-[var(--color-primary)]">¿Qué sigue ahora?</p>
            <ol className="space-y-2.5 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-secondary)] font-bold text-[var(--color-primary)]">1</span>
                <span><strong className="text-[var(--color-foreground)]">Revisión responsable:</strong> verificamos convivencia, espacio y cuidados específicos de {receipt.animalName}.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-secondary)] font-bold text-[var(--color-primary)]">2</span>
                <span><strong className="text-[var(--color-foreground)]">Primer contacto:</strong> te escribiremos para conversar dudas y confirmar horarios.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-secondary)] font-bold text-[var(--color-primary)]">3</span>
                <span><strong className="text-[var(--color-foreground)]">Encuentro en el refugio:</strong> coordinamos una visita con cita previa para que se conozcan con calma.</span>
              </li>
            </ol>
          </div>

          <p className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
            Enviar esta solicitud no compromete ni garantiza una adopción automática; nuestro objetivo es cuidar el bienestar de {receipt.animalName} y de tu familia.
          </p>

          <div className="flex justify-end">
            <Button type="button" variant="warm" onClick={handleDialogClose}>
              Entendido, volver a la manada
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-4 bg-[#17022b] px-6 py-5 text-white sm:px-7">
            <ResilientImage
              src={getDogImage(animal)}
              alt={animal.name || 'Perrito'}
              className="h-16 w-16 shrink-0 rounded-2xl border-2 border-[#e0beff]/30 object-cover"
            />
            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.15em] text-[#ff8069]">
                <PawPrint className="h-3.5 w-3.5" /> Primer paso · Adopción responsable
              </p>
              <p className="mt-1 font-heading text-xl font-extrabold">{animal.name}</p>
              <p className="mt-0.5 text-xs text-white/75">
                {animal.ideal_home
                  ? `Hogar sugerido: ${animal.ideal_home}`
                  : 'Queremos conocer tu rutina y espacio para acompañarte en un match seguro.'}
              </p>
            </div>
          </div>

          <form onSubmit={(event) => void submitStep(event)} className="space-y-4 p-5 sm:p-7" noValidate>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--color-secondary)]/40 px-4 py-3 text-xs">
              <span className={`font-bold ${step === 1 ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted-foreground)]'}`}>1 · Contacto</span>
              <span className="h-px flex-1 bg-[var(--color-border)]" aria-hidden="true" />
              <span className={`font-bold ${step === 2 ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted-foreground)]'}`}>2 · Tu hogar ({!isLocalRefugeDog(animal) && !optionalDetailsEnabled ? 'por ahora requerido' : 'opcional'})</span>
            </div>
            {step === 1 && <>
            <div className="space-y-1.5">
              <Label htmlFor="applicant_name">Nombre completo *</Label>
              <Input
                id="applicant_name"
                data-dialog-autofocus
                placeholder="Tu nombre y apellidos"
                autoComplete="name"
                {...register('applicant_name')}
              />
              {errors.applicant_name && <p className="text-xs text-[var(--color-destructive)]">{errors.applicant_name.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="applicant_email">Correo electrónico *</Label>
                <Input id="applicant_email" type="email" placeholder="tu@email.com" autoComplete="email" {...register('applicant_email')} />
                {errors.applicant_email && <p className="text-xs text-[var(--color-destructive)]">{errors.applicant_email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="applicant_phone">Teléfono / WhatsApp *</Label>
                <Input id="applicant_phone" type="tel" placeholder="+593 99 000 0000" autoComplete="tel" {...register('applicant_phone')} />
                {errors.applicant_phone && <p className="text-xs text-[var(--color-destructive)]">{errors.applicant_phone.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="applicant_address">Ciudad y sector de residencia *</Label>
              <Input id="applicant_address" placeholder="Ej. Milagro, sector centro..." autoComplete="address-level2" {...register('applicant_address')} />
              {errors.applicant_address && <p className="text-xs text-[var(--color-destructive)]">{errors.applicant_address.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
                <input type="checkbox" {...register('consent')} className="mt-0.5 h-4 w-4 rounded accent-[var(--color-primary)]" />
                <span>Autorizo a AdoptaME a contactarme sobre este interés. Entiendo que el proceso es responsable y no garantiza una adopción. <a href={`${import.meta.env.BASE_URL}privacidad/`} target="_blank" rel="noreferrer" className="font-semibold text-[var(--color-primary)] underline">Privacidad</a>.</span>
              </label>
              {errors.consent && <p className="text-xs text-[var(--color-destructive)]">{errors.consent.message}</p>}
            </div>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-[var(--color-border)] p-3 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
              <input type="checkbox" {...register('post_adoption_follow_up_consent')} className="mt-0.5 h-4 w-4 rounded accent-[var(--color-primary)]" />
              <span><strong className="text-[var(--color-foreground)]">Opcional:</strong> acepto recibir un breve seguimiento si la adopción se concreta, para conversar sobre adaptación o dudas. Puede ser a los 2, 10 y 45 días, con un contacto opcional a los 90 días. Esta autorización no influye en la evaluación.</span>
            </label>
            </>}

            {step === 2 && <>
            <div className="rounded-xl border border-[var(--color-border)] p-3 text-xs leading-relaxed text-[var(--color-muted-foreground)]">{isLocalRefugeDog(animal) || optionalDetailsEnabled ? 'Este paso es opcional. Puedes contarnos estos detalles ahora o conversar sobre ellos con el equipo después.' : capabilitiesPending ? 'Estamos preparando el formulario de contacto seguro…' : 'Por ahora el sistema requiere respuestas de vivienda y convivencia y un comentario breve para registrar la solicitud. Puedes ampliar otros detalles con el equipo después.'}</div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="housing_type">Tipo de vivienda</Label>
                <select
                  id="housing_type"
                  {...register('housing_type', { setValueAs: (value) => value === '' ? undefined : value })}
                  className="flex h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 py-1 text-sm shadow-xs"
                >
                  <option value="">{!isLocalRefugeDog(animal) && !optionalDetailsEnabled ? 'Selecciona una opción' : 'Prefiero conversar primero'}</option>
                  <option value="house">Casa</option>
                  <option value="apartment">Departamento</option>
                  <option value="farm">Finca / Casa de campo</option>
                </select>
                {errors.housing_type && <p className="text-xs text-[var(--color-destructive)]">{errors.housing_type.message}</p>}
              </div>
            </div>

            <fieldset className="space-y-2.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
              <legend className="px-1 text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">Sobre tu hogar y convivencia</legend>
              <label className="grid gap-1.5 text-xs font-medium sm:grid-cols-[1fr_12rem] sm:items-center">
                <span>¿Tienes patio o jardín cercado?</span>
                <select {...register('has_yard', { setValueAs: (value) => value === '' ? undefined : value === 'true' })} className="h-9 rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-2">
                  <option value="">{!isLocalRefugeDog(animal) && !optionalDetailsEnabled ? 'Selecciona una opción' : 'Prefiero conversar'}</option><option value="true">Sí</option><option value="false">No</option>
                </select>
                {errors.has_yard && <p className="text-xs text-[var(--color-destructive)] sm:col-span-2">{errors.has_yard.message}</p>}
              </label>
              <label className="grid gap-1.5 text-xs font-medium sm:grid-cols-[1fr_12rem] sm:items-center">
                <span>¿Viven niños pequeños en casa?</span>
                <select {...register('has_children', { setValueAs: (value) => value === '' ? undefined : value === 'true' })} className="h-9 rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-2">
                  <option value="">{!isLocalRefugeDog(animal) && !optionalDetailsEnabled ? 'Selecciona una opción' : 'Prefiero conversar'}</option><option value="true">Sí</option><option value="false">No</option>
                </select>
                {errors.has_children && <p className="text-xs text-[var(--color-destructive)] sm:col-span-2">{errors.has_children.message}</p>}
              </label>
              <label className="grid gap-1.5 text-xs font-medium sm:grid-cols-[1fr_12rem] sm:items-center">
                <span>¿Convives con otras mascotas?</span>
                <select {...register('has_other_pets', { setValueAs: (value) => value === '' ? undefined : value === 'true' })} className="h-9 rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-2">
                  <option value="">{!isLocalRefugeDog(animal) && !optionalDetailsEnabled ? 'Selecciona una opción' : 'Prefiero conversar'}</option><option value="true">Sí</option><option value="false">No</option>
                </select>
                {errors.has_other_pets && <p className="text-xs text-[var(--color-destructive)] sm:col-span-2">{errors.has_other_pets.message}</p>}
              </label>
              {hasOtherPets && (
                <div className="pt-2">
                  <Label htmlFor="other_pets_desc" className="text-xs">Cuéntanos cuáles y su carácter</Label>
                  <Input
                    id="other_pets_desc"
                    className="mt-1"
                    placeholder="Ej. Una perrita mediana tranquila y un gato adulto"
                    {...register('other_pets_desc')}
                  />
                </div>
              )}
            </fieldset>

            {(isLocalRefugeDog(animal) || optionalDetailsEnabled) && <div className="space-y-1.5">
              <Label htmlFor="preferred_contact_window">¿Cuándo prefieres que te contactemos?</Label>
              <select id="preferred_contact_window" {...register('preferred_contact_window', { setValueAs: (value) => value === '' ? undefined : value })} className="flex h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 py-1 text-sm shadow-xs">
                <option value="">Sin preferencia</option>
                <option value="morning">Mañana</option>
                <option value="afternoon">Tarde</option>
                <option value="evening">Noche</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>}

            <div className="space-y-1.5">
              <Label htmlFor="reason">¿Cómo sería el día a día de {animal.name} contigo? (opcional)</Label>
              <Textarea
                id="reason"
                rows={3}
                placeholder="Cuéntanos sobre tu rutina, tiempos de paseo y por qué te gustaría conocer a este integrante de la manada..."
                {...register('reason')}
              />
              {errors.reason && <p className="text-xs text-[var(--color-destructive)]">{errors.reason.message}</p>}
            </div>
            </>}

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={handleDialogClose} disabled={submitting}>
                Cancelar
              </Button>
              {step === 2 && <Button type="button" variant="outline" onClick={() => setStep(1)}>Volver al contacto</Button>}
              <Button type="submit" variant="warm" size="lg" disabled={submitting || (step === 2 && capabilitiesPending)}>
                {step === 1 ? <>Continuar <ArrowRight className="h-4 w-4" /></> : <><Heart className="h-4 w-4" /> {capabilitiesPending ? 'Verificando formulario…' : submitting ? 'Registrando interés…' : <>Enviar interés por {animal.name} <ArrowRight className="h-4 w-4" /></>}</>}
              </Button>
            </div>
          </form>
        </div>
      )}
    </AccessibleDialog>
  );
}
