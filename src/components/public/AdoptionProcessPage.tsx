import { useMemo, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowDown,
  ArrowRight,
  Check,
  ClipboardList,
  Heart,
  MessageCircle,
  PawPrint,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { usePublicSettings } from '@/lib/publicSettings';
import { ResilientImage } from '@/components/ui/ResilientImage';
import { assetUrl } from '@/lib/assets';
import { ContextualFaq } from './ContextualFaq';

type ProcessStep = { number: string; title: string; text: string };

const STEPS: ProcessStep[] = [
  { number: '01', title: 'Conoce', text: 'Explora la personalidad, energía, salud y necesidades de cada perrito.' },
  { number: '02', title: 'Conecta', text: 'Completa una pre-solicitud para contarnos sobre tu hogar y tu rutina.' },
  { number: '03', title: 'Prepárate', text: 'Conversamos contigo, resolvemos dudas y confirmamos que sea un buen match.' },
  { number: '04', title: 'Acompañamos', text: 'La adopción continúa con orientación para la adaptación y la tenencia responsable.' },
];

const STEP_ICONS = [Search, ClipboardList, MessageCircle, Heart];

const READINESS = [
  'Tiempo real para adaptación, paseos y compañía',
  'Presupuesto para alimento, prevención y veterinario',
  'Acuerdo de todas las personas que viven en casa',
  'Un compromiso que acompaña toda su vida',
];

function parseProcessSteps(value: string | undefined): ProcessStep[] {
  try {
    const parsed: unknown = JSON.parse(value ?? 'null');
    if (!Array.isArray(parsed)) return STEPS;

    const validSteps = parsed.flatMap((candidate, index) => {
      if (!candidate || typeof candidate !== 'object') return [];
      const step = candidate as Record<string, unknown>;
      if (typeof step.title !== 'string' || typeof step.text !== 'string') return [];
      const title = step.title.trim();
      const text = step.text.trim();
      if (!title || !text) return [];

      return [{
        number: typeof step.number === 'string' && step.number.trim()
          ? step.number.trim()
          : String(index + 1).padStart(2, '0'),
        title,
        text,
      }];
    });

    return validSteps.length ? validSteps : STEPS;
  } catch {
    return STEPS;
  }
}

export function AdoptionProcessPage() {
  const { data: settings } = usePublicSettings(['process_intro', 'adoption_process_steps']);
  const shouldReduceMotion = useReducedMotion();
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
  const steps = useMemo(() => parseProcessSteps(settings?.adoption_process_steps), [settings?.adoption_process_steps]);
  const activeStepIndex = Math.min(selectedStepIndex, steps.length - 1);

  return (
    <div className="bg-[var(--color-background)] pt-16 text-[var(--color-foreground)]">
      <section aria-labelledby="adoption-process-title" className="relative isolate px-5 py-8 sm:px-8 lg:min-h-[406px] lg:pl-6 lg:pr-0 lg:py-0">
        <div className="mx-auto grid grid-cols-[minmax(0,1fr)] max-w-[1328px] items-center gap-9 lg:min-h-[406px] lg:grid-cols-1">
          <div className="relative z-10 min-w-0 max-w-[700px]">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[var(--color-primary)] sm:text-sm">
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              Acompañamiento por etapas
            </p>
            <h1 id="adoption-process-title" className="mt-5 break-words font-heading text-5xl font-extrabold leading-[.96] tracking-[-.06em] max-[359px]:text-4xl sm:text-6xl xl:text-[4rem]">
              Adoptar también <br className="hidden xl:block" /><span className="text-[#f0644a]">se vive acompañado.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--color-muted-foreground)] sm:text-lg">
              {settings?.process_intro?.trim() || 'Te guiamos de forma cercana y transparente en cada etapa, para que tomes una decisión informada y con tranquilidad.'}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/adopta"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#ff8069] px-6 py-3 font-bold text-[#17022b] transition hover:bg-[#ff9a86] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2"
              >
                Conocer a los perritos <PawPrint aria-hidden="true" className="h-5 w-5" />
              </Link>
              <a
                href="#el-proceso"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 font-semibold text-[var(--color-foreground)] transition hover:bg-[var(--color-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2"
              >
                Ver cómo funciona <ArrowDown aria-hidden="true" className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="relative min-h-[280px] overflow-hidden rounded-[2rem] bg-[var(--color-secondary)] sm:min-h-[390px] lg:absolute lg:inset-y-0 lg:right-0 lg:w-[55%] lg:rounded-none">
            <ResilientImage
              src={assetUrl('/images/dog_max.jpg')}
              alt="Max, un perro rescatado esperando conocer a su familia"
              className="absolute inset-0 h-full w-full object-cover object-[center_35%]"
            />
            <div aria-hidden="true" className="absolute inset-y-0 left-0 hidden w-[28%] bg-gradient-to-r from-[var(--color-background)] via-[var(--color-background)]/55 to-transparent lg:block" />
          </div>
        </div>
      </section>

      <section id="el-proceso" aria-labelledby="process-steps-title" className="scroll-mt-24 px-5 py-10 sm:px-8 lg:pb-0 lg:pt-8">
        <div className="mx-auto max-w-[1320px]">
          <header className="xl:pl-4">
            <h2 id="process-steps-title" className="font-heading text-3xl font-extrabold tracking-[-.045em] sm:text-4xl lg:text-5xl">
              Conoce el proceso de adopción
            </h2>
            <p className="mt-2 text-base text-[var(--color-muted-foreground)] sm:text-lg">
              Un camino simple y acompañado, de principio a fin.
            </p>
          </header>

          <Tabs.Root
            value={`step-${activeStepIndex}`}
            onValueChange={(value) => setSelectedStepIndex(Number(value.replace('step-', '')))}
            activationMode="automatic"
            className="mt-7"
          >
            <div className="overflow-x-auto rounded-full bg-[var(--color-secondary)] p-1.5" style={{ scrollbarWidth: 'thin' }}>
              <Tabs.List aria-label="Etapas del proceso de adopción" className="flex min-w-max gap-1 sm:min-w-0 sm:w-full">
                {steps.map((step, index) => {
                  const StepIcon = STEP_ICONS[index % STEP_ICONS.length] ?? PawPrint;
                  return (
                    <Tabs.Trigger
                      key={`${step.number}-${step.title}-${index}`}
                      value={`step-${index}`}
                      className="inline-flex min-h-12 min-w-[8rem] flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 data-[state=active]:bg-[#3c096c] data-[state=active]:text-white sm:min-w-0 sm:text-base"
                    >
                      <StepIcon aria-hidden="true" className="h-5 w-5 shrink-0" />
                      <span>{step.title}</span>
                    </Tabs.Trigger>
                  );
                })}
              </Tabs.List>
            </div>

            {steps.map((step, index) => {
              const StepIcon = STEP_ICONS[index % STEP_ICONS.length] ?? PawPrint;
              return (
                <Tabs.Content
                  key={`${step.number}-${step.title}-${index}`}
                  value={`step-${index}`}
                  className="mt-8 rounded-[2rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-4"
                >
                  <motion.div
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.22 }}
                    className="grid overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--surface-shadow)] sm:grid-cols-[minmax(180px,.31fr)_minmax(0,1fr)]"
                  >
                    <div className="flex min-h-36 items-center justify-center bg-[var(--color-secondary)] p-6 sm:min-h-[230px]">
                      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-[#ff8069]/20 text-[var(--color-primary)] sm:h-32 sm:w-32">
                        <PawPrint aria-hidden="true" className="h-12 w-12 sm:h-16 sm:w-16" />
                      </div>
                    </div>
                    <div className="flex flex-col items-start justify-center p-6 sm:p-8 lg:justify-start lg:px-12 lg:pb-11 lg:pt-5">
                      <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[var(--color-primary)]">
                        Paso {step.number || String(index + 1).padStart(2, '0')}
                      </p>
                      <h3 className="mt-2 font-heading text-3xl font-extrabold tracking-[-.045em] sm:text-4xl">
                        {step.title}
                      </h3>
                      <p className="mt-3 max-w-xl leading-relaxed text-[var(--color-muted-foreground)]">
                        {step.text}
                      </p>
                      <Link
                        to="/adopta"
                        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#ff8069] px-5 py-2.5 font-bold text-[#17022b] transition hover:bg-[#ff9a86] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 lg:mt-11"
                      >
                        <StepIcon aria-hidden="true" className="h-4 w-4" /> Explorar animales
                      </Link>
                    </div>
                  </motion.div>
                </Tabs.Content>
              );
            })}
          </Tabs.Root>
        </div>
      </section>

      <section aria-labelledby="adoption-reassurance-title" className="px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-5 rounded-[1.75rem] bg-[var(--color-secondary)] p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-7">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-card)] text-[var(--color-primary)]">
            <ShieldCheck aria-hidden="true" className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <h2 id="adoption-reassurance-title" className="font-heading text-xl font-extrabold sm:text-2xl">
              Un proceso humano y transparente
            </h2>
            <p className="mt-1 leading-relaxed text-[var(--color-muted-foreground)]">
              Queremos conocerte y resolver tus dudas con honestidad, cuidar el bienestar del animal y acompañarte durante la adaptación.
            </p>
          </div>
          <a
            href="#preguntas"
            className="inline-flex min-h-11 shrink-0 items-center gap-2 font-bold text-[var(--color-primary)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
          >
            Preguntas frecuentes <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </a>
        </div>
      </section>

      <section aria-labelledby="readiness-title" className="px-5 py-14 sm:px-8 lg:py-20">
        <div className="mx-auto grid max-w-[1320px] overflow-hidden rounded-[2rem] bg-[var(--color-card)] shadow-[var(--surface-shadow)] lg:grid-cols-2">
          <div className="relative min-h-[280px] overflow-hidden sm:min-h-[360px]">
            <ResilientImage
              src={assetUrl('/images/shelter_hero_1785817115197.jpg')}
              alt="Una familia comparte tiempo con su perro en casa"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
          <div className="p-6 sm:p-9 lg:p-12">
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[var(--color-primary)]">Antes de decir sí</p>
            <h2 id="readiness-title" className="mt-3 font-heading text-3xl font-extrabold tracking-[-.045em] sm:text-4xl">
              Hazte estas cuatro promesas.
            </h2>
            <ul className="mt-6 space-y-4">
              {READINESS.map((item) => (
                <li key={item} className="flex items-start gap-3 border-b border-[var(--color-border)] pb-4 leading-relaxed">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ff8069] text-[#17022b]">
                    <Check aria-hidden="true" className="h-4 w-4" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div id="preguntas" className="scroll-mt-20">
        <ContextualFaq category="adoption" title="Antes de dar el sí, despeja tus dudas." />
      </div>

      <section aria-labelledby="adoption-next-step-title" className="bg-[#17022b] px-5 py-16 text-white sm:px-8 lg:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#ff8069]">¿Listo para empezar?</p>
          <h2 id="adoption-next-step-title" className="mt-4 font-heading text-4xl font-extrabold tracking-[-.055em] sm:text-5xl">
            Tu próximo mejor amigo puede estar esperando.
          </h2>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/adopta"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#ff8069] px-6 py-3 font-bold text-[#17022b] transition hover:bg-[#ff9a86] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#17022b]"
            >
              Explorar adopciones <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link
              to="/voluntariado"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 px-6 py-3 font-bold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#17022b]"
            >
              Todavía no puedo adoptar
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
