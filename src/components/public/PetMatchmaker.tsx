import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RefreshCw, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { ResilientImage } from '@/components/ui/ResilientImage';
import { assetUrl } from '@/lib/assets';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Animal } from '@/types';

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
    title: '¿Con quiénes convivirá la mascota?',
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

export function PetMatchmaker() {
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
  const recommendations = useMemo(() => animalsQuery.data?.map((animal) => {
    const activity = answers[2];
    const home = answers[1];
    let score = 70;
    if (activity === 'active' && ['large', 'extra_large'].includes(animal.size)) score += 15;
    if (activity === 'calm' && animal.size === 'small') score += 12;
    if (home === 'apartment' && animal.size === 'small') score += 10;
    if (home === 'farm' && ['large', 'extra_large'].includes(animal.size)) score += 8;
    if (animal.is_special_needs && activity === 'calm') score += 5;
    return { animal, score: Math.min(99, score) };
  }).sort((a, b) => b.score - a.score).slice(0, 2) ?? [], [animalsQuery.data, answers]);

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
    <Card className="overflow-hidden rounded-[2rem] border-0 bg-[#171717] text-white shadow-2xl">
      <CardContent className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ffcf5a] text-[#171717]"><Sparkles className="h-5 w-5" /></span>
            <div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#ff9a62]">Match responsable</p><h2 className="font-heading text-xl font-extrabold">Descubre tu mejor conexión</h2></div>
          </div>
          {!showResult && (
            <Badge variant="outline" className="border-white/20 text-xs text-white">
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
              <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full rounded-full bg-[#f0644a]" animate={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }} /></div>
              <h3 className="font-heading text-2xl font-extrabold text-white">
                {QUESTIONS[currentStep].title}
              </h3>

              <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
                {QUESTIONS[currentStep].options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSelectOption(opt.value)}
                    className="group flex min-h-32 cursor-pointer flex-col items-start gap-3 rounded-2xl border border-white/12 bg-white/[.045] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#f0644a] hover:bg-[#f0644a]/10"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">{opt.emoji}</span>
                    <span className="text-sm font-semibold leading-relaxed text-white/80 group-hover:text-white">
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-6 text-center"
            >
              <div>
                <Badge variant="warm" className="mb-2">Compatibilidad encontrada</Badge>
                <h3 className="font-heading text-3xl font-extrabold">Tus conexiones más prometedoras</h3>
                <p className="mt-2 text-xs text-white/60">
                  Basado en tu estilo de vida, estos peluditos encajarían perfectamente en tu hogar:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                {recommendations.map(({ animal, score }) => (
                  <Card key={animal.id} className="overflow-hidden rounded-2xl border-white/10 bg-[#fffdf9] text-[#171717]">
                    <div className="h-36 relative">
                      <ResilientImage src={getMatchmakerImageUrl(animal)} alt={animal.name || 'Perrito'} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2">
                        <Badge variant="success" className="shadow-xs font-bold">
                          {score}% Match
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-2">
                      <h4 className="font-heading text-xl font-extrabold">{animal.name}</h4>
                      <p className="text-xs font-semibold text-[#f0644a]">{animal.breed || 'Perrito rescatado'}</p>
                      <p className="text-xs leading-relaxed text-[#6e6a64]">{animal.description || 'Conoce su historia y descubre si son un buen match.'}</p>
                      <Button variant="warm" size="sm" className="w-full mt-2" asChild>
                        <Link to={`/adopta/${animal.adoption_slug || (animal.name || 'amigo').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')}`}>Conocer a {animal.name} <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {!recommendations.length && <p className="rounded-xl border border-dashed border-white/20 p-6 text-center text-sm text-white/60 sm:col-span-2">No hay perritos publicados para generar un match todavía.</p>}
              </div>

              <Button variant="outline" size="sm" onClick={handleReset} className="mt-2 border-white/20 text-white hover:bg-white/10">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Repetir Test
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
