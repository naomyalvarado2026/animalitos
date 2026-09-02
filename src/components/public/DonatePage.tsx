import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Heart, ChevronRight, Repeat } from 'lucide-react';
import { PawBackground } from '@/components/layout/PawBackground';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCurrency } from '@/contexts/CurrencyContext';
import { usePublicSettings } from '@/lib/publicSettings';
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
  const { data: settings } = usePublicSettings(['donations_intro', 'donation_methods', 'donation_impact']);
  const [frequency, setFrequency] = useState<'once' | 'monthly'>('once');
  const [selectedUSD, setSelectedUSD] = useState<number>(50);
  const [customUSD, setCustomUSD] = useState<string>('');

  const activeAmountUSD = customUSD ? (parseFloat(customUSD) || 0) : selectedUSD;
  let donationMethods: { emoji: string; title: string; description: string; link?: { text: string; url: string } }[] = [];
  try {
    const parsed = settings?.donation_methods ? JSON.parse(settings.donation_methods) : null;
    if (Array.isArray(parsed)) donationMethods = parsed.filter((method) => method?.title && method?.description);
  } catch { /* mostrar estado sin datos verificados */ }
  let impactItems = IMPACT;
  try { const parsed = settings?.donation_impact ? JSON.parse(settings.donation_impact) : null; if (Array.isArray(parsed) && parsed.length) impactItems = parsed; } catch { /* usar guía base */ }

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative py-16 overflow-hidden">
        <PawBackground className="opacity-50" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Heart className="h-14 w-14 text-rose-500 mx-auto mb-4 fill-rose-100" />
            <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-4">Donaciones</h1>
            <p className="text-lg text-[var(--color-muted-foreground)] max-w-2xl mx-auto leading-relaxed">
              {settings?.donations_intro?.trim() || 'Cada donación ayuda a rescatar, cuidar y encontrar hogares responsables para nuestros perros.'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Interactive Calculator Section */}
      <section className="py-12 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="border-[var(--color-border)] shadow-lg overflow-hidden">
          <div className="bg-[var(--color-card)] p-6 border-b border-[var(--color-border)] text-center">
            <h2 className="font-heading text-2xl font-bold mb-4">Calcula tu Impacto</h2>

            {/* Frequency Toggle */}
            <div className="inline-flex p-1 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] mb-6">
              <button
                onClick={() => setFrequency('once')}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  frequency === 'once'
                    ? 'brand-gradient-bg text-white shadow-xs'
                    : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
                }`}
              >
                Donación Única
              </button>
              <button
                onClick={() => setFrequency('monthly')}
                className={`px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all ${
                  frequency === 'monthly'
                    ? 'brand-gradient-bg text-white shadow-xs'
                    : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
                }`}
              >
                <Repeat className="w-3.5 h-3.5" />
                Suscripción Mensual
              </button>
            </div>

            {/* Preset Buttons */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
              {PRESET_AMOUNTS_USD.map(usd => (
                <button
                  key={usd}
                  onClick={() => {
                    setSelectedUSD(usd);
                    setCustomUSD('');
                  }}
                  className={`py-3 px-2 rounded-xl text-sm font-bold border transition-all ${
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
            <div className="max-w-xs mx-auto mb-6">
              <Input
                type="number"
                placeholder="Otro monto en USD..."
                value={customUSD}
                onChange={e => setCustomUSD(e.target.value)}
                className="text-center font-bold text-base"
              />
            </div>

            {/* Impact Text preview */}
            <div className="p-4 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-foreground)]">
              <span className="text-[var(--color-primary)] font-bold">
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
          </div>

          {/* Direct Transfer Info Quick Access */}
          <CardContent className="p-6 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left text-xs text-[var(--color-muted-foreground)]">
              <p className="font-semibold text-sm text-[var(--color-foreground)] mb-1">
                ¿Prefieres transferencia bancaria?
              </p>
              <p>Solicita los datos oficiales desde nuestro formulario de contacto.</p>
            </div>
            <Button variant="outline" size="sm" className="shrink-0" asChild><Link to="/contacto">Solicitar datos</Link></Button>
          </CardContent>
        </Card>
      </section>

      {/* Impact List */}
      <section className="py-14 bg-[var(--color-card)] border-y border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-center mb-8">
            ¿Cuánto impacto genera tu ayuda?
          </h2>
          <div className="space-y-3">
            {impactItems.map((item, i) => (
              <motion.div
                key={item.amountUSD}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="flex items-center gap-4 p-4 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-accent)] transition-colors"
              >
                <span className="font-heading text-2xl font-bold text-[var(--color-primary)] shrink-0 min-w-[120px]">
                  {formatAmount(item.amountUSD)}
                </span>
                <span className="text-sm text-[var(--color-foreground)]">{item.impact}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <DogStoryMoment slug="tigresa" eyebrow="Una ayuda con nombre propio" title="El cuidado diario sostiene historias como la de Tigresa." />

      {/* Donation methods */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-center mb-4">Formas de Donar</h2>
          <p className="text-center text-[var(--color-muted-foreground)] mb-10">
            Elige el medio de pago que prefieras.
          </p>
          {donationMethods.length ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {donationMethods.map((opt, i) => (
              <motion.div
                key={opt.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <Link to={opt.link?.url || '/contacto/quiero-apoyar'} className="block h-full group">
                  <Card
                    className={`h-full hover-card ${
                      i === 0 ? 'border-[var(--color-primary)] shadow-md' : ''
                    }`}
                  >
                    {i === 0 && (
                      <div className="px-6 pt-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
                          ⭐ Recomendado
                        </span>
                      </div>
                    )}
                    <CardContent className={`${i === 0 ? 'pt-2' : 'pt-6'} pb-6 px-6`}>
                      <span className="text-4xl block mb-3">{opt.emoji}</span>
                      <h3 className="font-heading text-xl font-semibold mb-2 group-hover:text-[var(--color-primary)] transition-colors">
                        {opt.title}
                      </h3>
                      <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed mb-4">
                        {opt.description}
                      </p>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)]">
                        {opt.link?.text || 'Ver instrucciones'}
                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div> : <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-muted-foreground)]">Los métodos de donación se publicarán cuando el equipo confirme los datos oficiales. <Link to="/contacto/quiero-apoyar" className="font-bold text-[var(--color-primary)]">Contáctanos para ayudar</Link>.</div>}
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 text-center">
        <Button variant="warm" size="xl" asChild>
          <Link to="/donaciones/donadores-principales">
            ❤️ Ver quiénes ya apoyan
          </Link>
        </Button>
      </section>
    </div>
  );
}
