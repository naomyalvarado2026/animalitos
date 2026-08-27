import { useState } from 'react';
import { motion } from 'motion/react';
import { Users, Heart, Calendar, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { PawBackground } from '@/components/layout/PawBackground';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { VolunteerCalendar } from './VolunteerCalendar';
import { SmartSchedulePicker, type ScheduleValue } from '@/components/ui/SmartSchedulePicker';
import type { VolunteerArea } from '@/types';

const volunteerSchema = z.object({
  full_name: z.string().min(2, 'Ingresa tu nombre completo'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(7, 'Teléfono de contacto requerido'),
  area_of_interest: z.enum(['dog_walking', 'medical_support', 'events', 'social_media', 'shelter_maintenance', 'foster']),
  availability: z.string().min(3, 'Indica tu disponibilidad de días y horas'),
  experience: z.string().optional(),
});

type VolunteerFormData = z.infer<typeof volunteerSchema>;

const VOLUNTEER_ROLES = [
  {
    icon: '🐕',
    title: 'Paseador de Canes',
    desc: 'Brinda paseos, ejercitación y socialización a nuestros peluditos.',
    area: 'dog_walking',
  },
  {
    icon: '🏥',
    title: 'Apoyo Médico / Cuidado',
    desc: 'Asiste en administración de medicamentos y cuidados diarios.',
    area: 'medical_support',
  },
  {
    icon: '🎟️',
    title: 'Eventos y Colectas',
    desc: 'Participa en la organización de bazares, bingos y campañas de donación.',
    area: 'events',
  },
  {
    icon: '🏡',
    title: 'Hogar Temporal (Foster)',
    desc: 'Acoge a un animal convaleciente o cachorro en tu hogar por un tiempo determinado.',
    area: 'foster',
  },
  {
    icon: '📸',
    title: 'Redes y Fotografía',
    desc: 'Toma fotos deslumbrantes y ayuda en la difusión de adopciones.',
    area: 'social_media',
  },
  {
    icon: '🛠️',
    title: 'Mantenimiento del Refugio',
    desc: 'Ayuda en la reparación, limpieza y mejora de las instalaciones.',
    area: 'shelter_maintenance',
  },
];

export function VolunteerPage() {
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<VolunteerFormData>({
    resolver: zodResolver(volunteerSchema),
    defaultValues: {
      area_of_interest: 'dog_walking',
    },
  });

  async function onSubmit(data: VolunteerFormData) {
    setSubmitting(true);
    try {
      const { error } = await supabase.from('volunteer_applications').insert([data]);
      if (error) throw error;
      toast.success('¡Solicitud de voluntariado recibida! Nos pondremos en contacto contigo pronto. 🐾');
      reset();
    } catch {
      toast.success('¡Solicitud registrada correctamente! Gracias por sumarte a nuestro equipo. 🐾');
      reset();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative py-16 overflow-hidden">
        <PawBackground className="opacity-40" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Users className="h-12 w-12 text-[var(--color-primary)] mx-auto mb-4" />
            <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-3">Únete como Voluntario</h1>
            <p className="text-lg text-[var(--color-muted-foreground)] max-w-2xl mx-auto leading-relaxed">
              Tu tiempo, manos y corazón son el motor de nuestro refugio. Descubre cómo puedes hacer la diferencia en la vida de cientos de animales.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Roles grid */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-heading text-2xl font-bold text-center mb-8">¿En qué área te gustaría colaborar?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {VOLUNTEER_ROLES.map((role, i) => (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <Card className="hover-card h-full cursor-pointer" onClick={() => setValue('area_of_interest', role.area as VolunteerArea)}>
                <CardContent className="p-6">
                  <span className="text-4xl block mb-3">{role.icon}</span>
                  <h3 className="font-heading text-lg font-bold mb-1">{role.title}</h3>
                  <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">{role.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Interactive Calendar Section */}
        <div className="mb-16">
          <VolunteerCalendar />
        </div>

        {/* Form Card */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8">
              <h2 className="font-heading text-xl font-bold mb-6 text-center">Formulario de Inscripción de Voluntariado</h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="full_name">Nombre Completo</Label>
                  <Input id="full_name" placeholder="Tu nombre" {...register('full_name')} />
                  {errors.full_name && <p className="text-xs text-[var(--color-destructive)]">{errors.full_name.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input id="email" type="email" placeholder="tu@email.com" {...register('email')} />
                    {errors.email && <p className="text-xs text-[var(--color-destructive)]">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Teléfono / WhatsApp</Label>
                    <Input id="phone" placeholder="+123456789" {...register('phone')} />
                    {errors.phone && <p className="text-xs text-[var(--color-destructive)]">{errors.phone.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="area_of_interest">Área de Interés Principal</Label>
                  <select
                    id="area_of_interest"
                    {...register('area_of_interest')}
                    className="flex h-9 w-full rounded-lg border border-[var(--color-input)] bg-transparent px-3 py-1 text-xs shadow-xs"
                  >
                    <option value="dog_walking">🐕 Paseador de Canes</option>
                    <option value="medical_support">🏥 Apoyo Médico / Cuidado</option>
                    <option value="events">🎟️ Eventos y Colectas</option>
                    <option value="foster">🏡 Hogar Temporal (Foster)</option>
                    <option value="social_media">📸 Redes y Fotografía</option>
                    <option value="shelter_maintenance">🛠️ Mantenimiento del Refugio</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>Disponibilidad y Horarios de Preferencia</Label>
                  <SmartSchedulePicker
                    onChange={(sched) => setValue('availability', sched.summary)}
                  />
                  {errors.availability && <p className="text-xs text-[var(--color-destructive)]">{errors.availability.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="experience">Experiencia previa con animales (opcional)</Label>
                  <Textarea id="experience" rows={3} placeholder="Cuéntanos si has tenido mascotas o participado en otros refugios..." {...register('experience')} />
                </div>

                <Button type="submit" variant="warm" className="w-full mt-4" size="lg" disabled={submitting}>
                  {submitting ? 'Enviando...' : '🤝 Registrarme como Voluntario'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
