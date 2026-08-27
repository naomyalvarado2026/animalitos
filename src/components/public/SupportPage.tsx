import { motion } from 'motion/react';
import { Heart, Copy, CheckCircle2, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { PawBackground } from '@/components/layout/PawBackground';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface DonationMethod {
  emoji: string;
  title: string;
  badge?: string;
  description: string;
  fields: { label: string; value: string; copyable?: boolean }[];
  link?: { text: string; url: string };
  note?: string;
}

const METHODS: DonationMethod[] = [
  {
    emoji: '🏦',
    title: 'Transferencia Bancaria',
    description: 'Realiza una transferencia directa a nuestra cuenta. No olvides incluir tu nombre en la referencia.',
    fields: [
      { label: 'Banco', value: 'Banco Nacional' },
      { label: 'Nombre', value: 'AdoptaME ONG' },
      { label: 'Número de cuenta', value: '0001-2345-6789-01', copyable: true },
      { label: 'IBAN / SWIFT', value: 'XX00BANK0001234567890', copyable: true },
    ],
    note: 'Después de transferir, envíanos comprobante a hola@animalitos.org',
  },
  {
    emoji: '💳',
    title: 'PayPal',
    badge: 'Recomendado',
    description: 'Dona de forma segura con tu cuenta PayPal o tarjeta de crédito/débito.',
    fields: [
      { label: 'Email PayPal', value: 'donaciones@animalitos.org', copyable: true },
    ],
    link: { text: 'Ir a PayPal.me', url: 'https://paypal.me/animalitos' },
  },
  {
    emoji: '📱',
    title: 'Mercado Pago',
    description: 'Escanea nuestro código QR o usa el enlace de pago.',
    fields: [
      { label: 'Alias', value: 'animalitos.refugio', copyable: true },
      { label: 'CVU', value: '0000003100019999999999', copyable: true },
    ],
    link: { text: 'Pagar con Mercado Pago', url: 'https://mpago.la/example' },
  },
  {
    emoji: '₿',
    title: 'Bitcoin (BTC)',
    description: 'Aceptamos donaciones en Bitcoin.',
    fields: [
      { label: 'Dirección BTC', value: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', copyable: true },
    ],
  },
  {
    emoji: '💎',
    title: 'Ethereum (ETH) / USDT',
    description: 'Red Ethereum y tokens ERC-20.',
    fields: [
      { label: 'Dirección ETH', value: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', copyable: true },
    ],
  },
  {
    emoji: '📦',
    title: 'Donación en Especie',
    description: 'Alimento, medicamentos, cobijas, transportadoras, camas… todo suma muchísimo.',
    fields: [
      { label: 'Horario', value: 'Lun–Vie 9am–5pm, Sáb 9am–1pm' },
      { label: 'Dirección', value: 'Tu dirección aquí, Ciudad' },
    ],
    note: 'Coordina tu entrega al +1 (234) 567-890',
  },
];

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success('¡Copiado al portapapeles!');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      aria-label="Copiar"
      className="p-1.5 rounded-lg hover:bg-[var(--color-accent)] transition-colors text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)]"
    >
      {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

export function SupportPage() {
  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative py-16 overflow-hidden">
        <PawBackground className="opacity-40" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Heart className="h-14 w-14 text-rose-500 mx-auto mb-4 fill-rose-100" />
            <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-3">Quiero Apoyar</h1>
            <p className="text-lg text-[var(--color-muted-foreground)] max-w-2xl mx-auto">
              Estas son todas las formas en que puedes contribuir con nuestra causa.
              Cada aporte, sin importar su tamaño, hace una diferencia real. 🐾
            </p>
          </motion.div>
        </div>
      </section>

      {/* Methods */}
      <section className="py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {METHODS.map((method, i) => (
            <motion.div
              key={method.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{method.emoji}</span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-heading text-xl font-semibold">{method.title}</h3>
                          {method.badge && <Badge variant="warm">{method.badge}</Badge>}
                        </div>
                        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">{method.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 bg-[var(--color-background)] rounded-xl p-4">
                    {method.fields.map((field) => (
                      <div key={field.label} className="flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-[var(--color-muted-foreground)] min-w-[120px]">
                          {field.label}
                        </span>
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="text-sm font-mono font-medium text-[var(--color-foreground)] truncate">
                            {field.value}
                          </span>
                          {field.copyable && <CopyButton value={field.value} />}
                        </div>
                      </div>
                    ))}
                  </div>

                  {method.link && (
                    <div className="mt-4">
                      <Button variant="warm" size="sm" asChild>
                        <a href={method.link.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                          {method.link.text}
                        </a>
                      </Button>
                    </div>
                  )}

                  {method.note && (
                    <p className="mt-3 text-xs text-[var(--color-muted-foreground)] italic border-l-2 border-[var(--color-primary)] pl-3">
                      {method.note}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            ¿Tienes preguntas? Escríbenos a{' '}
            <a href="mailto:hola@animalitos.org" className="text-[var(--color-primary)] hover:underline">
              hola@animalitos.org
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
