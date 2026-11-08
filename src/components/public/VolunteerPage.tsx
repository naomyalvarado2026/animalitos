import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Heart,
  HeartHandshake,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Users,
  Compass,
  Calendar,
  Clock,
  BookOpen,
  Share2,
} from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { VolunteerAvailabilityPicker } from './VolunteerAvailabilityPicker';
import { VolunteerCalendar } from './VolunteerCalendar';
import { ContextualFaq } from './ContextualFaq';
import { DogStoryMoment } from './DogStoryMoment';
import { VolunteerMatchmaker } from './VolunteerMatchmaker';
import { VolunteerRoleDetailModal } from './VolunteerRoleDetailModal';
import { VolunteerImpactCalculator } from './VolunteerImpactCalculator';
import { VolunteerJourneyRoadmap } from './VolunteerJourneyRoadmap';
import { VolunteerManifesto } from './VolunteerManifesto';
import { VolunteerWelcomeGuideModal } from './VolunteerWelcomeGuideModal';
import { VolunteerTestimonials } from './VolunteerTestimonials';
import { VOLUNTEER_ROLES_DETAILED, type VolunteerRoleDetail } from '@/data/volunteerRoles';
import type { VolunteerArea } from '@/types';

const volunteerSchema = z.object({
  full_name: z.string().min(2, 'Ingresa tu nombre completo').max(120, 'Máximo 120 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(7, 'Teléfono de contacto requerido').max(40, 'Máximo 40 caracteres'),
  area_of_interest: z.enum(['dog_walking', 'medical_support', 'events', 'social_media', 'shelter_maintenance', 'foster']),
  availability: z.string().min(3, 'Indica tu disponibilidad de días y horas'),
  experience: z.string().optional(),
  pledge: z.boolean().refine((val) => val === true, 'Confirma tu compromiso de trato respetuoso con los perros'),
});

type VolunteerFormData = z.infer<typeof volunteerSchema>;

const SKILL_OPTIONS = [
  '🐕 Manejo canino / Paseos',
  '📸 Fotografía / Video',
  '🚗 Auto propio / Transporte',
  '🩺 Salud / Primeros auxilios',
  '🎨 Diseño / Redes sociales',
  '🛠️ Carpintería / Reparaciones',
  '🎟️ Ferias y eventos',
  '🏡 Espacio para hogar temporal',
];

export function VolunteerPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<{ name: string; roleTitle: string; availability: string } | null>(null);
  const [availabilityPickerKey, setAvailabilityPickerKey] = useState(0);
  const [inspectingRole, setInspectingRole] = useState<VolunteerRoleDetail | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const { data: settings } = usePublicSettings(['volunteer_intro']);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<VolunteerFormData>({
    resolver: zodResolver(volunteerSchema),
    defaultValues: {
      area_of_interest: 'dog_walking',
      availability: '',
      pledge: true,
    },
  });

  const selectedArea = watch('area_of_interest');
  const selectedRole = VOLUNTEER_ROLES_DETAILED.find((role) => role.id === selectedArea) ?? VOLUNTEER_ROLES_DETAILED[0];

  const chooseRole = (area: VolunteerArea, shouldScroll = false) => {
    setValue('area_of_interest', area, { shouldValidate: true });
    if (shouldScroll) {
      window.setTimeout(() => {
        document.getElementById('volunteer-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  async function onSubmit(data: VolunteerFormData) {
    setSubmitting(true);
    try {
      const skillsSection = selectedSkills.length > 0 ? `Habilidades marcadas: ${selectedSkills.join(', ')}` : '';
      const notesSection = data.experience?.trim() || '';
      const combinedExperience = [skillsSection, notesSection].filter(Boolean).join('\n\n') || null;

      const payload = {
        full_name: data.full_name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        area_of_interest: data.area_of_interest,
        availability: data.availability.trim(),
        experience: combinedExperience,
      };

      const { error } = await supabase.from('volunteer_applications').insert([payload]);
      if (error) throw error;

      setSubmittedData({
        name: data.full_name.trim(),
        roleTitle: selectedRole.title,
        availability: data.availability,
      });

      toast.success('¡Solicitud recibida! El equipo de AdoptaME se pondrá en contacto contigo muy pronto. 🐾');
    } catch {
      toast.error('No pudimos registrar tu solicitud. Por favor intenta nuevamente o contáctanos por WhatsApp.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleResetForm() {
    setSubmittedData(null);
    setSelectedSkills([]);
    reset({
      full_name: '',
      email: '',
      phone: '',
      area_of_interest: 'dog_walking',
      availability: '',
      experience: '',
      pledge: true,
    });
    setAvailabilityPickerKey((k) => k + 1);
  }

  function handleShareVolunteering() {
    const text = encodeURIComponent(
      '¡Me acabo de postular como voluntario en AdoptaME! 🐾 Compartir un par de horas al mes transforma la vida de 12 perritos rescatados. Súmate tú también: https://naomyalvarado2026.github.io/animalitos/voluntariado'
    );
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  }

  const canonicalUrl = 'https://naomyalvarado2026.github.io/animalitos/voluntariado/';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'VolunteerAction',
    name: 'Voluntariado en Refugio de Perros AdoptaME',
    description: 'Programa de voluntariado para rescate, paseo, socialización y bienestar de 12 perros rescatados.',
    url: canonicalUrl,
    agent: {
      '@type': 'Organization',
      name: 'AdoptaME',
      url: 'https://naomyalvarado2026.github.io/animalitos/',
      logo: 'https://naomyalvarado2026.github.io/animalitos/brand/logo-color.webp',
    },
    location: {
      '@type': 'Place',
      name: 'Refugio Principal AdoptaME',
    },
  };

  return (
    <div className="overflow-hidden bg-[#fffdf9] pt-16 text-[#171717]">
      {/* ── SEO & Structured Data ── */}
      <Helmet>
        <title>Voluntariado | AdoptaME — Tu tiempo, su segunda oportunidad</title>
        <meta
          name="description"
          content="Súmate como voluntario en AdoptaME. Paseos, cuidados veterinarios, fotografía, eventos y hogares temporales para 12 perros rescatados. Descubre tu rol ideal."
        />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content="Voluntariado | AdoptaME — Tu tiempo, su segunda oportunidad" />
        <meta
          property="og:description"
          content="Cada habilidad puede salvar una historia. Conoce las 6 formas de participar en el refugio canino AdoptaME."
        />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta
          property="og:image"
          content="https://naomyalvarado2026.github.io/animalitos/images/shelter_hero_1785817115197.jpg"
        />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      {/* ── Hero Section ── */}
      <section className="relative isolate min-h-[720px] bg-[#171717] text-white">
        <ResilientImage
          src={assetUrl('/images/shelter_hero_1785817115197.jpg')}
          alt="Voluntaria compartiendo un momento de cariño con un perro rescatado"
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#171717] via-[#171717]/90 to-[#171717]/40" />

        <div className="mx-auto grid min-h-[720px] max-w-7xl items-end gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:px-10 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-[.18em] text-[#ff9b87]">
              <Sparkles className="h-3.5 w-3.5" /> Convocatoria Abierta · Todo aporte cuenta
            </div>

            <h1 className="mt-6 font-heading text-6xl font-extrabold leading-[.88] tracking-[-.075em] sm:text-7xl lg:text-[6.5rem]">
              Tu tiempo.
              <br />
              <span className="text-[#f0644a]">Su segunda</span>
              <br />
              oportunidad.
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/80">
              {settings?.volunteer_intro?.trim() ||
                'No necesitas saberlo todo ni disponer de todos los días. Necesitas una forma de ayudar que encaje contigo y el compromiso de regalarles momentos de amor.'}
            </p>

            {/* Quick Action Navigation */}
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => document.getElementById('test-rol')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 rounded-xl bg-[#f0644a] px-6 py-3.5 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#ff8069]"
              >
                <Compass className="h-4 w-4" /> Descubre tu rol ideal (Test 1 min)
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('agenda-actividades')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3.5 font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                <Calendar className="h-4 w-4" /> Ver agenda de fechas
              </button>
            </div>
          </motion.div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 lg:justify-self-end">
            <div className="rounded-[1.75rem] border border-white/15 bg-white/10 p-6 backdrop-blur">
              <Users className="h-6 w-6 text-[#ff9b87]" />
              <p className="mt-8 font-heading text-4xl font-extrabold text-white">6</p>
              <p className="mt-1 text-xs text-white/70">áreas de especialidad</p>
            </div>
            <div className="mt-8 rounded-[1.75rem] bg-[#ffcf5a] p-6 text-[#171717]">
              <HeartHandshake className="h-6 w-6 text-[#171717]" />
              <p className="mt-8 font-heading text-4xl font-extrabold">12</p>
              <p className="mt-1 text-xs font-bold text-[#171717]/80">perritos que esperan tu visita</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/15 bg-white/10 p-6 backdrop-blur">
              <ShieldCheck className="h-6 w-6 text-[#a8d5ad]" />
              <p className="mt-8 font-heading text-3xl font-extrabold text-white">100%</p>
              <p className="mt-1 text-xs text-white/70">inducción y mentoría guiada</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/15 bg-white/10 p-6 backdrop-blur">
              <Sparkles className="h-6 w-6 text-[#cbdcf4]" />
              <p className="mt-8 font-heading text-3xl font-extrabold text-white">+2h</p>
              <p className="mt-1 text-xs text-white/70">tiempo mínimo al mes</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Interactive Quiz: Matchmaker ── */}
      <section id="test-rol" className="mx-auto max-w-7xl px-5 pt-20 pb-10 sm:px-8 lg:px-10">
        <VolunteerMatchmaker
          onSelectRole={(role) => chooseRole(role, true)}
          onInspectRole={(role) => setInspectingRole(role)}
        />
      </section>

      {/* ── Roles Section ── */}
      <section id="formas-de-ayudar" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#f0644a]">
              6 Maneras de Participar
            </p>
            <h2 className="mt-4 font-heading text-5xl font-extrabold leading-[.94] tracking-[-.06em] text-[#171717] sm:text-6xl">
              Hay más de una forma de estar presente.
            </h2>
          </div>
          <p className="max-w-xl text-base leading-relaxed text-[#6e6a64] lg:justify-self-end">
            Selecciona el área que mejor aprovecha tus habilidades y tiempos. Haz clic en cualquier tarjeta para ver qué se hace en un día típico, o elígela para completar tu solicitud.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {VOLUNTEER_ROLES_DETAILED.map((role, index) => {
            const isSelected = selectedArea === role.id;
            return (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className={`group relative flex min-h-[340px] flex-col justify-between overflow-hidden rounded-[2rem] border-2 p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  isSelected ? 'border-[#171717] ring-4 ring-[#171717]/10' : 'border-[#171717]/10'
                } ${role.accent}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-4xl" aria-hidden="true">
                      {role.icon}
                    </span>
                    <Badge variant="outline" className="border-[#171717]/20 bg-white/70 text-[10px] font-bold text-[#171717]">
                      {role.badge}
                    </Badge>
                  </div>

                  <h3 className="mt-6 font-heading text-2xl font-extrabold tracking-[-.04em] text-[#171717]">
                    {role.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#4f4a45]">
                    {role.shortDesc}
                  </p>

                  <div className="mt-4 space-y-1 text-[11px] font-medium text-[#6e6a64]">
                    <p>🕒 {role.timeCommitment}</p>
                    <p>📍 {role.location}</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-2 border-t border-[#171717]/10 pt-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setInspectingRole(role)}
                      className="flex-1 rounded-xl border border-[#171717]/20 bg-white px-3 py-2 text-xs font-bold text-[#171717] transition hover:bg-[#171717] hover:text-white"
                    >
                      Ver día típico
                    </button>
                    <button
                      type="button"
                      onClick={() => chooseRole(role.id, true)}
                      aria-pressed={isSelected}
                      className={`flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                        isSelected
                          ? 'bg-[#171717] text-white shadow-xs'
                          : 'bg-[#f0644a] text-white hover:bg-[#e94f3a]'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Seleccionado
                        </>
                      ) : (
                        'Elegir este rol'
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => chooseRole(selectedArea, true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#171717] px-7 py-4 font-bold text-white shadow-lg transition hover:bg-[#38332f]"
          >
            Continuar postulación con {selectedRole.title.toLowerCase()} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* ── Interactive Impact Calculator ── */}
      <VolunteerImpactCalculator
        onSelectHoursAndArea={(hours, area) => {
          chooseRole(area, true);
        }}
      />

      {/* ── The Volunteer Roadmap ── */}
      <VolunteerJourneyRoadmap />

      {/* ── Volunteer Manifesto & Safety ── */}
      <VolunteerManifesto onOpenGuide={() => setShowGuideModal(true)} />

      {/* ── Calendar / Activities Section ── */}
      <section id="agenda-actividades" className="bg-[#ede5da] px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[#f0644a]">
                Agenda y Fechas
              </p>
              <h2 className="mt-3 font-heading text-4xl font-extrabold tracking-[-.055em] text-[#171717] sm:text-5xl">
                Pasa de la intención a una fecha real.
              </h2>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-[#6e6a64]">
              Elige una jornada con cupos disponibles para sumarte como voluntario en actividades de paseo, salud, eventos o mejoras.
            </p>
          </div>

          <div className="rounded-[2.25rem] bg-[#fffdf9] p-4 shadow-[0_20px_60px_rgba(23,23,23,.08)] sm:p-8">
            <VolunteerCalendar />
          </div>
        </div>
      </section>

      {/* ── Dog Story Moment: Scooby ── */}
      <DogStoryMoment
        slug="scooby"
        eyebrow="El tiempo también repara"
        title="La confianza de Scooby se construye encuentro a encuentro."
      />

      {/* ── Volunteer Testimonials ── */}
      <VolunteerTestimonials />

      {/* ── Contextual FAQ ── */}
      <ContextualFaq category="volunteer" title="Una mano empieza con una buena respuesta." />

      {/* ── Volunteer Application Form ── */}
      <section id="volunteer-form" className="scroll-mt-24 bg-[#171717] px-5 py-20 text-white sm:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.78fr_1.22fr] lg:gap-20">
          {/* Left sticky column */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-[.16em] text-[#ff9b87]">
              <Sparkles className="h-3.5 w-3.5" /> Da el primer paso
            </div>

            <h2 className="mt-4 font-heading text-5xl font-extrabold leading-[.94] tracking-[-.06em]">
              Cuéntanos cómo quieres sumar.
            </h2>
            <p className="mt-5 leading-relaxed text-white/70">
              Tu postulación llega directamente al panel de coordinación de AdoptaME. Te escribiremos por WhatsApp para conocerte, responder tus dudas y agendar tu primera jornada guiada.
            </p>

            {/* Selected Role Card */}
            <div className="mt-8 rounded-[1.75rem] border border-white/15 bg-white/10 p-6 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-white/50">Área elegida</p>
              <p className="mt-2 font-heading text-2xl font-extrabold text-white">
                {selectedRole.icon} {selectedRole.title}
              </p>
              <p className="mt-1 text-xs text-white/70">{selectedRole.shortDesc}</p>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-[#ffcf5a]">
                <Clock className="h-3.5 w-3.5" />
                <span>{selectedRole.timeCommitment}</span>
              </div>
            </div>

            {/* WhatsApp Coordinator Help */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-xs text-white/80">
              <p className="font-bold text-white flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-[#ff9b87]" /> ¿Tienes dudas antes de enviar?
              </p>
              <p className="mt-1 leading-relaxed text-white/65">
                Escríbenos directamente y te ayudamos a elegir la mejor opción según tu disponibilidad.
              </p>
              <a
                href="https://wa.me/593990000000?text=Hola%20AdoptaME%2C%20tengo%20preguntas%20sobre%20el%20voluntariado"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 font-bold text-[#ff9b87] underline hover:text-white"
              >
                Escribir al WhatsApp de coordinación →
              </a>
            </div>
          </div>

          {/* Form or Celebratory Success State */}
          <div className="rounded-[2.25rem] bg-[#fffdf9] p-6 text-[#171717] shadow-2xl sm:p-10">
            {submittedData ? (
              /* Success Celebration State */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 py-6 text-center sm:text-left"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 sm:mx-0">
                  <CheckCircle2 className="h-10 w-10" />
                </div>

                <div>
                  <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-xs font-bold text-emerald-800">
                    ¡Solicitud recibida con éxito!
                  </Badge>
                  <h3 className="mt-3 font-heading text-3xl font-extrabold text-[#171717] sm:text-4xl">
                    ¡Bienvenido/a a la manada, {submittedData.name}!
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#6e6a64]">
                    Registramos tu postulación para <strong>{submittedData.roleTitle}</strong> con disponibilidad:{' '}
                    <em>{submittedData.availability}</em>.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#171717]/10 bg-[#faf7f2] p-5 text-xs text-[#4f4a45]">
                  <p className="font-bold text-[#171717] flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#f0644a]" /> ¿Qué pasará ahora?
                  </p>
                  <ol className="mt-3 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Un coordinador de AdoptaME revisará tu solicitud en las próximas 24 a 48 horas.</li>
                    <li>Te escribiremos por WhatsApp para darte la bienvenida y confirmar tu primera jornada guiada.</li>
                    <li>Te asignaremos un voluntario mentor para que nunca estés solo en tus primeros pasos.</li>
                  </ol>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    onClick={() => setShowGuideModal(true)}
                    className="bg-[#171717] text-white hover:bg-[#38332f] font-bold"
                  >
                    <BookOpen className="mr-2 h-4 w-4 text-[#ff9b87]" /> Abrir Guía del Voluntario
                  </Button>
                  <Button
                    onClick={handleShareVolunteering}
                    variant="outline"
                    className="border-emerald-300 bg-emerald-50 text-emerald-800 font-bold hover:bg-emerald-100"
                  >
                    <Share2 className="mr-2 h-4 w-4 text-emerald-600" /> Compartir en WhatsApp
                  </Button>
                  <Button
                    onClick={handleResetForm}
                    variant="ghost"
                    className="text-xs text-[#6e6a64]"
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Enviar otra postulación
                  </Button>
                </div>
              </motion.div>
            ) : (
              /* The Form */
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <h3 className="font-heading text-2xl font-extrabold text-[#171717]">
                    Formulario de Incorporación
                  </h3>
                  <p className="mt-1 text-xs text-[#6e6a64]">
                    Completa tus datos de contacto y disponibilidad. Todo el proceso es gratuito y seguro.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="full_name">Nombre completo</Label>
                    <Input
                      id="full_name"
                      autoComplete="name"
                      placeholder="Tu nombre y apellido"
                      aria-invalid={Boolean(errors.full_name)}
                      aria-describedby={errors.full_name ? 'full-name-error' : undefined}
                      {...register('full_name')}
                    />
                    {errors.full_name && (
                      <p id="full-name-error" className="text-xs text-red-600">
                        {errors.full_name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="tu@email.com"
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                      {...register('email')}
                    />
                    {errors.email && (
                      <p id="email-error" className="text-xs text-red-600">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Teléfono / WhatsApp</Label>
                    <Input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      placeholder="+593 99 000 0000"
                      aria-invalid={Boolean(errors.phone)}
                      aria-describedby={errors.phone ? 'phone-error' : undefined}
                      {...register('phone')}
                    />
                    {errors.phone && (
                      <p id="phone-error" className="text-xs text-red-600">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="area_of_interest">Área de interés principal</Label>
                    <select
                      id="area_of_interest"
                      {...register('area_of_interest')}
                      className="flex h-11 w-full rounded-xl border border-[var(--color-input)] bg-white px-3.5 text-sm font-semibold text-[#171717] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0644a]"
                    >
                      {VOLUNTEER_ROLES_DETAILED.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.icon} {role.title} — {role.shortDesc}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Enhanced Availability Picker */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Disponibilidad de días y turnos</Label>
                    <VolunteerAvailabilityPicker
                      key={availabilityPickerKey}
                      onChange={(availability) => setValue('availability', availability, { shouldValidate: true })}
                    />
                    {errors.availability && (
                      <p className="text-xs text-red-600 font-semibold">{errors.availability.message}</p>
                    )}
                  </div>

                  {/* Skills selection chips */}
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Habilidades o intereses que quisieras aportar (opcional)</Label>
                    <div className="flex flex-wrap gap-2">
                      {SKILL_OPTIONS.map((skill) => {
                        const isChecked = selectedSkills.includes(skill);
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => toggleSkill(skill)}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                              isChecked
                                ? 'border-[#f0644a] bg-[#f0644a] text-white'
                                : 'border-[#171717]/15 bg-white text-[#4f4a45] hover:border-[#f0644a]'
                            }`}
                          >
                            {skill}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="experience">Cuéntanos sobre ti o tus mascotas (opcional)</Label>
                    <Textarea
                      id="experience"
                      rows={3}
                      placeholder="¿Tienes perritos en casa? ¿Alguna experiencia previa con rescates o algo especial que te motive a sumarte?..."
                      {...register('experience')}
                    />
                  </div>
                </div>

                {/* Animal Welfare Pledge Checkbox */}
                <div className="rounded-2xl border border-[#171717]/10 bg-[#faf7f2] p-4 text-xs">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('pledge')}
                      className="mt-0.5 h-4 w-4 rounded border-[#171717]/30 text-[#f0644a] focus:ring-[#f0644a]"
                    />
                    <span className="text-[#4f4a45] leading-relaxed">
                      Me comprometo a tratar a los animales del refugio con respeto, paciencia y mediante técnicas 100% positivas, siguiendo las pautas del equipo.
                    </span>
                  </label>
                  {errors.pledge && (
                    <p className="mt-1 text-xs text-red-600 font-semibold">{errors.pledge.message}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-[#6e6a64]">
                  <ShieldCheck className="h-4 w-4 text-[#f0644a] shrink-0" />
                  <span>
                    Usaremos tus datos exclusivamente para gestionar tu postulación. Consulta nuestra{' '}
                    <Link to="/privacidad" className="font-bold underline hover:text-[#171717]">
                      política de privacidad
                    </Link>
                    .
                  </span>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-[#f0644a] font-bold text-white hover:bg-[#e94f3a]"
                  disabled={submitting}
                >
                  <Heart className="mr-2 h-4 w-4" />
                  {submitting ? 'Enviando postulación…' : 'Enviar mi postulación de voluntario 🐾'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── Bottom Alternative CTAs ── */}
      <section className="px-5 py-18 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 py-16 md:grid-cols-2">
          <Link
            to="/donaciones"
            className="group rounded-[2rem] border border-[#ffcf5a] bg-[#ffcf5a] p-8 text-[#171717] shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <p className="text-xs font-bold uppercase tracking-[.14em]">Si tienes poco tiempo libre</p>
            <h3 className="mt-6 font-heading text-3xl font-extrabold">Ayuda con una donación solidaria.</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#171717]/80">
              Tu aporte cubre vacunas, alimento premium y tratamientos médicos para los perritos en recuperación.
            </p>
            <span className="mt-6 inline-flex items-center gap-2 font-bold text-sm">
              Ver opciones de aporte <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </Link>

          <Link
            to="/tienda"
            className="group rounded-[2rem] border border-[#f0644a] bg-[#f0644a] p-8 text-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <p className="text-xs font-bold uppercase tracking-[.14em] text-white/70">
              Lleva la causa contigo
            </p>
            <h3 className="mt-6 font-heading text-3xl font-extrabold">Compra con propósito.</h3>
            <p className="mt-2 text-xs leading-relaxed text-white/80">
              Camisetas, accesorios y artículos oficiales donde el 100% de la utilidad financia la manada.
            </p>
            <span className="mt-6 inline-flex items-center gap-2 font-bold text-sm">
              Visitar la tienda solidaria <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </Link>
        </div>
      </section>

      {/* ── Role Deep-Dive Modal ── */}
      <AnimatePresence>
        {inspectingRole && (
          <VolunteerRoleDetailModal
            role={inspectingRole}
            onClose={() => setInspectingRole(null)}
            onSelectRole={(roleId) => chooseRole(roleId, true)}
          />
        )}
      </AnimatePresence>

      {/* ── Volunteer Welcome Guide Modal ── */}
      <AnimatePresence>
        {showGuideModal && (
          <VolunteerWelcomeGuideModal onClose={() => setShowGuideModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
