import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Check, HeartHandshake, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResilientImage } from '@/components/ui/ResilientImage';
import { Textarea } from '@/components/ui/textarea';
import { REFUGE_DOG_PROFILES } from '@/data/refugeDogProfiles';
import { assetUrl } from '@/lib/assets';
import { saveSponsorshipIntent } from '@/lib/dogEditorialStore';
import { useAllDogEditorial } from '@/hooks/useDogEditorial';

const schema = z.object({ supporter_name: z.string().min(2, 'Ingresa tu nombre'), supporter_email: z.string().email('Correo inválido'), supporter_phone: z.string().min(7, 'Teléfono requerido'), amount_usd: z.string().refine((value) => !value || Number(value) >= 1, 'El aporte debe ser mayor a cero'), frequency: z.enum(['once', 'monthly']), message: z.string().max(500).optional(), consent: z.boolean().refine(Boolean, 'Confirma que podemos contactarte') });
type SponsorshipForm = z.infer<typeof schema>;

export function SponsorshipPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const editorial = useAllDogEditorial();
  const initial = REFUGE_DOG_PROFILES.find((dog) => dog.adoption_slug === slug) || REFUGE_DOG_PROFILES[0];
  const [selectedSlug, setSelectedSlug] = useState(initial.adoption_slug);
  const dog = REFUGE_DOG_PROFILES.find((item) => item.adoption_slug === selectedSlug) || initial;
  const story = editorial.find((item) => item.slug === dog.adoption_slug);
  const form = useForm<SponsorshipForm>({ resolver: zodResolver(schema), defaultValues: { amount_usd: '', frequency: 'monthly', message: '', consent: false } });
  const options = useMemo(() => REFUGE_DOG_PROFILES.map((item) => ({ ...item, editorial: editorial.find((entry) => entry.slug === item.adoption_slug) })), [editorial]);

  const submit = (data: SponsorshipForm) => {
    const amountUSD = data.amount_usd ? Number(data.amount_usd) : null;
    saveSponsorshipIntent({ id: crypto.randomUUID(), dog_slug: dog.adoption_slug, dog_name: dog.name, supporter_name: data.supporter_name, supporter_email: data.supporter_email, supporter_phone: data.supporter_phone, amount_usd: amountUSD, frequency: data.frequency, message: data.message || '', created_at: new Date().toISOString() });
    const params = new URLSearchParams({ apadrina: dog.name, nombre: data.supporter_name, email: data.supporter_email, telefono: data.supporter_phone, frecuencia: data.frequency });
    if (amountUSD) params.set('aporte', String(amountUSD));
    if (data.message) params.set('mensaje', data.message);
    navigate(`/contacto?${params.toString()}`);
  };

  return (
    <div className="overflow-hidden bg-[#fffdf9] pt-16 text-[#171717]">
      <section className="bg-[#171717] px-5 py-20 text-white sm:px-8 lg:py-28"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-end"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.18em] text-[#ffcf5a]"><HeartHandshake className="h-4 w-4" /> Apadrinamiento responsable</p><h1 className="mt-5 font-heading text-6xl font-extrabold leading-[.9] tracking-[-.07em] sm:text-7xl">Acompaña su presente mientras llega su familia.</h1><p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/68">Elige a un integrante de la manada, cuéntanos cómo quieres ayudar y el equipo confirmará contigo el método, destino y seguimiento del aporte.</p></motion.div><div className="rounded-[2rem] bg-[#f0644a] p-7"><ShieldCheck className="h-8 w-8" /><h2 className="mt-12 font-heading text-3xl font-extrabold">Primero claridad. Después el aporte.</h2><p className="mt-4 text-white/80">Este formulario no cobra dinero. Registra tu intención y abre una conversación para entregarte únicamente datos verificados.</p></div></div></section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-24"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#f0644a]">01 · Elige a quién acompañar</p><h2 className="mt-3 font-heading text-4xl font-extrabold">La ayuda también puede tener nombre.</h2></div><Link to="/adopta" className="font-bold text-[#f0644a]">Conocer sus historias →</Link></div><div className="-mx-5 mt-9 flex snap-x gap-3 overflow-x-auto px-5 pb-3 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-6 lg:px-0">{options.map((item) => <button type="button" key={item.adoption_slug} onClick={() => setSelectedSlug(item.adoption_slug)} aria-pressed={selectedSlug === item.adoption_slug} className={`min-w-[9.5rem] snap-start overflow-hidden rounded-[1.25rem] border-2 text-left transition ${selectedSlug === item.adoption_slug ? 'border-[#f0644a] shadow-lg' : 'border-transparent opacity-75 hover:opacity-100'}`}><ResilientImage src={assetUrl(item.editorial?.cover_image_url || item.main_image_url)} alt={item.name} className="aspect-square w-full object-cover" /><span className="block bg-white px-3 py-2 font-heading font-extrabold">{item.name}</span></button>)}</div></section>

      <section className="bg-[#ede5da] px-5 py-16 sm:px-8 lg:py-24"><div className="mx-auto grid max-w-6xl overflow-hidden rounded-[2.25rem] bg-[#fffdf9] shadow-xl lg:grid-cols-[.85fr_1.15fr]"><div className="relative min-h-[420px]"><ResilientImage src={assetUrl(story?.cover_image_url || dog.main_image_url)} alt={`${dog.name}, perrito para apadrinar`} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: `${story?.focal_x ?? 50}% ${story?.focal_y ?? 50}%` }} /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-7 pt-24 text-white"><p className="text-xs font-bold uppercase tracking-[.15em] text-[#ffcf5a]">Quiero acompañar a</p><h2 className="mt-2 font-heading text-5xl font-extrabold">{dog.name}</h2></div></div><form onSubmit={form.handleSubmit(submit)} className="p-7 sm:p-10 lg:p-12"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#f0644a]">02 · Cuéntanos cómo</p><h2 className="mt-3 font-heading text-3xl font-extrabold">Tu intención de apadrinamiento</h2><p className="mt-3 text-sm leading-relaxed text-[#6e6a64]">{story?.sponsor_focus}</p><div className="mt-7 grid gap-4 sm:grid-cols-2"><div><Label htmlFor="sponsor-name">Nombre</Label><Input id="sponsor-name" {...form.register('supporter_name')} className="mt-1.5" />{form.formState.errors.supporter_name && <p className="mt-1 text-xs text-red-600">{form.formState.errors.supporter_name.message}</p>}</div><div><Label htmlFor="sponsor-email">Correo</Label><Input id="sponsor-email" type="email" {...form.register('supporter_email')} className="mt-1.5" />{form.formState.errors.supporter_email && <p className="mt-1 text-xs text-red-600">{form.formState.errors.supporter_email.message}</p>}</div><div><Label htmlFor="sponsor-phone">WhatsApp</Label><Input id="sponsor-phone" {...form.register('supporter_phone')} className="mt-1.5" />{form.formState.errors.supporter_phone && <p className="mt-1 text-xs text-red-600">{form.formState.errors.supporter_phone.message}</p>}</div><div><Label htmlFor="sponsor-amount">Aporte que tienes en mente (USD, opcional)</Label><Input id="sponsor-amount" type="number" min="1" {...form.register('amount_usd')} className="mt-1.5" /></div><div className="sm:col-span-2"><Label htmlFor="sponsor-frequency">Frecuencia</Label><select id="sponsor-frequency" {...form.register('frequency')} className="mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-sm"><option value="monthly">Mensual</option><option value="once">Una sola vez</option></select></div><div className="sm:col-span-2"><Label htmlFor="sponsor-message">Mensaje o pregunta</Label><Textarea id="sponsor-message" rows={3} {...form.register('message')} className="mt-1.5" /></div></div><label className="mt-5 flex items-start gap-3 text-xs leading-relaxed text-[#6e6a64]"><input type="checkbox" {...form.register('consent')} className="mt-0.5 accent-[#f0644a]" /><span>Autorizo al equipo de AdoptaME a contactarme para confirmar los detalles. No se realizará ningún cobro desde esta página.</span></label>{form.formState.errors.consent && <p className="mt-1 text-xs text-red-600">{form.formState.errors.consent.message}</p>}<Button type="submit" variant="warm" size="lg" className="mt-6 w-full">Continuar con el equipo <ArrowRight /></Button></form></div></section>

      <section className="mx-auto max-w-5xl px-5 py-16 sm:px-8"><div className="grid gap-4 md:grid-cols-3">{['El equipo confirma el destino y método del aporte.', 'Recibes información clara antes de realizar cualquier pago.', 'Puedes seguir conociendo la historia que estás acompañando.'].map((item, index) => <div key={item} className="rounded-2xl border border-[#171717]/10 p-5"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ffcf5a] font-heading font-extrabold">0{index + 1}</span><p className="mt-5 text-sm font-semibold leading-relaxed">{item}</p><Check className="mt-4 h-4 w-4 text-[#f0644a]" /></div>)}</div></section>
    </div>
  );
}
