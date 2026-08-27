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
    <Card className="border-[var(--color-primary)] overflow-hidden shadow-lg bg-gradient-to-br from-[var(--color-card)] to-[var(--color-accent)]/20">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h2 className="font-heading text-xl font-bold">Matchmaker de Mascotas 🐾</h2>
          </div>
          {!showResult && (
            <Badge variant="outline" className="text-xs">
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
              <h3 className="font-heading text-lg font-semibold text-[var(--color-foreground)]">
                {QUESTIONS[currentStep].title}
              </h3>

              <div className="grid grid-cols-1 gap-3 pt-2">
                {QUESTIONS[currentStep].options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSelectOption(opt.value)}
                    className="flex items-center gap-3 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-primary)] hover:bg-[var(--color-accent)] transition-all text-left group cursor-pointer"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">{opt.emoji}</span>
                    <span className="text-sm font-medium text-[var(--color-foreground)] group-hover:text-[var(--color-primary)]">
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
                <Badge variant="warm" className="mb-2">¡Compatibilidad Encontrada!</Badge>
                <h3 className="font-heading text-2xl font-bold">Tus Compañeros Ideales</h3>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                  Basado en tu estilo de vida, estos peluditos encajarían perfectamente en tu hogar:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                {recommendations.map(({ animal, score }) => (
                  <Card key={animal.id} className="overflow-hidden border-[var(--color-border)] hover-card">
                    <div className="h-36 relative">
                      <ResilientImage src={assetUrl(animal.main_image_url)} alt={animal.name} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2">
                        <Badge variant="success" className="shadow-xs font-bold">
                          {score}% Match
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-2">
                      <h4 className="font-heading font-bold text-lg">{animal.name}</h4>
                      <p className="text-xs text-[var(--color-primary)] font-semibold">{animal.breed || 'Perrito rescatado'}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">{animal.description || 'Conoce su historia y descubre si son un buen match.'}</p>
                      <Button variant="warm" size="sm" className="w-full mt-2" asChild>
                        <Link to={`/adopta/${animal.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>Conocer a {animal.name} <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {!recommendations.length && <p className="sm:col-span-2 rounded-xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-muted-foreground)]">No hay perritos publicados para generar un match todavía.</p>}
              </div>

              <Button variant="outline" size="sm" onClick={handleReset} className="mt-2">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Repetir Test
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
