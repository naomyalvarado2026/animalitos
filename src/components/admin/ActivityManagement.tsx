import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Calendar, Plus, Edit2, Trash2, Users, Clock, MapPin, Check, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { VolunteerActivity, EventType, RecurrencePattern } from '@/types';
import { formatDateShort } from '@/lib/utils';
import { ParticipantRosterModal } from './ParticipantRosterModal';
import { SmartSchedulePicker } from '@/components/ui/SmartSchedulePicker';

const activitySchema = z.object({
  title: z.string().min(3, 'Título requerido'),
  description: z.string().min(10, 'Descripción requerida'),
  category: z.enum(['dog_walking', 'medical', 'events', 'maintenance', 'cleaning', 'foster']),
  event_type: z.enum(['single_day', 'multi_day']).default('single_day'),
  activity_date: z.string().min(1, 'Fecha inicio requerida'),
  end_date: z.string().optional(),
  recurrence_pattern: z.enum(['none', 'weekly', 'monthly', 'yearly']).default('none'),
  start_time: z.string().min(1, 'Hora inicio requerida'),
  end_time: z.string().min(1, 'Hora fin requerida'),
  location: z.string().min(2, 'Ubicación requerida'),
  max_volunteers: z.coerce.number().min(1, 'Mínimo 1 voluntario'),
  coordinator_name: z.string().min(2, 'Coordinador requerido'),
});

type ActivityForm = z.infer<typeof activitySchema>;

export function ActivityManagement() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingAct, setEditingAct] = useState<VolunteerActivity | null>(null);
  const [rosterAct, setRosterAct] = useState<VolunteerActivity | null>(null);

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['admin-activities'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('volunteer_activities')
          .select('*')
          .order('activity_date', { ascending: true });
        if (error) throw error;
        return (data ?? []) as VolunteerActivity[];
      } catch (error) {
        throw error instanceof Error ? error : new Error('No se pudieron cargar las actividades.');
      }
    },
  });

  const form = useForm<ActivityForm>({
    resolver: zodResolver(activitySchema) as any,
    defaultValues: {
      category: 'dog_walking',
      event_type: 'single_day',
      recurrence_pattern: 'none',
      activity_date: new Date().toISOString().split('T')[0],
      start_time: '09:00',
      end_time: '12:00',
      location: 'Refugio Principal',
      max_volunteers: 6,
      coordinator_name: 'Equipo Animalitos',
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: ActivityForm) => {
      if (editingAct) {
        const { error } = await supabase.from('volunteer_activities').update(data).eq('id', editingAct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('volunteer_activities').insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-activities'] });
      qc.invalidateQueries({ queryKey: ['volunteer-activities-public'] });
      toast.success(editingAct ? 'Actividad actualizada.' : 'Nueva actividad programada con éxito.');
      setShowForm(false);
      setEditingAct(null);
      form.reset();
    },
    onError: () => toast.error('No se pudo guardar la actividad en Supabase.'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('volunteer_activities').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-activities'] });
      qc.invalidateQueries({ queryKey: ['volunteer-activities-public'] });
      toast.success('Actividad eliminada.');
    },
    onError: () => toast.error('No se pudo eliminar la actividad en Supabase.'),
  });

  function startEdit(act: VolunteerActivity) {
    setEditingAct(act);
    form.reset({
      title: act.title,
      description: act.description,
      category: act.category,
      event_type: act.event_type ?? 'single_day',
      activity_date: act.activity_date,
      end_date: act.end_date ?? '',
      recurrence_pattern: act.recurrence_pattern ?? 'none',
      start_time: act.start_time,
      end_time: act.end_time,
      location: act.location,
      max_volunteers: act.max_volunteers,
      coordinator_name: act.coordinator_name,
    });
    setShowForm(true);
  }

  const selectedEventType = form.watch('event_type');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-[var(--color-primary)]" />
            Gestión de Actividades &amp; Asignación de Personas
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            Programa eventos multidía/recurrentes e inscribe personas a cada fecha.
          </p>
        </div>
        <Button variant="warm" onClick={() => { setEditingAct(null); form.reset(); setShowForm(!showForm); }}>
          <Plus className="h-4 w-4 mr-2" />
          Programar Actividad
        </Button>
      </div>

      {showForm && (
        <Card className="border-[var(--color-primary)]">
          <CardHeader>
            <CardTitle className="text-base">{editingAct ? 'Editar Actividad' : 'Nueva Actividad o Evento'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(d => saveMutation.mutate(d))} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="title">Título de la Actividad / Evento</Label>
                <Input id="title" {...form.register('title')} placeholder="Ej: Gran Bazar Anual de Donaciones 🎟️" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category">Categoría</Label>
                <select id="category" {...form.register('category')} className="flex h-9 w-full rounded-lg border border-[var(--color-input)] bg-transparent px-3 py-1 text-sm">
                  <option value="dog_walking">Paseo de Perros 🐕</option>
                  <option value="medical">Apoyo Médico 🏥</option>
                  <option value="events">Evento / Colecta 🎟️</option>
                  <option value="maintenance">Mantenimiento 🛠️</option>
                  <option value="cleaning">Limpieza 🧹</option>
                  <option value="foster">Hogar Temporal 🏡</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <Label className="mb-2 block">Programación de Fecha, Horarios y Repetición</Label>
                <SmartSchedulePicker
                  value={{
                    event_type: form.watch('event_type'),
                    start_date: form.watch('activity_date'),
                    end_date: form.watch('end_date') || undefined,
                    start_time: form.watch('start_time'),
                    end_time: form.watch('end_time'),
                    recurrence_pattern: form.watch('recurrence_pattern'),
                  }}
                  onChange={(sched) => {
                    form.setValue('event_type', sched.event_type);
                    form.setValue('activity_date', sched.start_date);
                    form.setValue('end_date', sched.end_date || '');
                    form.setValue('start_time', sched.start_time);
                    form.setValue('end_time', sched.end_time);
                    form.setValue('recurrence_pattern', sched.recurrence_pattern);
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="location">Ubicación</Label>
                <Input id="location" {...form.register('location')} placeholder="Ej: Refugio Principal" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="max_volunteers">Cupo Máximo de Voluntarios</Label>
                <Input id="max_volunteers" type="number" {...form.register('max_volunteers')} />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="coordinator_name">Coordinador Encargado</Label>
                <Input id="coordinator_name" {...form.register('coordinator_name')} placeholder="Nombre del encargado" />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="description">Descripción / Tareas a realizar</Label>
                <Textarea id="description" rows={3} {...form.register('description')} />
              </div>

              <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" variant="warm" disabled={saveMutation.isPending}>Guardar Actividad</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{activities.length} Actividad(es) Programada(s)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-[var(--color-muted-foreground)]">Cargando...</div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-muted-foreground)]">No hay actividades programadas.</div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {activities.map((act) => (
                <div key={act.id} className="flex items-center justify-between py-4 gap-4 flex-wrap">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-heading font-bold text-base">{act.title}</h3>
                      <Badge variant="warm" className="text-xs">{act.category}</Badge>
                      <Badge variant="outline" className="text-xs">
                        {formatDateShort(act.activity_date)} {act.end_date ? `al ${formatDateShort(act.end_date)}` : ''}
                      </Badge>
                      {act.recurrence_pattern !== 'none' && (
                        <Badge variant="secondary" className="text-[10px]">Recurrencia: {act.recurrence_pattern}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-muted-foreground)]">{act.location} · {act.start_time} - {act.end_time} · Encargado: {act.coordinator_name}</p>
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      👥 {act.current_volunteers} / {act.max_volunteers} Voluntarios Inscritos
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setRosterAct(act)}>
                      <Users className="h-4 w-4 mr-1.5" /> Personas / Inscritos
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => startEdit(act)} aria-label="Editar">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-[var(--color-destructive)]" onClick={() => { if (confirm('¿Eliminar actividad?')) deleteMutation.mutate(act.id); }} aria-label="Eliminar">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Roster Modal */}
      {rosterAct && (
        <ParticipantRosterModal
          activity={rosterAct}
          onClose={() => setRosterAct(null)}
        />
      )}
    </div>
  );
}
