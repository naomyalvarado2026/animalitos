import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Heart, ChevronRight, Repeat, ArrowRight } from 'lucide-react';
import { PawBackground } from '@/components/layout/PawBackground';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCurrency } from '@/contexts/CurrencyContext';
import { usePublicSettings } from '@/lib/publicSettings';
import { ContextualFaq } from './ContextualFaq';
import { DogStoryMoment } from './DogStoryMoment';

const PRESET_AMOUNTS_USD = [10, 25, 50, 100, 250];

const IMPACT = [
  { amountUSD: 10, impact: 'Alimenta a un animal por una semana' },
  { amountUSD: 25, impact: 'Cubre una consulta veterinaria básica' },
  { amountUSD: 50, impact: 'Vacunación completa de un rescatado' },
  { amountUSD: 100, impact: 'Un mes de cuidado completo para un animal' },
  { amountUSD: 500, impact: 'Patrocina la recuperación de un animal enfermo' },
];

export function DonatePage() {
  const { formatAmount } = useCurrency();
  const [searchParams] = useSearchParams();
  const { data: settings } = usePublicSettings(['donations_intro', 'donation_methods', 'donation_impact']);
  const initialMonto = Number(searchParams.get('monto'));
  const initialFreq = searchParams.get('frecuencia') === 'monthly' ? 'monthly' : 'once';

  const [frequency, setFrequency] = useState<'once' | 'monthly'>(initialFreq);
  const [selectedUSD, setSelectedUSD] = useState<number>(
    Number.isFinite(initialMonto) && initialMonto > 0 && PRESET_AMOUNTS_USD.includes(initialMonto) ? initialMonto : 50,
  );
  const [customUSD, setCustomUSD] = useState<string>(
    Number.isFinite(initialMonto) && initialMonto > 0 && !PRESET_AMOUNTS_USD.includes(initialMonto) ? String(initialMonto) : '',
  );

  useEffect(() => {
    const paramMonto = Number(searchParams.get('monto'));
    if (Number.isFinite(paramMonto) && paramMonto > 0) {
      if (PRESET_AMOUNTS_USD.includes(paramMonto)) {
        setSelectedUSD(paramMonto);
        setCustomUSD('');
      } else {
        setCustomUSD(String(paramMonto));
      }
    }
    const paramFreq = searchParams.get('frecuencia');
    if (paramFreq === 'monthly' || paramFreq === 'once') {
      setFrequency(paramFreq);
    }
  }, [searchParams]);

  const activeAmountUSD = customUSD ? parseFloat(customUSD) || 0 : selectedUSD;
  const donationQueryString = `monto=${encodeURIComponent(String(activeAmountUSD || 25))}&frecuencia=${encodeURIComponent(frequency)}`;

  let donationMethods: { emoji: string; title: string; description: string; link?: { text: string; url: string } }[] = [];
  try {
    const parsed = settings?.donation_methods ? JSON.parse(settings.donation_methods) : null;
    if (Array.isArray(parsed)) donationMethods = parsed.filter((method) => method?.title && method?.description);
  } catch {
    /* mostrar estado sin datos verificados */
  }
  let impactItems = IMPACT;
  try {
    const parsed = settings?.donation_impact ? JSON.parse(settings.donation_impact) : null;
    if (Array.isArray(parsed) && parsed.length) impactItems = parsed;
  } catch {
    /* usar guía base */
  }

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative overflow-hidden py-16">
        <PawBackground className="opacity-50" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Heart className="mx-auto mb-4 h-14 w-14 fill-[#ff8069]/20 text-[#ff8069]" />
            <h1 className="mb-4 font-heading text-4xl font-bold sm:text-5xl">Donaciones</h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-[var(--color-muted-foreground)]">
              {settings?.donations_intro?.trim() ||
                'Cada donación ayuda a rescatar, cuidar y encontrar hogares responsables para nuestros perros.'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Interactive Calculator Section */}
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Card className="overflow-hidden border-[var(--color-border)] shadow-lg">
          <div className="border-b border-[var(--color-border)] bg-[var(--color-card)] p-6 text-center">
            <h2 className="mb-4 font-heading text-2xl font-bold">Calcula tu Impacto</h2>

            {/* Frequency Toggle */}
            <div className="mb-6 inline-flex rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-1">
              <button
                type="button"
                onClick={() => setFrequency('once')}
                className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
                  frequency === 'once'
                    ? 'brand-gradient-bg text-white shadow-xs'
                    : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
                }`}
              >
                Donación Única
              </button>
              <button
                type="button"
                onClick={() => setFrequency('monthly')}
                className={`flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
                  frequency === 'monthly'
                    ? 'brand-gradient-bg text-white shadow-xs'
                    : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
                }`}
              >
                <Repeat className="h-3.5 w-3.5" />
                Suscripción Mensual
              </button>
            </div>

            {/* Preset Buttons */}
            <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-5">
              {PRESET_AMOUNTS_USD.map((usd) => (
                <button
                  key={usd}
                  type="button"
                  onClick={() => {
                    setSelectedUSD(usd);
                    setCustomUSD('');
                  }}
                  className={`rounded-xl border px-2 py-3 text-sm font-bold transition-all ${
                    selectedUSD === usd && !customUSD
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-xs'
                      : 'border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-primary)]/50'
                  }`}
                >
                  {formatAmount(usd)}
                </button>
              ))}
            </div>

            {/* Custom Amount Input */}
            <div className="mx-auto mb-6 max-w-xs">
              <Input
                type="number"
                min="1"
                aria-label="Otro monto en USD"
                placeholder="Otro monto en USD..."
                value={customUSD}
                onChange={(e) => setCustomUSD(e.target.value)}
                className="text-center text-base font-bold"
              />
            </div>

            {/* Impact Text preview */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 text-sm font-medium text-[var(--color-foreground)]">
              <span className="font-bold text-[var(--color-primary)]">
                Tu donación de {formatAmount(activeAmountUSD)} {frequency === 'monthly' ? 'al mes' : ''}
              </span>{' '}
              {activeAmountUSD >= 100
                ? 'cubre el tratamiento veterinario integral y la alimentación de múltiples peluditos.'
                : activeAmountUSD >= 50
                  ? 'cubre el esquema completo de vacunas y desparasitación de un animal.'
                  : activeAmountUSD >= 25
                    ? 'proporciona alimento y cuidados básicos durante casi un mes.'
                    : 'ayuda con alimento fresco y medicamentos para nuestros rescatados.'}
            </div>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button variant="warm" size="lg" asChild>
                <Link to={`/contacto/quiero-apoyar?${donationQueryString}`}>
                  Continuar con {formatAmount(activeAmountUSD)} {frequency === 'monthly' ? 'mensuales' : ''} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to={`/contacto?tipo=donacion&${donationQueryString}`}>Coordinar con el equipo</Link>
              </Button>
            </div>
          </div>

          {/* Direct Transfer Info Quick Access */}
          <CardContent className="flex flex-col items-center justify-between gap-4 bg-muted/20 p-6 sm:flex-row">
            <div className="text-left text-xs text-[var(--color-muted-foreground)]">
              <p className="mb-1 text-sm font-semibold text-[var(--color-foreground)]">¿Prefieres transferencia bancaria o donación en especie?</p>
              <p>Conservamos el monto elegido para que el equipo te comparta los datos verificados.</p>
            </div>
            <Button variant="outline" size="sm" className="shrink-0" asChild>
              <Link to={`/contacto?tipo=donacion&${donationQueryString}`}>Solicitar datos</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Impact List */}
      <section className="border-y border-[var(--color-border)] bg-[var(--color-card)] py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center font-heading text-2xl font-bold">¿Cuánto impacto genera tu ayuda?</h2>
          <div className="space-y-3">
            {impactItems.map((item, i) => (
              <motion.div
                key={item.amountUSD}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                onClick={() => {
                  if (PRESET_AMOUNTS_USD.includes(item.amountUSD)) {
                    setSelectedUSD(item.amountUSD);
                    setCustomUSD('');
                  } else {
                    setCustomUSD(String(item.amountUSD));
                  }
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-[var(--color-border)] p-4 transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-accent)]"
              >
                <div className="flex items-center gap-4">
                  <span className="min-w-[120px] shrink-0 font-heading text-2xl font-bold text-[var(--color-primary)]">
                    {formatAmount(item.amountUSD)}
                  </span>
                  <span className="text-sm text-[var(--color-foreground)]">{item.impact}</span>
                </div>
                <span className="hidden text-xs font-bold text-[var(--color-primary)] sm:inline">Elegir monto →</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <DogStoryMoment slug="tigresa" eyebrow="Una ayuda con nombre propio" title="El cuidado diario sostiene historias como la de Tigresa." />

      {/* Donation methods */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-center font-heading text-3xl font-bold">Formas de Donar</h2>
          <p className="mb-10 text-center text-[var(--color-muted-foreground)]">Elige el medio de apoyo que prefieras.</p>
          {donationMethods.length ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {donationMethods.map((opt, i) => {
                const targetUrl = opt.link?.url || `/contacto/quiero-apoyar?${donationQueryString}`;
                return (
                  <motion.div
                    key={opt.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                  >
                    <Link to={targetUrl} className="group block h-full">
                      <Card className={`hover-card h-full ${i === 0 ? 'border-[var(--color-primary)] shadow-md' : ''}`}>
                        {i === 0 && (
                          <div className="px-6 pt-4">
                            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">⭐ Recomendado</span>
                          </div>
                        )}
                        <CardContent className={`${i === 0 ? 'pt-2' : 'pt-6'} px-6 pb-6`}>
                          <span className="mb-3 block text-4xl">{opt.emoji}</span>
                          <h3 className="mb-2 font-heading text-xl font-semibold transition-colors group-hover:text-[var(--color-primary)]">
                            {opt.title}
                          </h3>
                          <p className="mb-4 text-sm leading-relaxed text-[var(--color-muted-foreground)]">{opt.description}</p>
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)]">
                            {opt.link?.text || 'Ver instrucciones'}
                            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </span>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-muted-foreground)]">
              Para proteger a nuestros donantes, compartimos las cuentas verificadas directamente o en nuestra guía de apoyo.{' '}
              <Link to={`/contacto/quiero-apoyar?${donationQueryString}`} className="font-bold text-[var(--color-primary)] hover:underline">
                Continuar con tu aporte de {formatAmount(activeAmountUSD)} →
              </Link>
            </div>
          )}
        </div>
      </section>

      <ContextualFaq category="donation" title="Dudas frecuentes sobre donaciones y aportes" />

      {/* CTA */}
      <section className="py-10 text-center">
        <Button variant="warm" size="xl" asChild>
          <Link to="/donaciones/donadores-principales">❤️ Ver quiénes ya apoyan</Link>
        </Button>
      </section>
    </div>
  );
}
