import { motion } from 'motion/react';
import { Heart, Copy, CheckCircle2, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { PawBackground } from '@/components/layout/PawBackground';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { usePublicSettings } from '@/lib/publicSettings';
import { RefugeDogRibbon } from './RefugeDogRibbon';

type DonationMethod = { emoji: string; title: string; badge?: string; description: string; fields: { label: string; value: string; copyable?: boolean }[]; link?: { text: string; url: string }; note?: string };

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() { await navigator.clipboard.writeText(value); setCopied(true); toast.success('Copiado al portapapeles.'); setTimeout(() => setCopied(false), 2000); }
  return <button type="button" onClick={handleCopy} aria-label={`Copiar ${value}`} className="rounded-lg p-1.5 text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--color-primary)]">{copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}</button>;
}

export function SupportPage() {
  const { data: settings, isLoading } = usePublicSettings(['donation_methods']);
  let methods: DonationMethod[] = [];
  try { const parsed = settings?.donation_methods ? JSON.parse(settings.donation_methods) as DonationMethod[] : []; if (Array.isArray(parsed)) methods = parsed.filter((method) => method.title?.trim() && method.description?.trim() && Array.isArray(method.fields)); } catch { /* ocultar configuración inválida */ }

  return <div className="pt-16"><section className="relative overflow-hidden py-16"><PawBackground className="opacity-40" /><div className="relative z-10 mx-auto max-w-4xl px-4 text-center"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}><Heart className="mx-auto mb-4 h-14 w-14 fill-rose-100 text-rose-500" /><h1 className="mb-3 font-heading text-4xl font-bold sm:text-5xl">Quiero Apoyar</h1><p className="mx-auto max-w-2xl text-lg text-[var(--color-muted-foreground)]">Cada aporte ayuda a cuidar a nuestros perros rescatados. Publicamos únicamente métodos de donación verificados.</p></motion.div></div></section>
    <RefugeDogRibbon start={6} tone="coral" eyebrow="Tu apoyo llega hasta ellos" title="No ayudas a una cifra. Ayudas a Minnie, Moana, Noah y toda la manada." description="Alimento, salud y tiempo seguro mientras cada uno espera su siguiente capítulo." />
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8"><div className="space-y-6">{isLoading && <p className="rounded-2xl border border-dashed border-[var(--color-border)] p-10 text-center text-sm text-[var(--color-muted-foreground)]">Cargando métodos de apoyo…</p>}{!isLoading && methods.length === 0 && <p className="rounded-2xl border border-dashed border-[var(--color-border)] p-10 text-center text-sm text-[var(--color-muted-foreground)]">Los métodos de donación estarán disponibles cuando el equipo verifique los datos oficiales.</p>}{methods.map((method, index) => <motion.div key={`${method.title}-${index}`} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.07, duration: 0.4 }}><Card className="overflow-hidden"><CardContent className="p-6"><div className="mb-4 flex items-start gap-3"><span className="text-3xl">{method.emoji}</span><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-heading text-xl font-semibold">{method.title}</h2>{method.badge && <Badge variant="warm">{method.badge}</Badge>}</div><p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{method.description}</p></div></div><div className="space-y-2 rounded-xl bg-[var(--color-background)] p-4">{method.fields.map((field) => <div key={field.label} className="flex items-center justify-between gap-3"><span className="min-w-[120px] text-xs font-medium text-[var(--color-muted-foreground)]">{field.label}</span><div className="flex min-w-0 items-center gap-1"><span className="truncate font-mono text-sm font-medium">{field.value}</span>{field.copyable && <CopyButton value={field.value} />}</div></div>)}</div>{method.link && <Button variant="warm" size="sm" className="mt-4" asChild><a href={method.link.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" />{method.link.text}</a></Button>}{method.note && <p className="mt-3 border-l-2 border-[var(--color-primary)] pl-3 text-xs italic text-[var(--color-muted-foreground)]">{method.note}</p>}</CardContent></Card></motion.div>)}</div></section>
  </div>;
}
