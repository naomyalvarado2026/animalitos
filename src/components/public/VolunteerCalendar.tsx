import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  List,
  Grid,
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
  { id: 'medical', label: 'Médico 🏥' },
  { id: 'events', label: 'Eventos 🎟️' },
  { id: 'maintenance', label: 'Mantenimiento 🛠️' },
];

export function VolunteerCalendar() {
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('agenda');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedActivity, setSelectedActivity] = useState<VolunteerActivity | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const { data: activities = [], refetch } = useQuery({
    queryKey: ['volunteer-activities-public'],
    queryFn: async () => {
        const { data, error } = await supabase
          .from('volunteer_activities')
          .select('*')
          .order('activity_date', { ascending: true });
        if (error) throw error;
        return (data ?? []) as VolunteerActivity[];
    },
  });

  const filtered = activities.filter((act) => {
    return categoryFilter === 'all' || act.category === categoryFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[var(--color-card)] p-4 rounded-2xl border border-[var(--color-border)] shadow-xs">
        <div>
          <h3 className="font-heading text-xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-[var(--color-primary)]" />
            Calendario de Tareas y Voluntariado
          </h3>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Elige una actividad con cupos disponibles y únete como voluntario.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-[var(--color-background)] p-1 rounded-xl border border-[var(--color-border)]">
            <button
            onClick={() => setViewMode('agenda')}
            aria-pressed={viewMode === 'agenda'}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'agenda'
                  ? 'brand-gradient-bg text-white shadow-xs'
                  : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
              }`}
            >
              <List className="h-3.5 w-3.5" /> Agenda
            </button>
            <button
            onClick={() => setViewMode('month')}
            aria-pressed={viewMode === 'month'}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'month'
                  ? 'brand-gradient-bg text-white shadow-xs'
                  : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
              }`}
            >
              <Grid className="h-3.5 w-3.5" /> Mensual
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORY_TABS.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            aria-pressed={categoryFilter === cat.id}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
              categoryFilter === cat.id
                ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border-[var(--color-primary)] font-semibold shadow-xs'
                : 'bg-[var(--color-card)] text-[var(--color-muted-foreground)] border-[var(--color-border)] hover:border-[var(--color-primary)]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* View rendering */}
      {viewMode === 'agenda' ? (
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <Card className="text-center py-12 text-[var(--color-muted-foreground)]">
              No hay actividades programadas en esta categoría.
            </Card>
          ) : (
            filtered.map((activity, i) => {
              const isFull = activity.current_volunteers >= activity.max_volunteers;
              const percent = Math.min(100, Math.round((activity.current_volunteers / activity.max_volunteers) * 100));

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="hover-card overflow-hidden border-[var(--color-border)]">
                    <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs bg-[var(--color-background)]">
                            {formatDateShort(activity.activity_date)}
                          </Badge>
                          <Badge variant={isFull ? 'secondary' : 'success'} className="text-xs">
                            {isFull ? 'Cupos Llenos' : `${activity.current_volunteers} / ${activity.max_volunteers} Voluntarios`}
                          </Badge>
                        </div>

                        <h4 className="font-heading text-lg font-bold text-[var(--color-foreground)]">
                          {activity.title}
                        </h4>

                        <p className="text-xs text-[var(--color-muted-foreground)] line-clamp-2">
                          {activity.description}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-[var(--color-muted-foreground)] pt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                            {activity.start_time} - {activity.end_time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                            {activity.location}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full max-w-md bg-[var(--color-background)] rounded-full h-2 overflow-hidden border border-[var(--color-border)] mt-2">
                          <div
                            className={`h-full transition-all duration-500 ${
                              isFull ? 'bg-zinc-400' : 'brand-gradient-bg'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      <div className="shrink-0 w-full sm:w-auto">
                        <Button
                          variant={isFull ? 'outline' : 'warm'}
                          disabled={isFull}
                          className="w-full sm:w-auto"
                          onClick={() => setSelectedActivity(activity)}
                        >
                          {isFull ? 'Completo' : 'Inscribirme 🐾'}
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
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-heading font-bold capitalize">{currentMonth.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}</h4>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" aria-label="Mes anterior" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" aria-label="Mes siguiente" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-[var(--color-muted-foreground)] mb-3 pb-2 border-b border-[var(--color-border)]">
            <span>Lun</span>
            <span>Mar</span>
            <span>Mié</span>
            <span>Jue</span>
            <span>Vie</span>
            <span>Sáb</span>
            <span>Dom</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: (new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()) + ((new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() + 6) % 7) }).map((_, dayIndex) => {
              const firstDayOffset = (new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() + 6) % 7;
              if (dayIndex < firstDayOffset) return <div key={`empty-${dayIndex}`} className="min-h-[70px]" aria-hidden="true" />;
              const dayNum = dayIndex - firstDayOffset + 1;
              const dayActivities = filtered.filter(
                (act) => { const date = new Date(`${act.activity_date}T12:00:00`); return date.getFullYear() === currentMonth.getFullYear() && date.getMonth() === currentMonth.getMonth() && date.getDate() === dayNum; }
              );

              return (
                <div
                  key={dayNum}
                  className={`min-h-[70px] p-1.5 rounded-xl border transition-colors flex flex-col justify-between text-xs ${
                    dayActivities.length > 0
                      ? 'border-[var(--color-primary)] bg-[var(--color-accent)]/20'
                      : 'border-[var(--color-border)] bg-[var(--color-background)]/50'
                  }`}
                >
                  <span className="font-bold text-[var(--color-foreground)] self-end">{dayNum}</span>
                  {dayActivities.length > 0 && (
                    <div className="space-y-1">
                      {dayActivities.slice(0, 2).map((act) => (
                        <button
                          key={act.id}
                          onClick={() => setSelectedActivity(act)}
                          className="w-full text-left truncate bg-[var(--color-card)] p-1 rounded border border-[var(--color-border)] text-[10px] font-semibold text-[var(--color-primary)] hover:underline block"
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
