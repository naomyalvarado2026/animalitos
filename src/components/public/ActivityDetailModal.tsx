import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Calendar, Clock, MapPin, User, CheckCircle2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { VolunteerActivity } from '@/types';
import { formatDateShort } from '@/lib/utils';

const registrationSchema = z.object({
  volunteer_name: z.string().min(2, 'Ingresa tu nombre completo'),
  volunteer_email: z.string().email('Email inválido'),
  volunteer_phone: z.string().min(7, 'Teléfono válido requerido'),
  notes: z.string().optional(),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

export function ActivityDetailModal({
  activity,
  onClose,
  onRegistered,
}: {
  activity: VolunteerActivity;
  onClose: () => void;
  onRegistered: () => void;
}) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
  });

  const isFull = (activity.current_volunteers ?? 0) >= (activity.max_volunteers ?? 5);

  async function onSubmit(data: RegistrationForm) {
    setSubmitting(true);
    try {
      const { error } = await supabase.from('activity_registrations').insert([
        {
          activity_id: activity.id,
          ...data,
        },
      ]);
      if (error) throw error;
      toast.success(`¡Te has inscrito a "${activity.title}"! Gracias por tu apoyo. 🐾`);
      reset();
      onRegistered();
      onClose();
    } catch {
      toast.error('No pudimos registrar tu inscripción. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  }

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
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="warm" className="capitalize">
                {String(activity.category ?? 'Actividad').replace(/_/g, ' ')}
              </Badge>
              <Badge variant={isFull ? 'secondary' : 'success'} className="text-xs">
                {isFull ? 'Cupos Llenos' : `${activity.current_volunteers ?? 0} / ${activity.max_volunteers ?? 5} Cupos`}
              </Badge>
            </div>
            <h2 className="font-heading text-2xl font-bold">{activity.title}</h2>
          </div>

          <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
            {activity.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[var(--color-background)] p-4 rounded-xl border border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[var(--color-primary)]" />
              <span>{formatDateShort(activity.activity_date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[var(--color-primary)]" />
              <span>{activity.start_time ?? '09:00'} - {activity.end_time ?? '12:00'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[var(--color-primary)]" />
              <span>{activity.location ?? 'Refugio Principal'}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-[var(--color-primary)]" />
              <span>Encargado: {activity.coordinator_name ?? 'Equipo AdoptaME'}</span>
            </div>
          </div>

          {activity.requirements && activity.requirements.length > 0 && (
            <div className="space-y-1.5 text-xs">
              <span className="font-semibold text-[var(--color-foreground)] block">Requisitos / Que traer:</span>
              <ul className="space-y-1 pl-1">
                {activity.requirements.map((req, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-[var(--color-muted-foreground)]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!isRegistering ? (
            <div className="pt-3">
              <Button
                variant="warm"
                className="w-full"
                disabled={isFull}
                onClick={() => setIsRegistering(true)}
              >
                <Heart className="h-4 w-4 mr-2" />
                {isFull ? 'Cupos Agotados' : '🤝 Unirme a esta Actividad'}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-3 border-t border-[var(--color-border)]">
              <h3 className="font-heading font-bold text-sm">Registro de Voluntario</h3>

              <div className="space-y-1">
                <Label htmlFor="vname">Nombre Completo</Label>
                <Input id="vname" {...register('volunteer_name')} placeholder="Tu nombre" />
                {errors.volunteer_name && <p className="text-xs text-[var(--color-destructive)]">{errors.volunteer_name.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="vemail">Email</Label>
                  <Input id="vemail" type="email" {...register('volunteer_email')} placeholder="tu@email.com" />
                  {errors.volunteer_email && <p className="text-xs text-[var(--color-destructive)]">{errors.volunteer_email.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="vphone">Teléfono / WhatsApp</Label>
                  <Input id="vphone" {...register('volunteer_phone')} placeholder="+123456789" />
                  {errors.volunteer_phone && <p className="text-xs text-[var(--color-destructive)]">{errors.volunteer_phone.message}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsRegistering(false)}>Cancelar</Button>
                <Button type="submit" variant="warm" size="sm" disabled={submitting}>
                  {submitting ? 'Inscribiendo...' : 'Confirmar Inscripción'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
