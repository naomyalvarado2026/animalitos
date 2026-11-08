import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, RotateCcw, CheckCircle2, ChevronRight, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VOLUNTEER_ROLES_DETAILED, type VolunteerRoleDetail } from '@/data/volunteerRoles';
import type { VolunteerArea } from '@/types';
import { ResilientImage } from '@/components/ui/ResilientImage';
import { assetUrl } from '@/lib/assets';

interface QuizQuestion {
  id: number;
  title: string;
  subtitle: string;
  options: {
    id: string;
    label: string;
    sublabel: string;
    emoji: string;
    scores: Record<VolunteerArea, number>;
  }[];
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    title: '¿Cuál es tu disponibilidad de tiempo?',
    subtitle: 'Cada hora donada tiene un valor inmenso para los 12 perros del refugio.',
    options: [
      {
        id: 'weekends',
        label: 'Fines de semana',
        sublabel: 'Tengo libres mañanas o tardes de sábados y domingos.',
        emoji: '☀️',
        scores: { dog_walking: 30, shelter_maintenance: 25, events: 25, medical_support: 15, social_media: 10, foster: 15 },
      },
      {
        id: 'weekdays',
        label: 'Entre semana (1 a 3 horas)',
        sublabel: 'Puedo apoyar turnos matutinos o vespertinos durante la semana.',
        emoji: '🗓️',
        scores: { medical_support: 30, dog_walking: 25, social_media: 20, foster: 20, shelter_maintenance: 10, events: 10 },
      },
      {
        id: 'flexible_home',
        label: 'Horario flexible / Desde casa',
        sublabel: 'Tengo tiempos variables o prefiero apoyar de forma remota o acogiendo.',
        emoji: '💻',
        scores: { social_media: 35, foster: 30, events: 15, medical_support: 10, dog_walking: 10, shelter_maintenance: 5 },
      },
    ],
  },
  {
    id: 2,
    title: '¿Qué tipo de actividad hace vibrar tu corazón?',
    subtitle: 'Elige la forma de ayudar que más disfrutarías semana tras semana.',
    options: [
      {
        id: 'direct_dogs',
        label: 'Caminar, jugar y acariciar perritos',
        sublabel: 'Contacto directo, paseos al aire libre y desestrés para la manada.',
        emoji: '🐕',
        scores: { dog_walking: 40, foster: 20, medical_support: 15, events: 10, shelter_maintenance: 5, social_media: 5 },
      },
      {
        id: 'health_care',
        label: 'Salud, curaciones y cuidados diarios',
        sublabel: 'Medicación supervisada, higiene, pesaje y recuperación física.',
        emoji: '🏥',
        scores: { medical_support: 40, foster: 25, dog_walking: 15, shelter_maintenance: 10, events: 5, social_media: 5 },
      },
      {
        id: 'community_events',
        label: 'Hablar con personas, ferias y bazares',
        sublabel: 'Conectar la causa con la comunidad y recaudar fondos para el refugio.',
        emoji: '🎟️',
        scores: { events: 40, social_media: 25, dog_walking: 15, foster: 10, medical_support: 5, shelter_maintenance: 5 },
      },
      {
        id: 'creative_media',
        label: 'Fotos, videos y contenido digital',
        sublabel: 'Contar historias conmovedoras que ayuden a que los perros sean adoptados.',
        emoji: '📸',
        scores: { social_media: 45, events: 20, dog_walking: 15, foster: 10, medical_support: 5, shelter_maintenance: 5 },
      },
      {
        id: 'handyman',
        label: 'Arreglos, pintura y trabajo manual',
        sublabel: 'Construir casitas seguras, pintar caniles y mantener el refugio impecable.',
        emoji: '🛠️',
        scores: { shelter_maintenance: 45, events: 15, dog_walking: 15, medical_support: 10, foster: 5, social_media: 5 },
      },
      {
        id: 'home_shelter',
        label: 'Abrir mi hogar como casa de paso',
        sublabel: 'Darle techo, descanso y amor a un perro en recuperación mientras llega su familia.',
        emoji: '🏡',
        scores: { foster: 45, medical_support: 20, dog_walking: 20, social_media: 10, events: 5, shelter_maintenance: 5 },
      },
    ],
  },
  {
    id: 3,
    title: '¿Cuál es tu experiencia o familiaridad con perros?',
    subtitle: 'En AdoptaME todos son bienvenidos; te capacitamos desde el primer día.',
    options: [
      {
        id: 'beginner',
        label: 'Principiante con enorme amor y ganas de aprender',
        sublabel: 'No he convivido mucho con mascotas, pero quiero ayudar con guía.',
        emoji: '🌱',
        scores: { events: 25, social_media: 25, dog_walking: 20, shelter_maintenance: 20, medical_support: 10, foster: 5 },
      },
      {
        id: 'experienced',
        label: 'Tutor de mascotas / Experiencia familiar',
        sublabel: 'Tengo o he tenido perros en casa y conozco sus cuidados habituales.',
        emoji: '🐾',
        scores: { dog_walking: 30, foster: 25, events: 20, shelter_maintenance: 20, medical_support: 15, social_media: 15 },
      },
      {
        id: 'pro',
        label: 'Experiencia veterinaria, rescates o adiestramiento',
        sublabel: 'Tengo formación técnica o he rescatado y rehabilitado animales antes.',
        emoji: '⭐',
        scores: { medical_support: 35, foster: 30, dog_walking: 25, shelter_maintenance: 15, events: 10, social_media: 10 },
      },
    ],
  },
];

export function VolunteerMatchmaker({
  onSelectRole,
  onInspectRole,
}: {
  onSelectRole: (role: VolunteerArea) => void;
  onInspectRole: (role: VolunteerRoleDetail) => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = QUIZ_QUESTIONS[currentStep];

  function handleSelectOption(optionId: string) {
    const nextAnswers = { ...selectedAnswers, [currentStep]: optionId };
    setSelectedAnswers(nextAnswers);

    if (currentStep < QUIZ_QUESTIONS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  }

  function handleReset() {
    setSelectedAnswers({});
    setCurrentStep(0);
    setIsFinished(false);
  }

  // Calculate scores
  const results = (() => {
    const totalScores: Record<VolunteerArea, number> = {
      dog_walking: 0,
      medical_support: 0,
      events: 0,
      foster: 0,
      social_media: 0,
      shelter_maintenance: 0,
    };

    QUIZ_QUESTIONS.forEach((q, index) => {
      const chosenOptionId = selectedAnswers[index];
      if (!chosenOptionId) return;
      const opt = q.options.find((o) => o.id === chosenOptionId);
      if (!opt) return;

      Object.entries(opt.scores).forEach(([roleKey, score]) => {
        totalScores[roleKey as VolunteerArea] += score;
      });
    });

    const sortedRoles = VOLUNTEER_ROLES_DETAILED.map((role) => ({
      role,
      score: totalScores[role.id],
    })).sort((a, b) => b.score - a.score);

    const maxScore = Math.max(...sortedRoles.map((r) => r.score), 1);
    const topMatch = sortedRoles[0];
    const secondaryMatch = sortedRoles[1];

    const matchPercent = Math.min(99, Math.round((topMatch.score / maxScore) * 98));

    return { topMatch, secondaryMatch, matchPercent };
  })();

  return (
    <div className="relative overflow-hidden rounded-[2.25rem] border border-[#171717]/10 bg-gradient-to-b from-white via-[#fffdf9] to-[#faf6f0] p-6 shadow-xl sm:p-10">
      <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-[#f0644a]/10 blur-3xl" />
      <div className="absolute left-0 bottom-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-[#ffcf5a]/20 blur-3xl" />

      {/* Header */}
      <div className="relative mb-8 text-center sm:text-left">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#f0644a]/20 bg-[#f0644a]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-[.14em] text-[#f0644a]">
            <Sparkles className="h-3.5 w-3.5" /> Test interactivo de 1 minuto
          </div>
          {!isFinished && (
            <span className="text-xs font-bold text-[#6e6a64]">
              Paso {currentStep + 1} de {QUIZ_QUESTIONS.length}
            </span>
          )}
        </div>
        <h3 className="mt-3 font-heading text-3xl font-extrabold tracking-[-.04em] text-[#171717] sm:text-4xl">
          Descubre tu rol ideal como voluntario
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[#6e6a64]">
          Responde 3 preguntas sencillas y te diremos dónde tu talento y tiempo tendrán el mayor impacto.
        </p>

        {/* Progress bar */}
        {!isFinished && (
          <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-[#ede5da]">
            <motion.div
              className="h-full bg-gradient-to-r from-[#f0644a] to-[#ff9a62]"
              initial={{ width: '0%' }}
              animate={{ width: `${((currentStep + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!isFinished ? (
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div>
              <h4 className="font-heading text-xl font-bold text-[#171717]">{currentQuestion.title}</h4>
              <p className="text-xs text-[#6e6a64]">{currentQuestion.subtitle}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelectOption(option.id)}
                  className="group relative flex min-h-[140px] flex-col justify-between rounded-2xl border border-[#171717]/10 bg-white p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-[#f0644a] hover:bg-[#fff9f7] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0644a]"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-3xl" aria-hidden="true">
                      {option.emoji}
                    </span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f8f4ee] text-[#171717] transition group-hover:bg-[#f0644a] group-hover:text-white">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="font-heading text-base font-bold text-[#171717] transition group-hover:text-[#f0644a]">
                      {option.label}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[#6e6a64]">{option.sublabel}</p>
                  </div>
                </button>
              ))}
            </div>

            {currentStep > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                  className="text-xs font-semibold text-[#6e6a64] underline underline-offset-4 hover:text-[#171717]"
                >
                  ← Pregunta anterior
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          /* Results View */
          <motion.div
            key="quiz-result"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            {/* Top Match Card */}
            <div className={`overflow-hidden rounded-3xl border-2 p-6 sm:p-8 ${results.topMatch.role.accent} ${results.topMatch.role.accentBorder}`}>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="warm" className="bg-[#f0644a] text-white">
                      Tu mayor afinidad · {results.matchPercent}% de coincidencia
                    </Badge>
                    <Badge variant="outline" className="border-[#171717]/20 bg-white/70 text-[#171717]">
                      {results.topMatch.role.badge}
                    </Badge>
                  </div>
                  <h4 className="mt-3 flex items-center gap-3 font-heading text-3xl font-extrabold text-[#171717] sm:text-4xl">
                    <span className="text-4xl">{results.topMatch.role.icon}</span>
                    {results.topMatch.role.title}
                  </h4>
                  <p className="mt-2 max-w-xl text-base leading-relaxed text-[#4f4a45]">
                    {results.topMatch.role.shortDesc}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-end">
                  <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-2 border-white shadow-md sm:h-24 sm:w-24">
                    <ResilientImage
                      src={assetUrl(results.topMatch.role.benefitedDogImage)}
                      alt={results.topMatch.role.benefitedDogName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#6e6a64]">Perrito embajador</p>
                    <p className="font-heading text-sm font-extrabold text-[#171717]">
                      {results.topMatch.role.benefitedDogName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Key activities preview */}
              <div className="mt-6 border-t border-[#171717]/10 pt-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#4f4a45]">Lo que harás en este rol:</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {results.topMatch.role.keyActivities.slice(0, 4).map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-[#2b2723]">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#f0644a]" />
                      <span>{activity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  onClick={() => onSelectRole(results.topMatch.role.id)}
                  size="lg"
                  className="bg-[#f0644a] text-white hover:bg-[#e94f3a]"
                >
                  <Heart className="mr-2 h-4 w-4" />
                  Postularme a {results.topMatch.role.title.toLowerCase()}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => onInspectRole(results.topMatch.role)}
                  className="border-[#171717]/20 bg-white hover:bg-[#f8f4ee]"
                >
                  Ver un día típico y requisitos <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#6e6a64] hover:text-[#171717]"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Repetir test
                </button>
              </div>
            </div>

            {/* Secondary alternative match */}
            {results.secondaryMatch && (
              <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-[#171717]/10 bg-white p-5 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-bold text-[#6e6a64]">Tu segunda mejor opción:</p>
                  <p className="mt-1 font-heading text-lg font-bold text-[#171717]">
                    {results.secondaryMatch.role.icon} {results.secondaryMatch.role.title}
                  </p>
                  <p className="text-xs text-[#6e6a64]">{results.secondaryMatch.role.shortDesc}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onInspectRole(results.secondaryMatch.role)}
                  className="text-xs font-bold text-[#f0644a] hover:bg-[#f0644a]/10"
                >
                  Explorar esta opción →
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
