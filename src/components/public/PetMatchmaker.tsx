import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RefreshCw, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { ResilientImage } from '@/components/ui/ResilientImage';
import { assetUrl } from '@/lib/assets';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Animal } from '@/types';
import { mergeRefugeDogs } from '@/lib/refugeDogs';

interface Question {
  id: number;
  title: string;
  options: { label: string; value: string; emoji: string }[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    title: '¿Cuál es tu tipo de hogar?',
    options: [
      { label: 'Casa con jardín o patio amplio', value: 'large_house', emoji: '🏡' },
      { label: 'Departamento o casa pequeña', value: 'apartment', emoji: '🏢' },
      { label: 'Finca o casa de campo', value: 'farm', emoji: '🌱' },
    ],
  },
  {
    id: 2,
    title: '¿Cuál es tu nivel de actividad diaria?',
    options: [
      { label: 'Tranquilo: me gusta estar en casa leyendo o viendo películas', value: 'calm', emoji: '☕' },
      { label: 'Moderado: caminatas diarias y juegos regulares', value: 'moderate', emoji: '🚶‍♂️' },
      { label: 'Muy activo: corro, hago senderismo y me encanta estar al aire libre', value: 'active', emoji: '🏃‍♀️' },
    ],
  },
  {
    id: 3,
    title: '¿Con quiénes convivirá tu nuevo compañero?',
    options: [
      { label: 'Niños pequeños y familia', value: 'kids', emoji: '👨‍👩‍👧‍👦' },
      { label: 'Otras mascotas', value: 'other_pets', emoji: '🐕' },
      { label: 'Solo yo o adultos', value: 'adults_only', emoji: '🧑' },
    ],
  },
];

function getMatchmakerImageUrl(animal: Animal): string {
  if (animal.main_image_url) return assetUrl(animal.main_image_url);
  if (animal.gallery_urls && animal.gallery_urls.length > 0) return assetUrl(animal.gallery_urls[0]);
  const raw = animal as unknown as Record<string, unknown>;
  if (Array.isArray(raw.image_urls) && raw.image_urls.length > 0 && typeof raw.image_urls[0] === 'string') {
    return assetUrl(raw.image_urls[0]);
  }
  return assetUrl('/images/dog_max.jpg');
}

export function PetMatchmaker({ onSelectDog }: { onSelectDog?: (animal: Animal) => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);
  const animalsQuery = useQuery({
    queryKey: ['public-matchmaker-dogs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('animals').select('*').eq('species', 'dog').in('status', ['available', 'medical_care']).order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Animal[];
    },
    staleTime: 60_000,
  });
  const animals = useMemo(() => mergeRefugeDogs(animalsQuery.data ?? []), [animalsQuery.data]);
  const recommendations = useMemo(() => animals.map((animal) => {
    const activity = answers[2];
    const home = answers[1];
    const household = answers[3];
    const profile = `${animal.description} ${animal.personality_summary || ''} ${animal.ideal_home || ''} ${animal.compatibility_notes || ''}`.toLowerCase();
    let priority = 60;
    const reasons: string[] = [];
    const toConfirm: string[] = [];

    if (activity === 'active' && /(activ|correr|jugar|aventur|energ)/.test(profile)) {
      priority += 18;
      reasons.push('Disfruta una rutina activa y paseos dinámicos');
    }
    if (activity === 'calm' && /(tranquil|senior|pacien|seren|independ|tímid|timid)/.test(profile)) {
      priority += 16;
      reasons.push('Valora la calma y los tiempos respetuosos');
    }
    if (activity === 'moderate') {
      priority += 8;
      reasons.push('Se adapta bien a caminatas y juegos graduales');
    }
    if (home === 'apartment' && animal.size === 'small') {
      priority += 12;
      reasons.push('Tamaño favorable para espacios interiores');
    }
    if (home === 'apartment' && ['large', 'extra_large'].includes(animal.size)) {
      priority -= 12;
      toConfirm.push('Evaluar paseos diarios y espacio en departamento');
    }
    if ((home === 'farm' || home === 'large_house') && ['large', 'extra_large'].includes(animal.size)) {
      priority += 10;
      reasons.push('Aprovechará muy bien un patio o espacio amplio');
    }
    const needsOnlyPet = /(única mascota|unica mascota|sin otros|sin perros|sin gatos|atención exclusiva|atencion exclusiva)/.test(profile);
    if (household === 'other_pets' && needsOnlyPet) {
      priority -= 40;
      toConfirm.push('Su perfil recomienda hogar como única mascota');
    }
    if (household === 'other_pets' && !needsOnlyPet) {
      toConfirm.push('Presentación guiada con tus mascotas actuales');
    }
    if (household === 'kids' && /(niños|familia|jugar|activa)/.test(profile)) {
      priority += 12;
      reasons.push('Su carácter encaja con un entorno familiar');
    }
    if (household === 'kids' && /(sin niños|sin ninos|tranquilo y paciente|respete su espacio)/.test(profile)) {
      priority -= 24;
      toConfirm.push('Prefiere ambientes serenos sin niños pequeños');
    }
    if (household === 'adults_only' && /(senior|tranquil|pacien|seren|única mascota|unica mascota)/.test(profile)) {
      priority += 10;
      reasons.push('Un hogar adulto acompaña bien su tranquilidad');
    }
    if (animal.is_special_needs) {
      toConfirm.push('Conversar con el equipo sobre sus cuidados médicos');
      if (activity === 'calm') {
        priority += 5;
        reasons.push('Tu ritmo sereno favorece su bienestar');
      }
    }
    if (!animal.ideal_home) {
      toConfirm.push('Recomendación de hogar en revisión por el refugio');
    }
    if (toConfirm.length === 0) {
      toConfirm.push('Confirmar rutina y horarios en la entrevista inicial');
    }
    if (reasons.length === 0) {
      reasons.push('Perfil noble para conocer en visita coordinada');
    }

    const affinityLabel = priority >= 78 ? 'Afinidad destacada' : priority >= 65 ? 'Conexión compatible' : 'Para conversar con el equipo';
    return { animal, priority, affinityLabel, reasons: reasons.slice(0, 2), toConfirm: toConfirm.slice(0, 2) };
  }).sort((a, b) => b.priority - a.priority).slice(0, 2), [animals, answers]);

  function handleSelectOption(value: string) {
    const updated = { ...answers, [QUESTIONS[currentStep].id]: value };
    setAnswers(updated);

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowResult(true);
    }
  }

  function handleReset() {
    setAnswers({});
    setCurrentStep(0);
    setShowResult(false);
  }

  return (
    <Card className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#17022b] text-white shadow-2xl">
      <CardContent className="p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e0beff] text-[#17022b]"><Sparkles className="h-5 w-5" /></span>
            <div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#ff8069]">Orientación responsable</p><h2 className="font-heading text-xl font-extrabold">Descubre historias afines a tu hogar</h2></div>
          </div>
          {!showResult && (
            <Badge variant="outline" className="border-white/20 text-xs text-[#e0beff]">
              Paso {currentStep + 1} de {QUESTIONS.length}
            </Badge>
          )}
        </div>

        <AnimatePresence mode="wait">
          {!showResult ? (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full rounded-full bg-[#ff8069]" animate={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }} /></div>
              <h3 className="font-heading text-2xl font-extrabold text-white">
                {QUESTIONS[currentStep].title}
              </h3>

              <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
                {QUESTIONS[currentStep].options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelectOption(opt.value)}
                    className="group flex min-h-32 cursor-pointer flex-col items-start gap-3 rounded-2xl border border-white/12 bg-white/[.05] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#ff8069] hover:bg-[#ff8069]/12"
                  >
                    <span className="text-2xl transition-transform group-hover:scale-110">{opt.emoji}</span>
                    <span className="text-sm font-semibold leading-relaxed text-white/85 group-hover:text-white">
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="space-y-6 text-center"
            >
              <div>
                <Badge className="mb-2 bg-[#e0beff] text-[#17022b]">Orientación inicial</Badge>
                <h3 className="font-heading text-2xl font-extrabold sm:text-3xl">Perfiles sugeridos para empezar a conversar</h3>
                <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-white/70">
                  Esta sugerencia compara tus respuestas con lo que conocemos de cada perro. No es una aprobación automática: el equipo del refugio confirmará contigo convivencia y cuidados.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
                {recommendations.map(({ animal, affinityLabel, reasons, toConfirm }) => {
                  const dogSlug = animal.adoption_slug || (animal.name || 'amigo').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
                  return (
                    <Card key={animal.id} className="overflow-hidden rounded-2xl border border-[#e4d6ed] bg-[var(--color-card)] text-[var(--color-foreground)]">
                      <div className="relative h-40">
                        <ResilientImage src={getMatchmakerImageUrl(animal)} alt={animal.name || 'Perrito'} className="h-full w-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#17022b]/80 to-transparent" />
                        <div className="absolute right-3 top-3">
                          <span className="rounded-full bg-[#e0beff] px-3 py-1 text-[11px] font-extrabold text-[#17022b] shadow-xs">
                            {affinityLabel}
                          </span>
                        </div>
                        <div className="absolute bottom-3 left-3 text-white">
                          <h4 className="font-heading text-2xl font-extrabold">{animal.name}</h4>
                        </div>
                      </div>
                      <CardContent className="space-y-3 p-4">
                        <p className="text-xs leading-relaxed text-[var(--color-muted-foreground)]">{animal.personality_summary || animal.description}</p>
                        <div className="space-y-1.5 rounded-xl bg-[var(--color-secondary)]/60 p-3 text-xs">
                          <p className="font-bold text-[var(--color-primary)]">Por qué podría encajar:</p>
                          {reasons.map((reason) => (
                            <p key={reason} className="flex items-start gap-1.5 text-[var(--color-foreground)]">
                              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                              <span>{reason}</span>
                            </p>
                          ))}
                        </div>
                        <div className="space-y-1 rounded-xl border border-[var(--color-border)] p-3 text-[11px] text-[var(--color-muted-foreground)]">
                          <p className="flex items-center gap-1 font-bold text-[var(--color-foreground)]">
                            <ShieldCheck className="h-3.5 w-3.5 text-[var(--color-primary)]" /> Por confirmar con el refugio:
                          </p>
                          {toConfirm.map((item) => (
                            <p key={item}>• {item}</p>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/adopta/${dogSlug}`}>Leer historia</Link>
                          </Button>
                          {onSelectDog ? (
                            <Button variant="warm" size="sm" onClick={() => onSelectDog(animal)}>
                              Quiero conocerlo <ArrowRight className="ml-1 h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <Button variant="warm" size="sm" asChild>
                              <Link to={`/adopta/${dogSlug}`}>Conocer a {animal.name} <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {!recommendations.length && <p className="rounded-xl border border-dashed border-white/20 p-6 text-center text-sm text-white/60 sm:col-span-2">No hay perritos publicados para sugerir todavía.</p>}
              </div>

              <Button variant="outline" size="sm" onClick={handleReset} className="mt-2 border-white/20 text-white hover:bg-white/10">
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Responder de nuevo
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
