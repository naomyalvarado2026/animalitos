import { useState } from 'react';
import { motion } from 'motion/react';
import { X, UserPlus, Trash2, MessageCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { VolunteerActivity, ActivityRegistration } from '@/types';
import { formatDateShort } from '@/lib/utils';

export function ParticipantRosterModal({
  activity,
  onClose,
}: {
  activity: VolunteerActivity;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [consentConfirmed, setConsentConfirmed] = useState(false);

  const { data: registrations = [], isLoading, refetch } = useQuery({
    queryKey: ['activity-registrations', activity.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_registrations')
        .select('*')
        .eq('activity_id', activity.id)
        .order('created_at', { ascending: false });
      if (error) return [];
      return data as ActivityRegistration[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('activity_registrations').insert([
        {
          activity_id: activity.id,
          volunteer_name: name,
          volunteer_email: email,
          volunteer_phone: phone,
          notes: notes || null,
          assigned_by_admin: true,
          consent_at: consentConfirmed ? new Date().toISOString() : null,
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activity-registrations', activity.id] });
      qc.invalidateQueries({ queryKey: ['admin-activities'] });
      qc.invalidateQueries({ queryKey: ['volunteer-activities-public'] });
      toast.success(`Persona inscrita a ${activity.title}.`);
      setShowAddForm(false);
      setName('');
      setEmail('');
      setPhone('');
      setNotes('');
      setConsentConfirmed(false);
      refetch();
    },
    onError: () => toast.error('Error al registrar la persona.'),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, attendance_status }: { id: string; attendance_status: NonNullable<ActivityRegistration['attendance_status']> }) => {
      const { error } = await supabase.from('activity_registrations').update({ attendance_status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['activity-registrations', activity.id] }),
        qc.invalidateQueries({ queryKey: ['admin-activities'] }),
        qc.invalidateQueries({ queryKey: ['volunteer-activities-public'] }),
      ]);
      toast.success('Asistencia actualizada. Si se liberó un cupo, se promovió a la primera persona en espera.');
      refetch();
    },
    onError: () => toast.error('No se pudo actualizar la asistencia.'),
  });

  function openReminder(registration: ActivityRegistration) {
    const phoneNumber = registration.volunteer_phone.replace(/\D/g, '');
    const text = encodeURIComponent(`Hola ${registration.volunteer_name}, te recordamos tu jornada “${activity.title}” el ${formatDateShort(activity.activity_date)} de ${activity.start_time} a ${activity.end_time}. ¿Nos confirmas tu asistencia?`);
    window.open(`https://wa.me/${phoneNumber}?text=${text}`, '_blank', 'noopener,noreferrer');
    toast.info('Abrimos WhatsApp con un recordatorio listo. El envío depende de que lo confirmes allí.');
  }

  const removeMutation = useMutation({
    mutationFn: async (regId: string) => {
      const { error } = await supabase.from('activity_registrations').delete().eq('id', regId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activity-registrations', activity.id] });
      qc.invalidateQueries({ queryKey: ['admin-activities'] });
      qc.invalidateQueries({ queryKey: ['volunteer-activities-public'] });
      toast.success('Inscripción removida.');
      refetch();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 relative mobile-bottom-sheet"
      >
        <div className="w-12 h-1.5 bg-[var(--color-muted)] rounded-full mx-auto mb-3 sm:hidden" />
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] p-1 rounded-lg mobile-touch-target"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="warm">Asignación Manual de Personas</Badge>
              <Badge variant="outline" className="text-xs">
                {registrations.filter(reg => (reg.attendance_status ?? 'registered') === 'registered').length} / {activity.max_volunteers} Cupos
              </Badge>
            </div>
            <h2 className="font-heading text-xl font-bold">{activity.title}</h2>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {formatDateShort(activity.activity_date)} · {activity.start_time} - {activity.end_time}
            </p>
          </div>

          <div className="flex justify-between items-center pt-2">
            <h3 className="font-heading text-sm font-bold">Lista de Asistencia ({registrations.length})</h3>
            <Button size="sm" variant="outline" onClick={() => setShowAddForm(!showAddForm)}>
              <UserPlus className="h-4 w-4 mr-1.5" /> Inscribir Persona
            </Button>
          </div>

          {showAddForm && (
            <Card className="border-[var(--color-primary)] bg-[var(--color-background)]">
              <CardContent className="p-4 space-y-3">
                <h4 className="font-heading font-bold text-xs">Formulario de Asignación por el Admin</h4>
                <div className="space-y-1">
                  <Label htmlFor="rname">Nombre Completo</Label>
                  <Input id="rname" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Juan Pérez" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="remail">Email</Label>
                    <Input id="remail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="juan@email.com" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="rphone">Teléfono / WhatsApp</Label>
                    <Input id="rphone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+123456789" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="rnotes">Notas (opcional)</Label>
                  <Input id="rnotes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej: Confirmó asistencia telefónica" />
                </div>
                <label className="flex items-start gap-2 text-xs leading-relaxed">
                  <input type="checkbox" checked={consentConfirmed} onChange={e => setConsentConfirmed(e.target.checked)} className="mt-0.5" />
                  <span>Confirmo que esta persona autorizó el uso de sus datos para gestionar la jornada.</span>
                </label>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>Cancelar</Button>
                  <Button variant="warm" size="sm" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !name || !email || !phone || !consentConfirmed}>
                    Guardar Inscripción
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Roster list */}
          <div className="divide-y divide-[var(--color-border)] max-h-60 overflow-y-auto">
            {isLoading ? (
              <p className="text-center py-4 text-xs text-[var(--color-muted-foreground)]">Cargando participantes...</p>
            ) : registrations.length === 0 ? (
              <p className="text-center py-6 text-xs text-[var(--color-muted-foreground)]">Aún no hay voluntario inscrito para esta fecha.</p>
            ) : (
              registrations.map(reg => (
                <div key={reg.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--color-foreground)]">{reg.volunteer_name}</span>
                      <Badge variant={reg.attendance_status === 'waitlisted' ? 'secondary' : reg.attendance_status === 'cancelled' ? 'outline' : 'default'} className="text-[10px] py-0 px-1.5">
                        {{ registered: 'Cupo confirmado', waitlisted: 'Lista de espera', attended: 'Asistió', no_show: 'No asistió', cancelled: 'Canceló' }[reg.attendance_status ?? 'registered']}
                      </Badge>
                      {reg.assigned_by_admin && (
                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5">Asignado por Admin</Badge>
                      )}
                    </div>
                    <div className="flex gap-3 text-[var(--color-muted-foreground)] mt-0.5">
                      <span>✉️ {reg.volunteer_email}</span>
                      <span>📞 {reg.volunteer_phone}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                  <select
                    aria-label={`Estado de asistencia de ${reg.volunteer_name}`}
                    value={reg.attendance_status ?? 'registered'}
                    onChange={e => statusMutation.mutate({ id: reg.id, attendance_status: e.target.value as NonNullable<ActivityRegistration['attendance_status']> })}
                    className="max-w-36 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1.5 text-[10px] text-[var(--color-foreground)]"
                    disabled={statusMutation.isPending}
                  >
                    <option value="registered">Cupo confirmado</option><option value="waitlisted">Lista de espera</option><option value="attended">Asistió</option><option value="no_show">No asistió</option><option value="cancelled">Canceló</option>
                  </select>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-700" onClick={() => openReminder(reg)} aria-label={`Preparar recordatorio por WhatsApp para ${reg.volunteer_name}`}>
                    <MessageCircle className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-[var(--color-destructive)] h-7 w-7"
                    onClick={() => { if (confirm(`¿Remover a ${reg.volunteer_name}?`)) removeMutation.mutate(reg.id); }}
                    aria-label="Dar de baja"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
