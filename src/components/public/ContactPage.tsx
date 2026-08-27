import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { MapPin, Mail, Clock, ChevronRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PawBackground } from '@/components/layout/PawBackground';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(2, 'Ingresa tu nombre'),
  email: z.string().email('Email inválido'),
  subject: z.string().min(3, 'Ingresa un asunto'),
  message: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres'),
  type: z.enum(['general', 'support', 'donation', 'volunteer']),
});
type FormData = z.infer<typeof schema>;

export function ContactPage() {
  const [sending, setSending] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'general' },
  });

  async function onSubmit(data: FormData) {
    setSending(true);
    try {
      const { error } = await supabase.from('contact_messages').insert([data]);
      if (error) throw error;
      toast.success('¡Mensaje enviado! Te responderemos pronto. 🐾');
      reset();
    } catch {
      toast.error('Error al enviar. Intenta nuevamente.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative py-16 overflow-hidden">
        <PawBackground className="opacity-40" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="text-5xl block mb-4">💬</span>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-3">Contáctanos</h1>
            <p className="text-[var(--color-muted-foreground)] max-w-xl mx-auto">
              Estamos aquí para responder tus preguntas, recibir tus aportes o coordinar una visita.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Info */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 pb-6 space-y-4">
                <h2 className="font-heading text-xl font-semibold">Información</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="h-4 w-4 mt-0.5 text-[var(--color-primary)] shrink-0" />
                    <span className="text-[var(--color-foreground)]">Visitas con cita previa. Escríbenos para coordinar disponibilidad.</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-[var(--color-primary)] shrink-0" />
                    <span>Respondemos desde este formulario</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <Clock className="h-4 w-4 mt-0.5 text-[var(--color-primary)] shrink-0" />
                    <div>
                      <p>Lun–Vie: 8:00am – 6:00pm</p>
                      <p>Sáb–Dom: 9:00am – 4:00pm</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 pb-6">
                <h2 className="font-heading text-xl font-semibold mb-3">¿Quieres apoyar?</h2>
                <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
                  Si deseas hacer una donación o conocer nuestras cuentas, te explicamos todo aquí.
                </p>
                <Button variant="warm" className="w-full" asChild>
                  <Link to="/contacto/quiero-apoyar">
                    ❤️ Quiero Apoyar
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="pt-6 pb-6">
                <h2 className="font-heading text-xl font-semibold mb-6">Envíanos un mensaje</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-name">Nombre</Label>
                      <Input id="contact-name" placeholder="Tu nombre" {...register('name')} />
                      {errors.name && <p className="text-xs text-[var(--color-destructive)]">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-email">Email</Label>
                      <Input id="contact-email" type="email" placeholder="tu@email.com" {...register('email')} />
                      {errors.email && <p className="text-xs text-[var(--color-destructive)]">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="contact-type">Tipo de consulta</Label>
                    <select
                      id="contact-type"
                      {...register('type')}
                      className="flex h-9 w-full rounded-lg border border-[var(--color-input)] bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                    >
                      <option value="general">Consulta General</option>
                      <option value="donation">Donación</option>
                      <option value="volunteer">Voluntariado</option>
                      <option value="support">Apoyo / Sponsorship</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="contact-subject">Asunto</Label>
                    <Input id="contact-subject" placeholder="¿En qué podemos ayudarte?" {...register('subject')} />
                    {errors.subject && <p className="text-xs text-[var(--color-destructive)]">{errors.subject.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="contact-message">Mensaje</Label>
                    <Textarea id="contact-message" rows={5} placeholder="Cuéntanos..." {...register('message')} />
                    {errors.message && <p className="text-xs text-[var(--color-destructive)]">{errors.message.message}</p>}
                  </div>

                  <Button variant="warm" size="lg" type="submit" disabled={sending} className="w-full">
                    {sending ? 'Enviando...' : '📩 Enviar mensaje'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
