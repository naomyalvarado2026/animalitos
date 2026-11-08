import { motion } from 'motion/react';
import { ClipboardCheck, MessageCircle, Compass, Users } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    icon: ClipboardCheck,
    title: 'Postulación en línea',
    time: '2 minutos',
    desc: 'Completa el formulario indicando tu disponibilidad, intereses y habilidades. Sin compromisos rígidos.',
    accent: 'bg-[#ffcf5a]/20 text-[#171717]',
    border: 'border-[#ffcf5a]',
  },
  {
    number: '02',
    icon: MessageCircle,
    title: 'Contacto por WhatsApp',
    time: 'En 24 a 48 horas',
    desc: 'Un coordinador del refugio te escribirá para saludarte, aclarar dudas y contarte las próximas fechas disponibles.',
    accent: 'bg-[#d9efdc]/40 text-[#1b5e20]',
    border: 'border-[#a8d5ad]',
  },
  {
    number: '03',
    icon: Compass,
    title: 'Inducción y primera jornada',
    time: 'Acompañamiento 100%',
    desc: 'Tu primera visita será guiada por un voluntario mentor con experiencia. Aprenderás normas de manejo positivo y seguridad.',
    accent: 'bg-[#f9dcd5]/40 text-[#9b321f]',
    border: 'border-[#f0aba0]',
  },
  {
    number: '04',
    icon: Users,
    title: 'Manada activa y libre elección',
    time: 'A tu propio ritmo',
    desc: 'Te integras a la comunidad y te anotas a las jornadas mensuales que se adapten a tu horario personal.',
    accent: 'bg-[#cbdcf4]/35 text-[#0d47a1]',
    border: 'border-[#9abde7]',
  },
];

export function VolunteerJourneyRoadmap() {
  return (
    <section className="bg-[#f8f4ee] px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#f0644a]">
            Proceso transparente y cercano
          </p>
          <h2 className="mt-3 font-heading text-4xl font-extrabold tracking-[-.05em] text-[#171717] sm:text-5xl">
            Tu camino como voluntario paso a paso
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#6e6a64]">
            Sabemos que dar el primer paso puede generar dudas. En AdoptaME nunca estarás solo: te acompañamos desde el primer mensaje hasta cada abrazo con la manada.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative flex flex-col justify-between rounded-3xl border border-[#171717]/10 bg-white p-7 shadow-xs transition hover:-translate-y-1 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#171717] text-white">
                      <Icon className="h-6 w-6 text-[#ff9b87]" />
                    </span>
                    <span className="font-heading text-2xl font-extrabold text-[#171717]/20">
                      {step.number}
                    </span>
                  </div>

                  <span className="mt-6 inline-block rounded-full bg-[#f8f4ee] px-3 py-1 text-[11px] font-bold text-[#f0644a]">
                    {step.time}
                  </span>

                  <h3 className="mt-3 font-heading text-xl font-extrabold text-[#171717]">
                    {step.title}
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-[#6e6a64]">{step.desc}</p>
                </div>

                <div className="mt-6 border-t border-[#171717]/5 pt-4 text-[11px] font-semibold text-[#171717]/50">
                  Paso {index + 1} del voluntariado
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
