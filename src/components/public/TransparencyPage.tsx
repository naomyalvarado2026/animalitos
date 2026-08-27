import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, FileText, ChevronRight, Shield } from 'lucide-react';
import { PawBackground } from '@/components/layout/PawBackground';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { FinancialChart } from './FinancialChart';

const PILLARS = [
  {
    icon: TrendingUp,
    title: 'Ingresos',
    description: 'Publicamos todos los ingresos: donaciones individuales, corporativas, y recaudaciones por eventos.',
    href: '/transparencia/ingresos',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
  },
  {
    icon: TrendingDown,
    title: 'Egresos',
    description: 'Detallamos en qué se usa cada peso: alimento, medicamentos, infraestructura, personal y servicios.',
    href: '/transparencia/egresos',
    color: 'text-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-950/20',
  },
  {
    icon: FileText,
    title: 'Informes',
    description: 'Balances mensuales y anuales disponibles para cualquier persona que quiera revisarlos.',
    href: '/transparencia/ingresos',
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
  },
];

export function TransparencyPage() {
  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <PawBackground className="opacity-50" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Shield className="h-14 w-14 text-[var(--color-primary)] mx-auto mb-4" />
            <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-4">Transparencia</h1>
            <p className="text-lg text-[var(--color-muted-foreground)] max-w-2xl mx-auto leading-relaxed">
              Creemos que quienes confían en nosotros merecen saber exactamente
              cómo administramos cada recurso. Aquí publicamos nuestras finanzas
              de forma abierta y accesible para todos.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Why transparency */}
      <section className="py-16 bg-[var(--color-card)] border-y border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-center mb-8">¿Por qué publicamos nuestras finanzas?</h2>
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-4 text-[var(--color-muted-foreground)] mb-12">
            <p className="text-base leading-relaxed">
              Cuando decides donar a AdoptaME, depositas tu confianza en nosotros.
              Y la confianza se construye con hechos, no con palabras.
            </p>
            <p className="text-base leading-relaxed">
              Por eso decidimos desde el inicio ser radicalmente transparentes:
              cada ingreso que recibimos y cada gasto que realizamos se publica
              en esta sección, actualizado regularmente por nuestro equipo de administración.
            </p>
          </div>

          <div className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-2xl p-6 shadow-xs">
            <h3 className="font-heading text-lg font-bold mb-1">Evolución Financiera Mensual (USD)</h3>
            <p className="text-xs text-[var(--color-muted-foreground)] mb-4">Ingresos vs. Egresos de los últimos meses</p>
            <FinancialChart />
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-center mb-10">Explora nuestras finanzas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PILLARS.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <Link to={p.href} className="block h-full group">
                  <Card className="h-full hover-card">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className={`w-12 h-12 rounded-2xl ${p.bg} flex items-center justify-center mb-4`}>
                        <p.icon className={`h-6 w-6 ${p.color}`} />
                      </div>
                      <h3 className="font-heading text-xl font-semibold mb-2 group-hover:text-[var(--color-primary)] transition-colors">
                        {p.title}
                      </h3>
                      <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed flex-1">
                        {p.description}
                      </p>
                      <div className="flex items-center gap-1 mt-4 text-sm font-medium text-[var(--color-primary)]">
                        Ver detalle
                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <p className="text-[var(--color-muted-foreground)] mb-6">
            ¿Tienes alguna pregunta sobre nuestras finanzas? No dudes en contactarnos.
          </p>
          <Button variant="outline" size="lg" asChild>
            <Link to="/contacto">
              Contactar al equipo
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
