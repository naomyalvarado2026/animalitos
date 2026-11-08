import { motion } from 'motion/react';
import { ShieldCheck, HeartHandshake, Award, BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function VolunteerManifesto({ onOpenGuide }: { onOpenGuide: () => void }) {
  const principles = [
    {
      icon: ShieldCheck,
      title: 'Seguridad y bienestar primero',
      desc: 'Jamás forzamos a un perrito a interactuar si tiene miedo. Aprendemos a leer su lenguaje corporal y a respetar su ritmo.',
    },
    {
      icon: HeartHandshake,
      title: 'Manejo en positivo estricto',
      desc: 'Cero castigos, jalones o intimidaciones. Aquí educamos premiando la calma, reforzando la confianza y con amor infinito.',
    },
    {
      icon: Award,
      title: 'Certificado de horas donadas',
      desc: 'Si eres estudiante o necesitas acreditar horas de servicio comunitario o vinculación universitaria, emitimos constancia oficial.',
    },
    {
      icon: Sparkles,
      title: 'Acompañamiento y comunidad',
      desc: 'Nunca estarás desorientado. El equipo y mentores voluntarios siempre están listos para asistirte y compartir refrigerios juntos.',
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-[#171717]/10 bg-[#fffdf9] p-8 shadow-xl sm:p-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#f0644a]/20 bg-[#f0644a]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-[.14em] text-[#f0644a]">
              <Sparkles className="h-3.5 w-3.5" /> Ética y Cuidado Mutuo
            </div>
            <h2 className="mt-4 font-heading text-4xl font-extrabold tracking-[-.05em] text-[#171717] sm:text-5xl">
              Cuidamos de los peluditos. Y cuidamos de ti.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#4f4a45]">
              El voluntariado en AdoptaME es un espacio seguro, alegre y enriquecedor. Nos regimos por protocolos de bienestar avalados por médicos veterinarios y educadores caninos para que cada jornada sea una experiencia reconfortante.
            </p>

            <div className="mt-8">
              <Button
                onClick={onOpenGuide}
                variant="outline"
                className="border-[#171717]/20 bg-white font-bold text-[#171717] hover:bg-[#f8f4ee]"
              >
                <BookOpen className="mr-2 h-4 w-4 text-[#f0644a]" />
                Abrir Guía Rápida del Voluntario
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {principles.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="rounded-2xl border border-[#171717]/10 bg-[#faf7f2] p-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xs">
                    <Icon className="h-5 w-5 text-[#f0644a]" />
                  </div>
                  <h3 className="mt-4 font-heading text-base font-bold text-[#171717]">{item.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#6e6a64]">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
