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

export function VolunteerCalendar() {
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('agenda');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedActivity, setSelectedActivity] = useState<VolunteerActivity | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const { data: dbActivities = [], refetch, isLoading, error } = useQuery({
    queryKey: ['volunteer-activities-public'],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from('public_volunteer_activities')
        .select('*')
        .gte('activity_date', localDateString())
        .eq('status', 'scheduled')
        .order('activity_date', { ascending: true });
      if (queryError) throw queryError;
      return (data ?? []) as VolunteerActivity[];
    },
  });

  const allActivities = useMemo(() => dbActivities, [dbActivities]);

  const filtered = useMemo(() => {
    return allActivities.filter((act) => {
      return categoryFilter === 'all' || act.category === categoryFilter;
    });
  }, [allActivities, categoryFilter]);

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
            'Turnos confirmados por el equipo. El cupo se reserva al completar la inscripción.'
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
      ) : error ? (
        <div
          className="rounded-2xl border border-rose-200 bg-rose-50 py-10 text-center text-sm text-rose-800"
          role="alert"
        >
          No pudimos cargar los turnos confirmados. Intenta nuevamente en un momento.
          <Button variant="outline" size="sm" className="mx-auto mt-4 block" onClick={() => refetch()}>Reintentar</Button>
        </div>
      ) : allActivities.length === 0 ? (
        <Card className="space-y-3 py-10 text-center">
          <p className="font-heading text-lg font-bold text-[var(--color-foreground)]">Aún no hay jornadas confirmadas.</p>
          <p className="mx-auto max-w-lg text-sm text-[var(--color-muted-foreground)]">El equipo publicará aquí los próximos turnos con fecha, horario y cupos reales. Puedes dejar tu postulación para coordinar una futura jornada.</p>
          <a href="#volunteer-form" className="mx-auto inline-flex min-h-11 items-center rounded-full bg-[#f0644a] px-5 text-sm font-bold text-white">Postularme como voluntario</a>
        </Card>
      ) : viewMode === 'agenda' ? (
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <Card className="py-12 text-center text-sm text-[var(--color-muted-foreground)]">
              No hay jornadas confirmadas en esta categoría. Puedes dejar tu postulación para futuras fechas.
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
                          className={`w-full sm:w-auto font-bold ${
                            !isFull ? 'bg-[#f0644a] text-white hover:bg-[#e94f3a]' : ''
                          }`}
                          onClick={() => setSelectedActivity(activity)}
                        >
                          {isFull ? 'Ver lista de espera' : 'Ver detalle e Inscribirme 🐾'}
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
