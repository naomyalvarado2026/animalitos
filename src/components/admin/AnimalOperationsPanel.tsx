import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, Check, ClipboardList, HeartPulse, MapPin, Plus, Stethoscope, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Animal, AnimalMedicalRecord, AnimalMovement, AnimalTask } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const today = () => new Date().toISOString().slice(0, 10);

export function AnimalOperationsPanel({ animal, onClose }: { animal: Animal; onClose: () => void }) {
  const qc = useQueryClient();
  const [medicalTitle, setMedicalTitle] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [medicalDue, setMedicalDue] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [movementTo, setMovementTo] = useState('');
  const [movementNotes, setMovementNotes] = useState('');

  const records = useQuery({ queryKey: ['animal-medical-records', animal.id], queryFn: async () => {
    const { data, error } = await supabase.from('animal_medical_records').select('*').eq('animal_id', animal.id).order('occurred_on', { ascending: false });
    if (error) throw error;
    return (data ?? []) as AnimalMedicalRecord[];
  } });
  const tasks = useQuery({ queryKey: ['animal-tasks', animal.id], queryFn: async () => {
    const { data, error } = await supabase.from('animal_tasks').select('*').eq('animal_id', animal.id).neq('status', 'cancelled').order('due_on', { ascending: true, nullsFirst: false });
    if (error) throw error;
    return (data ?? []) as AnimalTask[];
  } });
  const movements = useQuery({ queryKey: ['animal-movements', animal.id], queryFn: async () => {
    const { data, error } = await supabase.from('animal_movements').select('*').eq('animal_id', animal.id).order('moved_on', { ascending: false });
    if (error) throw error;
    return (data ?? []) as AnimalMovement[];
  } });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['animal-medical-records', animal.id] });
    void qc.invalidateQueries({ queryKey: ['animal-tasks', animal.id] });
    void qc.invalidateQueries({ queryKey: ['animal-movements', animal.id] });
  };
  const addMedical = useMutation({ mutationFn: async () => {
    if (medicalTitle.trim().length < 3) throw new Error('Escribe un título para el registro.');
    const { error } = await supabase.from('animal_medical_records').insert({ animal_id: animal.id, record_type: 'note', title: medicalTitle.trim(), notes: medicalNotes.trim(), occurred_on: today(), next_due_on: medicalDue || null });
    if (error) throw error;
  }, onSuccess: () => { setMedicalTitle(''); setMedicalNotes(''); setMedicalDue(''); invalidate(); toast.success('Registro médico añadido.'); }, onError: (e: Error) => toast.error(e.message) });
  const addTask = useMutation({ mutationFn: async () => {
    if (taskTitle.trim().length < 3) throw new Error('Escribe una tarea.');
    const { error } = await supabase.from('animal_tasks').insert({ animal_id: animal.id, title: taskTitle.trim(), due_on: taskDue || null, priority: 'normal', status: 'open' });
    if (error) throw error;
  }, onSuccess: () => { setTaskTitle(''); setTaskDue(''); invalidate(); toast.success('Tarea añadida.'); }, onError: (e: Error) => toast.error(e.message) });
  const addMovement = useMutation({ mutationFn: async () => {
    if (!movementTo.trim()) throw new Error('Indica el destino o ubicación.');
    const { error } = await supabase.from('animal_movements').insert({ animal_id: animal.id, movement_type: 'other', from_location: animal.location || null, to_location: movementTo.trim(), notes: movementNotes.trim(), moved_on: today() });
    if (error) throw error;
  }, onSuccess: () => { setMovementTo(''); setMovementNotes(''); invalidate(); toast.success('Movimiento registrado.'); }, onError: (e: Error) => toast.error(e.message) });
  const completeTask = useMutation({ mutationFn: async (task: AnimalTask) => {
    const { error } = await supabase.from('animal_tasks').update({ status: 'done', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', task.id);
    if (error) throw error;
  }, onSuccess: invalidate, onError: () => toast.error('No se pudo completar la tarea.') });

  return <Card className="border-[var(--color-primary)] shadow-md">
    <CardHeader className="flex flex-row items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-lg"><HeartPulse className="h-5 w-5 text-[var(--color-primary)]" />Ficha operativa · {animal.name}</CardTitle><p className="mt-1 text-sm text-[var(--color-muted-foreground)]">Salud, tareas y movimientos internos.</p></div><Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar ficha"><X className="h-4 w-4" /></Button></CardHeader>
    <CardContent className="grid gap-4 lg:grid-cols-3">
      <section className="space-y-3 rounded-2xl border border-[var(--color-border)] p-4" aria-labelledby="medical-title"><h3 id="medical-title" className="flex items-center gap-2 font-heading font-bold"><Stethoscope className="h-4 w-4 text-rose-500" />Salud</h3><div className="space-y-2"><Label htmlFor="medical-title-input">Título</Label><Input id="medical-title-input" value={medicalTitle} onChange={(e) => setMedicalTitle(e.target.value)} placeholder="Ej. Control veterinario" /><Textarea value={medicalNotes} onChange={(e) => setMedicalNotes(e.target.value)} placeholder="Notas clínicas o indicaciones" rows={2} /><div><Label htmlFor="medical-due">Próximo control</Label><Input id="medical-due" type="date" value={medicalDue} onChange={(e) => setMedicalDue(e.target.value)} /></div><Button size="sm" variant="warm" onClick={() => addMedical.mutate()} disabled={addMedical.isPending}><Plus className="mr-1 h-4 w-4" />Añadir registro</Button></div>{records.data?.slice(0, 3).map((record) => <div key={record.id} className="border-t border-[var(--color-border)] pt-2 text-sm"><p className="font-semibold">{record.title}</p><p className="text-xs text-[var(--color-muted-foreground)]">{record.occurred_on}{record.next_due_on ? ` · Próximo: ${record.next_due_on}` : ''}</p>{record.notes && <p className="mt-1 text-xs">{record.notes}</p>}</div>)}</section>
      <section className="space-y-3 rounded-2xl border border-[var(--color-border)] p-4" aria-labelledby="tasks-title"><h3 id="tasks-title" className="flex items-center gap-2 font-heading font-bold"><ClipboardList className="h-4 w-4 text-blue-500" />Tareas</h3><div className="flex gap-2"><Input aria-label="Nueva tarea" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Ej. Administrar medicamento" /><Input aria-label="Fecha de tarea" className="w-36" type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} /></div><Button size="sm" variant="warm" onClick={() => addTask.mutate()} disabled={addTask.isPending}><Plus className="mr-1 h-4 w-4" />Añadir tarea</Button>{tasks.data?.slice(0, 5).map((task) => <div key={task.id} className="flex items-center justify-between gap-2 border-t border-[var(--color-border)] pt-2 text-sm"><div className="min-w-0"><p className={task.status === 'done' ? 'truncate line-through opacity-60' : 'truncate'}>{task.title}</p><p className="text-xs text-[var(--color-muted-foreground)]">{task.due_on || 'Sin fecha'} · <Badge variant={task.priority === 'urgent' ? 'destructive' : 'outline'} className="text-[10px]">{task.status === 'done' ? 'Completada' : 'Pendiente'}</Badge></p></div>{task.status !== 'done' && <Button size="icon" variant="ghost" onClick={() => completeTask.mutate(task)} aria-label={`Completar ${task.title}`}><Check className="h-4 w-4 text-emerald-500" /></Button>}</div>)}</section>
      <section className="space-y-3 rounded-2xl border border-[var(--color-border)] p-4" aria-labelledby="movement-title"><h3 id="movement-title" className="flex items-center gap-2 font-heading font-bold"><MapPin className="h-4 w-4 text-amber-500" />Movimientos</h3><div><Label htmlFor="movement-to">Nueva ubicación</Label><Input id="movement-to" value={movementTo} onChange={(e) => setMovementTo(e.target.value)} placeholder="Ej. Hogar temporal · Ana" /></div><Textarea value={movementNotes} onChange={(e) => setMovementNotes(e.target.value)} placeholder="Motivo o detalle del traslado" rows={2} /><Button size="sm" variant="warm" onClick={() => addMovement.mutate()} disabled={addMovement.isPending}><Plus className="mr-1 h-4 w-4" />Registrar movimiento</Button>{movements.data?.slice(0, 5).map((movement) => <div key={movement.id} className="border-t border-[var(--color-border)] pt-2 text-sm"><p className="font-semibold">{movement.to_location || 'Sin destino'}</p><p className="text-xs text-[var(--color-muted-foreground)]">{movement.moved_on}{movement.from_location ? ` · desde ${movement.from_location}` : ''}</p>{movement.notes && <p className="mt-1 text-xs">{movement.notes}</p>}</div>)}</section>
    </CardContent>
  </Card>;
}
