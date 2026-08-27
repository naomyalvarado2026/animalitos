import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Heart, Users, Home, ChevronRight, Star, Shield, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PawBackground, PawIcon } from '@/components/layout/PawBackground';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';

const STATS = [
  { label: 'Animales Rescatados', value: '1,240+', icon: Heart, color: 'text-rose-500' },
  { label: 'Adopciones Exitosas', value: '890+', icon: Home, color: 'text-emerald-500' },
  { label: 'Voluntarios Activos', value: '120', icon: Users, color: 'text-blue-500' },
  { label: 'Años de Servicio', value: '8', icon: Star, color: 'text-amber-500' },
];

const SECTIONS = [
  {
    icon: Shield,
    title: 'Transparencia Total',
    description: 'Publicamos todos nuestros ingresos y gastos. Cada peso donado es administrado con responsabilidad.',
    href: '/transparencia',
    color: 'bg-amber-50 dark:bg-amber-950/20',
    iconColor: 'text-amber-600',
  },
  {
    icon: Heart,
    title: 'Haz una Donación',
    description: 'Tu apoyo nos permite alimentar, medicar y cuidar a cada animal hasta que encuentre un hogar.',
    href: '/donaciones',
    color: 'bg-rose-50 dark:bg-rose-950/20',
    iconColor: 'text-rose-600',
  },
  {
    icon: Users,
    title: 'Conócenos',
    description: 'Somos un equipo apasionado por el bienestar animal. Conoce nuestra historia y misión.',
    href: '/nosotros',
    color: 'bg-blue-50 dark:bg-blue-950/20',
    iconColor: 'text-blue-600',
  },
];

export function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <PawBackground className="opacity-60" />

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 60% 40%, hsl(30, 60%, 88%, 0.35) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm mb-8 text-sm font-medium text-[var(--color-muted-foreground)]">
              <PawIcon size={14} color="var(--color-primary)" />
              Refugio de Animales · Rescate &amp; Adopción
            </div>

            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[var(--color-foreground)] mb-6 leading-tight">
              Cada vida{' '}
              <span className="brand-gradient-text">merece</span>
              <br />
              una segunda oportunidad
            </h1>

            <p className="text-lg sm:text-xl text-[var(--color-muted-foreground)] mb-10 max-w-2xl mx-auto leading-relaxed">
              En Animalitos rescatamos, cuidamos y buscamos un hogar para perros y gatos
              en necesidad. Juntos podemos cambiar su historia.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="warm" size="xl" asChild>
                <Link to="/contacto/quiero-apoyar">
                  <Heart className="h-5 w-5" />
                  Quiero Donar
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/nosotros">
                  Conocer más
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-[var(--color-muted-foreground)] animate-bounce">
          <span className="text-xs">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-[var(--color-muted-foreground)] to-transparent" />
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-[var(--color-card)] border-y border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="flex flex-col items-center text-center gap-2"
              >
                <div className={`p-3 rounded-2xl bg-[var(--color-background)]`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <span className="font-heading text-4xl font-bold text-[var(--color-foreground)]">
                  <AnimatedCounter value={stat.value} />
                </span>
                <span className="text-sm text-[var(--color-muted-foreground)] font-medium">
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="relative py-20 overflow-hidden">
        <PawBackground className="opacity-40" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-4xl mb-4 block">🐾</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[var(--color-foreground)] mb-4">
              Nuestra Misión
            </h2>
            <p className="text-lg text-[var(--color-muted-foreground)] leading-relaxed">
              Somos un refugio sin fines de lucro comprometido con el bienestar animal.
              Rescatamos animales en situaciones de abandono, maltrato o peligro,
              les brindamos atención médica, alimentación y amor, y trabajamos
              incansablemente para encontrarles un hogar permanente y amoroso.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Section Cards */}
      <section className="py-16 bg-[var(--color-background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SECTIONS.map((section, i) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
              >
                <Link to={section.href} className="block h-full group">
                  <Card className="h-full hover-card border-[var(--color-border)] overflow-hidden">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className={`w-12 h-12 rounded-2xl ${section.color} flex items-center justify-center mb-4`}>
                        <section.icon className={`h-6 w-6 ${section.iconColor}`} />
                      </div>
                      <h3 className="font-heading text-xl font-semibold mb-2 group-hover:text-[var(--color-primary)] transition-colors">
                        {section.title}
                      </h3>
                      <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed flex-1">
                        {section.description}
                      </p>
                      <div className="flex items-center gap-1 mt-4 text-sm font-medium text-[var(--color-primary)]">
                        Saber más
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

      {/* CTA Banner */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 brand-gradient-bg opacity-95" />
        <PawBackground className="opacity-10" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-center mb-4">
              <TrendingUp className="h-10 w-10 text-white/80" />
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-4">
              Sé parte del cambio
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
              Con tu donación podemos rescatar más animales, brindarles atención médica
              y encontrarles un hogar. Cada aporte cuenta.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="xl"
                className="bg-white text-[var(--color-primary)] hover:bg-white/90 font-semibold shadow-lg"
                asChild
              >
                <Link to="/contacto/quiero-apoyar">
                  <Heart className="h-5 w-5" />
                  Donar ahora
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="xl"
                className="text-white border border-white/30 hover:bg-white/10"
                asChild
              >
                <Link to="/transparencia">Ver transparencia</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
