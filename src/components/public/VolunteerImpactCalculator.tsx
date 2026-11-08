import { useState, useId } from 'react';
import { motion } from 'motion/react';
import { Heart, Sparkles, Footprints, ShieldCheck, Clock, Smile, ArrowRight } from 'lucide-react';
import type { VolunteerArea } from '@/types';

const AREA_TABS: { id: VolunteerArea; label: string; icon: string }[] = [
  { id: 'dog_walking', label: 'Paseos y compañía', icon: '🐕' },
  { id: 'medical_support', label: 'Cuidado y salud', icon: '🏥' },
  { id: 'social_media', label: 'Historias y difusión', icon: '📸' },
  { id: 'foster', label: 'Hogar temporal', icon: '🏡' },
];

export function VolunteerImpactCalculator({
  onSelectHoursAndArea,
}: {
  onSelectHoursAndArea?: (hours: number, area: VolunteerArea) => void;
}) {
  const [hoursPerMonth, setHoursPerMonth] = useState<number>(4);
  const [selectedArea, setSelectedArea] = useState<VolunteerArea>('dog_walking');
  const sliderId = useId();

  // Dynamic calculations based on hours and area
  const walks = selectedArea === 'dog_walking' ? Math.round(hoursPerMonth * 1.8) : Math.round(hoursPerMonth * 0.8);
  const dogsSocialized = Math.max(2, Math.round(hoursPerMonth * 0.75));
  const careHours = Math.round(hoursPerMonth * (selectedArea === 'medical_support' ? 1.5 : 1.0));
  const adoptionReach = Math.round(hoursPerMonth * (selectedArea === 'social_media' ? 350 : 120));

  const tier =
    hoursPerMonth <= 3
      ? { label: 'Semilla de Esperanza 🌱', text: 'Con 1 o 2 visitas al mes ya eres el momento más esperado para un perrito temeroso.' }
      : hoursPerMonth <= 8
      ? { label: 'Guardián de la Manada 🐾', text: 'Tu constancia permite que perros con traumas reaprendan a confiar y a caminar con correa.' }
      : { label: 'Pilar del Refugio 💖', text: 'Un impacto transformador que alivia la carga diaria del equipo veterinario y operativo.' };

  function handleApply() {
    if (onSelectHoursAndArea) {
      onSelectHoursAndArea(hoursPerMonth, selectedArea);
    } else {
      document.getElementById('volunteer-form')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-[#171717] p-7 text-white shadow-2xl sm:p-12">
        {/* Ambient background glow */}
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-72 w-72 rounded-full bg-[#f0644a]/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-72 w-72 rounded-full bg-[#ffcf5a]/15 blur-3xl" />

        <div className="relative grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-[.16em] text-[#ff9b87]">
              <Sparkles className="h-3.5 w-3.5" /> Simulador de impacto
            </div>
            <h2 className="mt-4 font-heading text-4xl font-extrabold leading-[1] tracking-[-.05em] sm:text-5xl">
              Calcula la huella de tu tiempo.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75">
              No necesitas días enteros. Mira lo que ocurre en la vida de los 12 perritos del refugio con solo unas pocas horas al mes:
            </p>

            {/* Area filter pills */}
            <div className="mt-6 flex flex-wrap gap-2">
              {AREA_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedArea(tab.id)}
                  aria-pressed={selectedArea === tab.id}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                    selectedArea === tab.id
                      ? 'border-[#ffcf5a] bg-[#ffcf5a] text-[#171717] shadow-xs'
                      : 'border-white/15 bg-white/5 text-white/70 hover:border-white/40'
                  }`}
                >
                  <span className="mr-1">{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>

            {/* Range Slider */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xs">
              <div className="flex items-center justify-between">
                <label htmlFor={sliderId} className="text-sm font-semibold text-white/90">
                  Horas que puedes dedicar al mes:
                </label>
                <span className="font-heading text-2xl font-extrabold text-[#ffcf5a]">
                  {hoursPerMonth} {hoursPerMonth === 1 ? 'hora' : 'horas'} / mes
                </span>
              </div>

              <input
                id={sliderId}
                type="range"
                min={2}
                max={16}
                step={2}
                value={hoursPerMonth}
                onChange={(e) => setHoursPerMonth(Number(e.target.value))}
                className="mt-5 h-2.5 w-full cursor-pointer appearance-none rounded-lg bg-white/20 accent-[#f0644a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffcf5a]"
              />

              <div className="mt-3 flex justify-between text-[11px] font-semibold text-white/40">
                <span>2 hrs (1 turno quincenal)</span>
                <span>8 hrs (1 sábado c/ 15 días)</span>
                <span>16 hrs (apoyo semanal)</span>
              </div>
            </div>

            {/* Motivational tier callout */}
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#ffcf5a]/25 bg-[#ffcf5a]/10 p-4">
              <Heart className="mt-0.5 h-5 w-5 shrink-0 text-[#ffcf5a]" />
              <div className="flex-1">
                <p className="font-heading text-sm font-extrabold text-[#ffcf5a]">{tier.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-white/80">{tier.text}</p>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleApply}
                className="inline-flex items-center gap-2 text-xs font-bold text-[#ff9b87] underline hover:text-white"
              >
                Quiero postularme con este tiempo y área <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Impact Display Cards */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              key={`walks-${walks}`}
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xs"
            >
              <Footprints className="h-6 w-6 text-[#ff9b87]" />
              <p className="mt-6 font-heading text-4xl font-extrabold text-white sm:text-5xl">
                ~{walks}
              </p>
              <p className="mt-1 text-xs font-semibold text-white/70">
                Paseos terapéuticos y momentos de aire libre
              </p>
            </motion.div>

            <motion.div
              key={`dogs-${dogsSocialized}`}
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xs"
            >
              <Smile className="h-6 w-6 text-[#ffcf5a]" />
              <p className="mt-6 font-heading text-4xl font-extrabold text-white sm:text-5xl">
                {dogsSocialized}
              </p>
              <p className="mt-1 text-xs font-semibold text-white/70">
                Perritos que reciben afecto y reducen su ansiedad
              </p>
            </motion.div>

            <motion.div
              key={`care-${careHours}`}
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xs"
            >
              <Clock className="h-6 w-6 text-[#a8d5ad]" />
              <p className="mt-6 font-heading text-4xl font-extrabold text-white sm:text-5xl">
                {careHours}h
              </p>
              <p className="mt-1 text-xs font-semibold text-white/70">
                Horas de respiro directo para el equipo del refugio
              </p>
            </motion.div>

            <motion.div
              key={`reach-${adoptionReach}`}
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xs"
            >
              <ShieldCheck className="h-6 w-6 text-[#cbdcf4]" />
              <p className="mt-6 font-heading text-4xl font-extrabold text-white sm:text-5xl">
                +{adoptionReach}
              </p>
              <p className="mt-1 text-xs font-semibold text-white/70">
                Personas alcanzadas con fotos e historias de adopción
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
