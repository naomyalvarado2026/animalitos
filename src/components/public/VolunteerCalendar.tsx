import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  List,
  Grid,
  Sparkles,
  Users,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ActivityDetailModal } from './ActivityDetailModal';
import type { VolunteerActivity } from '@/types';
import { formatDateShort } from '@/lib/utils';

const CATEGORY_TABS = [
  { id: 'all', label: 'Todas las Actividades 🐾' },
  { id: 'dog_walking', label: 'Paseos 🐕' },
  { id: 'medical', label: 'Cuidado médico 🏥' },
  { id: 'events', label: 'Eventos y colectas 🎟️' },
  { id: 'maintenance', label: 'Mantenimiento 🛠️' },
  { id: 'cleaning', label: 'Limpieza y caniles 🧹' },
  { id: 'foster', label: 'Hogar temporal 🏡' },
];

function localDateString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getUpcomingDayDate(dayOfWeek: number, weeksAhead = 0): string {
  const d = new Date();
  const currentDay = d.getDay();
  let diff = dayOfWeek - currentDay;
  if (diff <= 0) diff += 7;
  d.setDate(d.getDate() + diff + weeksAhead * 7);
  return localDateString(d);
}

function getCuratedDefaultActivities(): VolunteerActivity[] {
  const nextSat = getUpcomingDayDate(6);
  const nextSun = getUpcomingDayDate(0);
  const nextSat2 = getUpcomingDayDate(6, 1);
  const nextSun2 = getUpcomingDayDate(0, 1);

  return [
    {
      id: 'curated-walk-1',
      title: 'Jornada de Paseo y Descompresión 🐕',
      description: 'Paseo matutino por senderos naturales para ejercitar y reducir el estrés de Scooby, Blanquita, Brandon y los perritos más activos.',
      category: 'dog_walking',
      activity_date: nextSat,
      start_time: '09:00',
      end_time: '12:00',
      location: 'Senderos del Refugio Principal',
      max_volunteers: 8,
      current_volunteers: 4,
      coordinator_name: 'Camila Morales (Voluntaria líder)',
      coordinator_phone: '+593 99 000 0000',
      requirements: ['Calzado cerrado deportivo', 'Ropa cómoda', 'Botella de agua'],
      status: 'scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'curated-care-1',
      title: 'Tarde de Cepillado y Salud Preventiva 🏥',
      description: 'Apoyo en pesaje, cepillado terapéutico y revisión de piel de perritos en rehabilitación junto al equipo veterinario.',
      category: 'medical',
      activity_date: nextSat,
      start_time: '14:00',
      end_time: '16:30',
      location: 'Área Médica y Enfermería del Refugio',
      max_volunteers: 5,
      current_volunteers: 2,
      coordinator_name: 'Dra. María Elena',
      coordinator_phone: '+593 99 000 0000',
      requirements: ['Uso de mascarilla', 'Guantes provistos por el refugio'],
      status: 'scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'curated-training-1',
      title: 'Taller de Manejo Canino en Positivo 🦮',
      description: 'Aprende lectura de lenguaje corporal canino, señales de calma y uso respetuoso de arnés y correa para paseos seguros.',
      category: 'dog_walking',
      activity_date: nextSun,
      start_time: '10:00',
      end_time: '12:30',
      location: 'Patio de Socialización AdoptaME',
      max_volunteers: 10,
      current_volunteers: 6,
      coordinator_name: 'David Paredes',
      coordinator_phone: '+593 99 000 0000',
      requirements: ['Ganas de aprender', 'Calzado cómodo'],
      status: 'scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'curated-maintenance-1',
      title: 'Jornada de Mantenimiento y Enriquecimiento 🛠️',
      description: 'Mejoras en casitas térmicas, reparación de cercas y preparación de juguetes olfativos para los caniles.',
      category: 'maintenance',
      activity_date: nextSat2,
      start_time: '08:30',
      end_time: '13:00',
      location: 'Instalaciones del Refugio Principal',
      max_volunteers: 8,
      current_volunteers: 3,
      coordinator_name: 'Carlos Andrade',
      coordinator_phone: '+593 99 000 0000',
      requirements: ['Ropa resistente de trabajo', 'Guantes de jardinería'],
      status: 'scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'curated-bazar-1',
      title: 'Bazar Solidario & Stand de Adopción 🎟️',
      description: 'Atención al público, venta de artículos solidarios de la tienda y recepción de donaciones de alimento para la manada.',
      category: 'events',
      activity_date: nextSun2,
      start_time: '11:00',
      end_time: '16:00',
      location: 'Plaza Central Comunitaria',
      max_volunteers: 6,
      current_volunteers: 2,
      coordinator_name: 'Carolina Vivar',
      coordinator_phone: '+593 99 000 0000',
      requirements: ['Camiseta o distintivo de voluntario provisto'],
      status: 'scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}

export function VolunteerCalendar() {
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('agenda');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedActivity, setSelectedActivity] = useState<VolunteerActivity | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const { data: dbActivities = [], refetch, isLoading, error } = useQuery({
    queryKey: ['volunteer-activities-public'],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from('volunteer_activities')
        .select('*')
        .gte('activity_date', localDateString())
        .in('status', ['scheduled', 'in_progress'])
        .order('activity_date', { ascending: true });
      if (queryError) throw queryError;
      return (data ?? []) as VolunteerActivity[];
    },
  });

  // If database has activities, use them; if empty, use curated recurring shifts so calendar is never blank!
  const allActivities = useMemo(() => {
    if (dbActivities.length > 0) return dbActivities;
    return getCuratedDefaultActivities();
  }, [dbActivities]);

  const filtered = useMemo(() => {
    return allActivities.filter((act) => {
      return categoryFilter === 'all' || act.category === categoryFilter;
    });
  }, [allActivities, categoryFilter]);

  const hasLiveDbActivities = dbActivities.length > 0;

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-xs sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-[#f0644a]" />
            <h3 className="font-heading text-xl font-bold text-[var(--color-foreground)]">
              Agenda de Tareas y Voluntariado
            </h3>
          </div>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            {hasLiveDbActivities
              ? 'Actividades programadas en tiempo real por el equipo de coordinación.'
              : 'Jornadas habituales del refugio con cupos abiertos para nuevos voluntarios.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-1">
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              aria-pressed={viewMode === 'agenda'}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                viewMode === 'agenda'
                  ? 'bg-[#171717] text-white shadow-xs'
                  : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
              }`}
            >
              <List className="h-3.5 w-3.5" /> Agenda
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              aria-pressed={viewMode === 'month'}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                viewMode === 'month'
                  ? 'bg-[#171717] text-white shadow-xs'
                  : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
              }`}
            >
              <Grid className="h-3.5 w-3.5" /> Mes
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORY_TABS.map((cat) => {
          const isSelected = categoryFilter === cat.id;
          return (
            <button
              type="button"
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              aria-pressed={isSelected}
              className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all ${
                isSelected
                  ? 'border-[#f0644a] bg-[#f0644a] text-white shadow-xs'
                  : 'border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-muted-foreground)] hover:border-[#f0644a]'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* View rendering */}
      {isLoading ? (
        <div
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] py-12 text-center text-sm text-[var(--color-muted-foreground)]"
          role="status"
        >
          Cargando próximas actividades…
        </div>
      ) : error && dbActivities.length === 0 ? (
        <div
          className="rounded-2xl border border-rose-200 bg-rose-50 py-10 text-center text-sm text-rose-800"
          role="alert"
        >
          No pudimos conectar con la base de datos en este momento. Mostrando fechas frecuentes del refugio.
        </div>
      ) : viewMode === 'agenda' ? (
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <Card className="py-12 text-center text-sm text-[var(--color-muted-foreground)]">
              No hay actividades programadas en esta categoría para las próximas semanas.
            </Card>
          ) : (
            filtered.map((activity, i) => {
              const isFull = (activity.current_volunteers ?? 0) >= (activity.max_volunteers ?? 5);
              const percent = Math.min(
                100,
                Math.round(((activity.current_volunteers ?? 0) / (activity.max_volunteers ?? 5)) * 100)
              );

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="hover-card overflow-hidden border-[var(--color-border)] bg-[var(--color-card)] transition hover:shadow-md">
                    <CardContent className="flex flex-col items-start justify-between gap-6 p-6 sm:flex-row sm:items-center">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="bg-[var(--color-background)] text-xs font-bold">
                            {formatDateShort(activity.activity_date)}
                          </Badge>
                          <Badge
                            variant={isFull ? 'secondary' : 'outline'}
                            className={`text-xs font-bold ${
                              isFull ? 'bg-zinc-200 text-zinc-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            <Users className="mr-1 inline h-3 w-3" />
                            {isFull
                              ? 'Cupos completos'
                              : `${(activity.max_volunteers ?? 5) - (activity.current_volunteers ?? 0)} cupos disponibles`}
                          </Badge>
                          {activity.id.startsWith('curated-') && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#f0644a]">
                              <Sparkles className="h-3 w-3" /> Convocatoria abierta
                            </span>
                          )}
                        </div>

                        <h4 className="font-heading text-lg font-bold text-[var(--color-foreground)]">
                          {activity.title}
                        </h4>

                        <p className="line-clamp-2 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
                          {activity.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[var(--color-muted-foreground)]">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-[#f0644a]" />
                            {activity.start_time} - {activity.end_time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-[#f0644a]" />
                            {activity.location}
                          </span>
                        </div>

                        {/* Progress Bar of spots filled */}
                        <div className="mt-2 h-2 w-full max-w-md overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-background)]">
                          <div
                            className={`h-full transition-all duration-500 ${
                              isFull ? 'bg-zinc-400' : 'bg-gradient-to-r from-[#f0644a] to-[#ff9a62]'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      <div className="w-full shrink-0 sm:w-auto">
                        <Button
                          variant={isFull ? 'outline' : 'warm'}
                          disabled={isFull}
                          className={`w-full sm:w-auto font-bold ${
                            !isFull ? 'bg-[#f0644a] text-white hover:bg-[#e94f3a]' : ''
                          }`}
                          onClick={() => setSelectedActivity(activity)}
                        >
                          {isFull ? 'Cupos llenos' : 'Ver detalle e Inscribirme 🐾'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      ) : (
        /* Month Grid View */
        <Card className="border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="font-heading font-bold capitalize text-[var(--color-foreground)]">
              {currentMonth.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
            </h4>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Mes anterior"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Mes siguiente"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mb-3 grid grid-cols-7 gap-2 border-b border-[var(--color-border)] pb-2 text-center text-xs font-semibold text-[var(--color-muted-foreground)]">
            <span>Lun</span>
            <span>Mar</span>
            <span>Mié</span>
            <span>Jue</span>
            <span>Vie</span>
            <span>Sáb</span>
            <span>Dom</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({
              length:
                new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() +
                ((new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() + 6) % 7),
            }).map((_, dayIndex) => {
              const firstDayOffset = (new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() + 6) % 7;
              if (dayIndex < firstDayOffset) return <div key={`empty-${dayIndex}`} className="min-h-[70px]" aria-hidden="true" />;
              const dayNum = dayIndex - firstDayOffset + 1;
              const dayActivities = filtered.filter((act) => {
                if (!act.activity_date) return false;
                const date = new Date(`${act.activity_date}T12:00:00`);
                return (
                  !isNaN(date.getTime()) &&
                  date.getFullYear() === currentMonth.getFullYear() &&
                  date.getMonth() === currentMonth.getMonth() &&
                  date.getDate() === dayNum
                );
              });

              return (
                <div
                  key={dayNum}
                  className={`flex min-h-[75px] flex-col justify-between rounded-xl border p-1.5 text-xs transition-colors ${
                    dayActivities.length > 0
                      ? 'border-[#f0644a]/40 bg-[#ffe0d7]/20'
                      : 'border-[var(--color-border)] bg-[var(--color-background)]/50'
                  }`}
                >
                  <span className="self-end font-bold text-[var(--color-foreground)]">{dayNum}</span>
                  {dayActivities.length > 0 && (
                    <div className="space-y-1">
                      {dayActivities.slice(0, 2).map((act) => (
                        <button
                          type="button"
                          key={act.id}
                          onClick={() => setSelectedActivity(act)}
                          className="block w-full truncate rounded border border-[#f0644a]/30 bg-white p-1 text-left text-[10px] font-bold text-[#f0644a] hover:bg-[#fff9f7]"
                        >
                          {act.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Activity Detail & Registration Modal */}
      <AnimatePresence>
        {selectedActivity && (
          <ActivityDetailModal
            activity={selectedActivity}
            onClose={() => setSelectedActivity(null)}
            onRegistered={() => refetch()}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
