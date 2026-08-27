import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Heart, Clock, ChevronRight } from 'lucide-react';
import { PawBackground } from '@/components/layout/PawBackground';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const TEAM = [
  { name: 'María González', role: 'Fundadora & Directora', emoji: '👩‍⚕️' },
  { name: 'Carlos Ruiz', role: 'Veterinario Jefe', emoji: '🧑‍⚕️' },
  { name: 'Ana Martínez', role: 'Coordinadora de Adopciones', emoji: '👩‍💼' },
  { name: 'Luis Pérez', role: 'Voluntario Coordinador', emoji: '🧑‍🤝‍🧑' },
];

const VALUES = [
  { emoji: '❤️', title: 'Amor', description: 'Cada animal merece recibir amor y cuidado incondicional.' },
  { emoji: '🏥', title: 'Salud', description: 'Atención veterinaria completa para todos nuestros rescatados.' },
  { emoji: '🤝', title: 'Comunidad', description: 'Trabajamos juntos: voluntarios, donadores y adoptantes.' },
  { emoji: '🌱', title: 'Esperanza', description: 'Creemos en segundas oportunidades para todos.' },
];

export function AboutPage() {
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
            <span className="text-5xl block mb-4">🐾</span>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-[var(--color-foreground)] mb-4">
              Nosotros
            </h1>
            <p className="text-lg text-[var(--color-muted-foreground)] max-w-2xl mx-auto leading-relaxed">
              Somos más que un refugio. Somos una familia comprometida con dar
              esperanza y un hogar a cada animal que llega a nuestras puertas.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-[var(--color-card)] border-y border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[var(--color-accent)] flex items-center justify-center">
                  <Heart className="h-5 w-5 text-[var(--color-primary)]" />
                </div>
                <h2 className="font-heading text-2xl font-bold">Misión</h2>
              </div>
              <p className="text-[var(--color-muted-foreground)] leading-relaxed">
                Rescatar, rehabilitar y reubicar animales domésticos en situación de
                abandono o riesgo, promoviendo la tenencia responsable de mascotas
                y el respeto por la vida animal en nuestra comunidad.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[var(--color-accent)] flex items-center justify-center">
                  <span className="text-xl">🌟</span>
                </div>
                <h2 className="font-heading text-2xl font-bold">Visión</h2>
              </div>
              <p className="text-[var(--color-muted-foreground)] leading-relaxed">
                Ser el refugio de referencia de nuestra región, reconocido por
                su transparencia, efectividad y el impacto positivo que generamos
                en el bienestar animal y la educación comunitaria.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-center mb-10">Nuestros Valores</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <Card className="text-center hover-card h-full">
                  <CardContent className="pt-8 pb-6 px-6">
                    <span className="text-4xl block mb-3">{v.emoji}</span>
                    <h3 className="font-heading text-lg font-semibold mb-2">{v.title}</h3>
                    <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">{v.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-[var(--color-card)] border-y border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-center mb-10">Nuestro Equipo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <Card className="text-center hover-card">
                  <CardContent className="pt-8 pb-6">
                    <span className="text-5xl block mb-3">{member.emoji}</span>
                    <h3 className="font-heading font-semibold">{member.name}</h3>
                    <p className="text-sm text-[var(--color-muted-foreground)] mt-1">{member.role}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA: Historia */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Clock className="h-12 w-12 text-[var(--color-primary)] mx-auto mb-4" />
          <h2 className="font-heading text-3xl font-bold mb-4">Conoce nuestra historia</h2>
          <p className="text-[var(--color-muted-foreground)] mb-8">
            Todo comenzó con un sueño y mucha determinación. Descubre cómo AdoptaME
            nació y cómo ha crecido hasta hoy.
          </p>
          <Button variant="outline" size="lg" asChild>
            <Link to="/nosotros/historia">
              Ver nuestra historia
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
