import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { MapPin, Mail, Clock, ChevronRight, CheckCircle2, RotateCcw } from 'lucide-react';
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
import { ContextualFaq } from './ContextualFaq';

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
  const [sentConfirmation, setSentConfirmation] = useState<{ subject: string; email: string } | null>(null);
  const [searchParams] = useSearchParams();
  const campaignName = searchParams.get('campana')?.trim().slice(0, 100) || '';
  const dogName = searchParams.get('perrito')?.trim() || '';
  const sponsorName = searchParams.get('apadrina')?.trim() || '';
  const queryType = searchParams.get('tipo')?.trim() || '';
  const donationMonto = searchParams.get('monto')?.trim() || '';
  const donationFrequency = searchParams.get('frecuencia') === 'monthly' ? 'mensual' : 'único';

  const donationPrefillMessage =
    queryType === 'donacion' || donationMonto
      ? `Hola, me gustaría coordinar un aporte ${donationFrequency}${donationMonto ? ` de $${donationMonto} USD` : ''} para apoyar a la manada de AdoptaME. ¿Podrían compartirme los datos verificados para realizarlo?`
      : '';

  const sponsorMessage = sponsorName
    ? `Hola, quiero conversar sobre el apadrinamiento de ${sponsorName}.`
    : '';

  const initialType: FormData['type'] =
    queryType === 'donacion' || donationMonto
      ? 'donation'
      : sponsorName || campaignName
        ? 'support'
        : 'general';

  const initialSubject = campaignName
    ? `Quiero participar en ${campaignName}`
    : sponsorName
      ? `Quiero apadrinar a ${sponsorName}`
      : dogName
        ? `Quiero conocer a ${dogName}`
        : queryType === 'donacion' || donationMonto
          ? `Coordinar aporte ${donationFrequency}${donationMonto ? ` ($${donationMonto} USD)` : ''}`
          : '';

  const initialMessage =
    (campaignName
      ? `Hola, quisiera conocer las opciones para participar en la campaña ${campaignName}. ¿Podemos coordinar los insumos y la logística?`
      : '') ||
    sponsorMessage ||
    donationPrefillMessage ||
    (dogName ? `Hola, me gustaría recibir información y coordinar un primer encuentro con ${dogName}.` : '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      type: initialType,
      subject: initialSubject,
      message: initialMessage,
    },
  });

  async function onSubmit(data: FormData) {
    setSending(true);
    try {
      const { error } = await supabase.from('contact_messages').insert([data]);
      if (error) throw error;
      setSentConfirmation({ subject: data.subject, email: data.email });
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
      <section className="relative overflow-hidden py-16">
        <PawBackground className="opacity-40" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="mb-4 block text-5xl">💬</span>
            <h1 className="mb-3 font-heading text-4xl font-bold sm:text-5xl">Contáctanos</h1>
            <p className="mx-auto max-w-xl text-[var(--color-muted-foreground)]">
              Estamos aquí para responder tus preguntas, recibir tus aportes o coordinar una visita.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Info */}
          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-4 pt-6 pb-6">
                <h2 className="font-heading text-xl font-semibold">Información</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                    <span className="text-[var(--color-foreground)]">Visitas con cita previa. Escríbenos para coordinar disponibilidad.</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                    <span>Respondemos directamente a tu correo</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
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
                <h2 className="mb-3 font-heading text-xl font-semibold">¿Quieres apoyar?</h2>
                <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
                  Si deseas hacer una donación o conocer nuestras cuentas verificadas, te explicamos todo aquí.
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
                {sentConfirmation ? (
                  <div className="space-y-5 py-6 text-center" role="status" aria-live="polite">
                    <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-7 w-7" />
                    </div>
                    <h2 className="font-heading text-2xl font-extrabold">¡Recibimos tu mensaje!</h2>
                    <p className="mx-auto max-w-md text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                      Registramos tu consulta sobre <strong>“{sentConfirmation.subject}”</strong>. Nuestro equipo te responderá al correo{' '}
                      <strong>{sentConfirmation.email}</strong>.
                    </p>
                    <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
                      <Button type="button" variant="outline" onClick={() => setSentConfirmation(null)}>
                        <RotateCcw className="h-4 w-4" /> Enviar otro mensaje
                      </Button>
                      <Button variant="warm" asChild>
                        <Link to="/adopta">Explorar la manada</Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="mb-2 font-heading text-xl font-semibold">
                      {sponsorName
                        ? `Conversemos sobre el apadrinamiento de ${sponsorName}`
                        : dogName
                          ? `Conversemos sobre ${dogName}`
                          : donationMonto
                            ? `Coordinemos tu aporte de $${donationMonto} USD`
                            : 'Envíanos un mensaje'}
                    </h2>
                    {(dogName || sponsorName || donationMonto || campaignName) && (
                      <p className="mb-6 rounded-xl border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/10 p-3 text-sm text-[var(--color-foreground)]">
                        Ya preparamos el asunto y el mensaje según tu selección. Completa tu nombre y correo para que el equipo te responda.
                      </p>
                    )}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                          className="flex h-9 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                        >
                          <option value="general">Consulta General</option>
                          <option value="donation">Donación</option>
                          <option value="volunteer">Voluntariado</option>
                          <option value="support">Apoyo / Apadrinamiento</option>
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
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <ContextualFaq category="visit" title="Preguntas frecuentes antes de visitarnos o escribirnos" />
    </div>
  );
}
