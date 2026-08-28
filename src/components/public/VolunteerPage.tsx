import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Check, HeartHandshake, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { usePublicSettings } from '@/lib/publicSettings';
import { assetUrl } from '@/lib/assets';
import { ResilientImage } from '@/components/ui/ResilientImage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SmartSchedulePicker } from '@/components/ui/SmartSchedulePicker';
import { VolunteerCalendar } from './VolunteerCalendar';
import type { VolunteerArea } from '@/types';

const volunteerSchema = z.object({
  full_name: z.string().min(2, 'Ingresa tu nombre completo'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(7, 'Teléfono de contacto requerido'),
  area_of_interest: z.enum(['dog_walking', 'medical_support', 'events', 'social_media', 'shelter_maintenance', 'foster']),
  availability: z.string().min(3, 'Indica tu disponibilidad de días y horas'),
  experience: z.string().optional(),
});

type VolunteerFormData = z.infer<typeof volunteerSchema>;

const VOLUNTEER_ROLES = [
  { icon: '🐕', title: 'Paseos y compañía', desc: 'Ejercicio, confianza y momentos de calma para nuestros peluditos.', area: 'dog_walking', accent: 'bg-[#ffcf5a]' },
  { icon: '🏥', title: 'Cuidado y salud', desc: 'Apoyo responsable en rutinas de cuidado y bienestar diario.', area: 'medical_support', accent: 'bg-[#d9efdc]' },
  { icon: '🎟️', title: 'Eventos y colectas', desc: 'Haz que la causa llegue a más personas, aliados y comunidades.', area: 'events', accent: 'bg-[#f9dcd5]' },
  { icon: '🏡', title: 'Hogar temporal', desc: 'Abre tu hogar durante una etapa clave de recuperación o crecimiento.', area: 'foster', accent: 'bg-[#cbdcf4]' },
  { icon: '📸', title: 'Historias y difusión', desc: 'Fotografía, video y contenido que ayudan a encontrar familias.', area: 'social_media', accent: 'bg-[#e8dcf4]' },
  { icon: '🛠️', title: 'Refugio y logística', desc: 'Limpieza, reparaciones y organización que mantienen el hogar en marcha.', area: 'shelter_maintenance', accent: 'bg-[#ede5da]' },
] as const;

export function VolunteerPage() {
  const [submitting, setSubmitting] = useState(false);
  const { data: settings } = usePublicSettings(['volunteer_intro']);
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<VolunteerFormData>({
    resolver: zodResolver(volunteerSchema),
    defaultValues: { area_of_interest: 'dog_walking', availability: '' },
  });
  const selectedArea = watch('area_of_interest');
  const selectedRole = VOLUNTEER_ROLES.find((role) => role.area === selectedArea) ?? VOLUNTEER_ROLES[0];

  const chooseRole = (area: VolunteerArea, shouldScroll = false) => {
    setValue('area_of_interest', area, { shouldValidate: true });
    if (shouldScroll) window.setTimeout(() => document.getElementById('volunteer-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  async function onSubmit(data: VolunteerFormData) {
    setSubmitting(true);
    try {
      const { error } = await supabase.from('volunteer_applications').insert([data]);
      if (error) throw error;
      toast.success('¡Solicitud recibida! El equipo la verá en el panel y se pondrá en contacto contigo. 🐾');
      reset({ area_of_interest: 'dog_walking', availability: '', full_name: '', email: '', phone: '', experience: '' });
    } catch {
      toast.error('No pudimos registrar tu solicitud. Intenta nuevamente cuando el sistema esté disponible.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="overflow-hidden bg-[#fffdf9] pt-16 text-[#171717]">
      <section className="relative isolate min-h-[720px] bg-[#171717] text-white">
        <ResilientImage src={assetUrl('/images/shelter_hero_1785817115197.jpg')} alt="Voluntaria compartiendo tiempo con un perro rescatado" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#171717] via-[#171717]/92 to-[#171717]/35" />
        <div className="mx-auto grid min-h-[720px] max-w-7xl items-end gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:px-10 lg:py-24">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }} className="max-w-3xl">
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[.18em] text-[#ff9b87]"><Sparkles className="h-4 w-4" /> Ayudar también deja huella</p>
            <h1 className="mt-6 font-heading text-6xl font-extrabold leading-[.86] tracking-[-.075em] sm:text-7xl lg:text-[6.7rem]">Tu tiempo.<br /><span className="text-[#f0644a]">Su segunda</span><br />oportunidad.</h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/75">{settings?.volunteer_intro?.trim() || 'No necesitas saberlo todo ni disponer de todos los días. Necesitas una forma de ayudar que encaje contigo y compromiso para cumplirla.'}</p>
            <button type="button" onClick={() => document.getElementById('formas-de-ayudar')?.scrollIntoView({ behavior: 'smooth' })} className="mt-9 inline-flex items-center gap-2 rounded-xl bg-[#f0644a] px-6 py-3.5 font-bold transition hover:-translate-y-0.5 hover:bg-[#ff8069]">Encuentra tu forma de ayudar <ArrowRight className="h-4 w-4" /></button>
          </motion.div>
          <div className="grid grid-cols-2 gap-3 lg:justify-self-end">
            <div className="rounded-[1.75rem] border border-white/15 bg-white/10 p-6 backdrop-blur"><Users className="h-6 w-6 text-[#ff9b87]" /><p className="mt-10 font-heading text-3xl font-extrabold">6</p><p className="mt-1 text-sm text-white/65">formas de participar</p></div>
            <div className="mt-10 rounded-[1.75rem] bg-[#ffcf5a] p-6 text-[#171717]"><HeartHandshake className="h-6 w-6" /><p className="mt-10 font-heading text-2xl font-extrabold leading-tight">Cada habilidad puede salvar una historia.</p></div>
          </div>
        </div>
      </section>

      <section id="formas-de-ayudar" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-end">
          <div><p className="text-sm font-bold uppercase tracking-[.16em] text-[#f0644a]">Elige tu lugar</p><h2 className="mt-4 font-heading text-5xl font-extrabold leading-[.94] tracking-[-.06em] sm:text-6xl">Hay más de una forma de estar presente.</h2></div>
          <p className="max-w-xl text-lg leading-relaxed text-[#6e6a64] lg:justify-self-end">Selecciona el área que mejor aprovecha tu tiempo y tus capacidades. Podrás indicar tus horarios exactos antes de enviar la solicitud.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {VOLUNTEER_ROLES.map((role, index) => (
            <motion.button key={role.area} type="button" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .05 }} onClick={() => chooseRole(role.area as VolunteerArea)} aria-pressed={selectedArea === role.area} className={`group relative min-h-64 overflow-hidden rounded-[1.75rem] border p-7 text-left transition hover:-translate-y-1 ${selectedArea === role.area ? 'border-[#171717] ring-2 ring-[#171717]/10' : 'border-[#171717]/10'} ${role.accent}`}>
              <span className="text-4xl" aria-hidden="true">{role.icon}</span>
              <span className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full border border-[#171717]/15 bg-white/50">{selectedArea === role.area ? <Check className="h-4 w-4" /> : <span className="text-xs font-bold">0{index + 1}</span>}</span>
              <div className="absolute inset-x-7 bottom-7"><h3 className="font-heading text-2xl font-extrabold tracking-[-.04em]">{role.title}</h3><p className="mt-2 text-sm leading-relaxed text-[#4f4a45]">{role.desc}</p></div>
            </motion.button>
          ))}
        </div>
        <div className="mt-8 flex justify-center"><button type="button" onClick={() => chooseRole(selectedArea, true)} className="inline-flex items-center gap-2 rounded-xl bg-[#171717] px-6 py-3.5 font-bold text-white hover:bg-[#38332f]">Continuar con {selectedRole.title.toLowerCase()} <ArrowRight className="h-4 w-4" /></button></div>
      </section>

      <section className="bg-[#ede5da] px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="text-sm font-bold uppercase tracking-[.16em] text-[#f0644a]">Agenda abierta</p><h2 className="mt-3 font-heading text-4xl font-extrabold tracking-[-.055em] sm:text-5xl">Pasa de la intención a una fecha real.</h2></div><p className="max-w-md text-sm leading-relaxed text-[#6e6a64]">Las actividades y cupos que ves aquí son publicados por el equipo desde el panel administrativo.</p></div>
          <div className="rounded-[2rem] bg-[#fffdf9] p-4 shadow-[0_20px_60px_rgba(23,23,23,.08)] sm:p-7"><VolunteerCalendar /></div>
        </div>
      </section>

      <section id="volunteer-form" className="scroll-mt-24 bg-[#171717] px-5 py-20 text-white sm:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.78fr_1.22fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-sm font-bold uppercase tracking-[.16em] text-[#ff9b87]">Da el primer paso</p>
            <h2 className="mt-4 font-heading text-5xl font-extrabold leading-[.94] tracking-[-.06em]">Cuéntanos cómo quieres sumar.</h2>
            <p className="mt-5 leading-relaxed text-white/65">Tu solicitud llega directamente al panel del equipo. Allí podrán revisar tu perfil, organizar el contacto y acompañar tu incorporación.</p>
            <div className="mt-8 rounded-[1.5rem] border border-white/15 bg-white/10 p-5"><p className="text-xs font-bold uppercase tracking-[.14em] text-white/50">Área elegida</p><p className="mt-2 font-heading text-2xl font-extrabold">{selectedRole.icon} {selectedRole.title}</p></div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="rounded-[2rem] bg-[#fffdf9] p-6 text-[#171717] shadow-2xl sm:p-9">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="full_name">Nombre completo</Label><Input id="full_name" placeholder="Tu nombre" {...register('full_name')} />{errors.full_name && <p className="text-xs text-red-600">{errors.full_name.message}</p>}</div>
              <div className="space-y-1.5"><Label htmlFor="email">Correo electrónico</Label><Input id="email" type="email" placeholder="tu@email.com" {...register('email')} />{errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}</div>
              <div className="space-y-1.5"><Label htmlFor="phone">Teléfono / WhatsApp</Label><Input id="phone" placeholder="+57 300 000 0000" {...register('phone')} />{errors.phone && <p className="text-xs text-red-600">{errors.phone.message}</p>}</div>
              <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="area_of_interest">Área de interés</Label><select id="area_of_interest" {...register('area_of_interest')} className="flex h-10 w-full rounded-lg border border-[var(--color-input)] bg-white px-3 text-sm">{VOLUNTEER_ROLES.map((role) => <option key={role.area} value={role.area}>{role.icon} {role.title}</option>)}</select></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Disponibilidad y horarios</Label><SmartSchedulePicker onChange={(schedule) => setValue('availability', schedule.summary, { shouldValidate: true })} />{errors.availability && <p className="text-xs text-red-600">{errors.availability.message}</p>}</div>
              <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="experience">Experiencia o habilidades (opcional)</Label><Textarea id="experience" rows={4} placeholder="Cuéntanos sobre mascotas, oficios, fotografía, eventos o cualquier habilidad que quieras aportar…" {...register('experience')} /></div>
            </div>
            <div className="mt-6 rounded-xl bg-[#ede5da] p-4 text-xs leading-relaxed text-[#5f5a54]"><ShieldCheck className="mr-2 inline h-4 w-4 text-[#f0644a]" />Usaremos tus datos únicamente para gestionar tu solicitud de voluntariado.</div>
            <Button type="submit" className="mt-6 w-full bg-[#f0644a] text-white hover:bg-[#e94f3a]" size="lg" disabled={submitting}>{submitting ? 'Enviando…' : 'Enviar mi solicitud'}</Button>
          </form>
        </div>
      </section>

      <section className="px-5 py-18 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 py-16 md:grid-cols-2">
          <Link to="/donaciones" className="group rounded-[1.75rem] bg-[#ffcf5a] p-7"><p className="text-xs font-bold uppercase tracking-[.14em]">Si tienes poco tiempo</p><h3 className="mt-8 font-heading text-3xl font-extrabold">Ayuda con una donación.</h3><span className="mt-5 inline-flex items-center gap-2 font-bold">Ver opciones <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></Link>
          <Link to="/tienda" className="group rounded-[1.75rem] bg-[#f0644a] p-7 text-white"><p className="text-xs font-bold uppercase tracking-[.14em] text-white/65">Si quieres llevar la causa contigo</p><h3 className="mt-8 font-heading text-3xl font-extrabold">Compra con propósito.</h3><span className="mt-5 inline-flex items-center gap-2 font-bold">Visitar la tienda <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></Link>
        </div>
      </section>
    </div>
  );
}
