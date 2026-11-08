import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Calendar, Clock, MapPin, User, CheckCircle2, Heart, Share2, CalendarPlus, Download } from 'lucide-react';
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
import { buildGoogleCalendarUrl, downloadIcsFile, buildWhatsAppShareUrl } from '@/lib/calendarExport';

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
  const isTemplate = activity.id.startsWith('recurring-') || activity.id.startsWith('curated-');

  async function onSubmit(data: RegistrationForm) {
    setSubmitting(true);
    try {
      if (isTemplate) {
        // If template/curated without database UUID, notify team or submit application
        toast.success(`¡Excelente, ${data.volunteer_name}! Nos comunicaremos a tu WhatsApp para coordinar esta fecha recurrente. 🐾`);
        reset();
        onClose();
        return;
      }

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
      toast.error('No pudimos registrar tu inscripción en este momento. Intenta comunicarte por WhatsApp.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleShareWhatsApp() {
    window.open(buildWhatsAppShareUrl(activity), '_blank', 'noopener,noreferrer');
  }

  function handleAddToGoogleCalendar() {
    window.open(buildGoogleCalendarUrl(activity), '_blank', 'noopener,noreferrer');
  }

  function handleDownloadIcs() {
    downloadIcsFile(activity);
    toast.success('Archivo .ics descargado. Ábrelo para añadirlo a tu calendario.');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-2xl mobile-bottom-sheet"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[var(--color-muted)] sm:hidden" />
        <button
          onClick={onClose}
          aria-label="Cerrar ventana de actividad"
          className="absolute right-4 top-4 rounded-xl p-1.5 text-[var(--color-muted-foreground)] transition hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-4">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="warm" className="capitalize bg-[#f0644a] text-white">
                {String(activity.category ?? 'Actividad').replace(/_/g, ' ')}
              </Badge>
              <Badge variant={isFull ? 'secondary' : 'outline'} className="text-xs">
                {isFull ? 'Cupos Llenos' : `${activity.current_volunteers ?? 0} / ${activity.max_volunteers ?? 5} Cupos disponibles`}
              </Badge>
            </div>
            <h2 className="font-heading text-2xl font-bold text-[var(--color-foreground)]">
              {activity.title}
            </h2>
          </div>

          <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            {activity.description}
          </p>

          {/* Quick Schedule Details */}
          <div className="grid grid-cols-1 gap-2.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 text-xs sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[var(--color-primary)] shrink-0" />
              <span>{formatDateShort(activity.activity_date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[var(--color-primary)] shrink-0" />
              <span>
                {activity.start_time ?? '09:00'} - {activity.end_time ?? '12:00'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[var(--color-primary)] shrink-0" />
              <span>{activity.location ?? 'Refugio Principal'}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-[var(--color-primary)] shrink-0" />
              <span>Encargado: {activity.coordinator_name ?? 'Equipo AdoptaME'}</span>
            </div>
          </div>

          {/* Requirements */}
          {activity.requirements && activity.requirements.length > 0 && (
            <div className="space-y-1.5 text-xs">
              <span className="block font-semibold text-[var(--color-foreground)]">
                Requisitos y qué traer:
              </span>
              <ul className="space-y-1 pl-1">
                {activity.requirements.map((req, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-[var(--color-muted-foreground)]">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Calendar Export & Share bar */}
          <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-3 text-xs">
            <span className="text-[11px] font-semibold text-[var(--color-muted-foreground)]">Guardar fecha:</span>
            <button
              type="button"
              onClick={handleAddToGoogleCalendar}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-1 text-[11px] font-bold text-[var(--color-foreground)] transition hover:border-[var(--color-primary)]"
            >
              <CalendarPlus className="h-3 w-3 text-[var(--color-primary)]" /> Google Calendar
            </button>
            <button
              type="button"
              onClick={handleDownloadIcs}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-1 text-[11px] font-bold text-[var(--color-foreground)] transition hover:border-[var(--color-primary)]"
            >
              <Download className="h-3 w-3 text-[var(--color-primary)]" /> iCal (.ics)
            </button>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 transition hover:bg-emerald-100"
            >
              <Share2 className="h-3 w-3 text-emerald-600" /> WhatsApp
            </button>
          </div>

          {!isRegistering ? (
            <div className="pt-2">
              <Button
                variant="warm"
                className="w-full bg-[#f0644a] text-white hover:bg-[#e94f3a]"
                disabled={isFull}
                onClick={() => setIsRegistering(true)}
              >
                <Heart className="mr-2 h-4 w-4" />
                {isFull ? 'Cupos Agotados' : '🤝 Unirme a esta Actividad'}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 border-t border-[var(--color-border)] pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-sm font-bold text-[var(--color-foreground)]">
                  Registro para esta jornada
                </h3>
                <span className="text-[11px] text-[var(--color-muted-foreground)]">Sin costo alguno</span>
              </div>

              <div className="space-y-1">
                <Label htmlFor="vname" className="text-xs">Nombre Completo</Label>
                <Input id="vname" {...register('volunteer_name')} placeholder="Tu nombre" className="text-xs" />
                {errors.volunteer_name && (
                  <p className="text-xs text-[var(--color-destructive)]">{errors.volunteer_name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="vemail" className="text-xs">Email</Label>
                  <Input id="vemail" type="email" {...register('volunteer_email')} placeholder="tu@email.com" className="text-xs" />
                  {errors.volunteer_email && (
                    <p className="text-xs text-[var(--color-destructive)]">{errors.volunteer_email.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="vphone" className="text-xs">Teléfono / WhatsApp</Label>
                  <Input id="vphone" {...register('volunteer_phone')} placeholder="+593 99..." className="text-xs" />
                  {errors.volunteer_phone && (
                    <p className="text-xs text-[var(--color-destructive)]">{errors.volunteer_phone.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="vnotes" className="text-xs">Notas adicionales o dudas (opcional)</Label>
                <Input id="vnotes" {...register('notes')} placeholder="Ej: Primera vez, voy con un amigo..." className="text-xs" />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsRegistering(false)} className="text-xs">
                  Cancelar
                </Button>
                <Button type="submit" variant="warm" size="sm" disabled={submitting} className="bg-[#f0644a] text-white hover:bg-[#e94f3a] text-xs">
                  {submitting ? 'Inscribiendo...' : 'Confirmar Mi Asistencia 🐾'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
