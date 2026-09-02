import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Check, HeartHandshake, MessageCircleHeart, PawPrint, ShieldCheck, Sparkles } from 'lucide-react';
import { usePublicSettings } from '@/lib/publicSettings';
import { ResilientImage } from '@/components/ui/ResilientImage';
import { assetUrl } from '@/lib/assets';
import { ContextualFaq } from './ContextualFaq';

type ProcessStep = { number: string; title: string; text: string; emoji?: string };

const STEPS: ProcessStep[] = [
  { number: '01', title: 'Conoce', text: 'Explora la personalidad, energía, salud y necesidades de cada perrito.', emoji: '🤝' },
  { number: '02', title: 'Conecta', text: 'Completa una pre-solicitud para contarnos sobre tu hogar y tu rutina.', emoji: '📋' },
  { number: '03', title: 'Prepárate', text: 'Conversamos contigo, resolvemos dudas y confirmamos que sea un buen match.', emoji: '🏠' },
  { number: '04', title: 'Acompañamos', text: 'La adopción continúa con orientación para la adaptación y la tenencia responsable.', emoji: '🛡️' },
];

const READINESS = [
  'Tiempo real para adaptación, paseos y compañía',
  'Presupuesto para alimento, prevención y veterinario',
  'Acuerdo de todas las personas que viven en casa',
  'Un compromiso que acompaña toda su vida',
];

export function AdoptionProcessPage() {
  const { data: settings } = usePublicSettings(['process_intro', 'adoption_process_steps']);
  const steps = useMemo<ProcessStep[]>(() => {
    try {
      const parsed = JSON.parse(settings?.adoption_process_steps ?? 'null');
      return Array.isArray(parsed) && parsed.length ? parsed : STEPS;
    } catch {
      return STEPS;
    }
  }, [settings]);

  return (
    <div className="overflow-hidden bg-[#fffdf9] pt-16 text-[#171717]">
      <section className="relative isolate min-h-[690px] bg-[#171717] text-white lg:min-h-[760px]">
        <div className="absolute inset-y-0 right-0 -z-20 w-full lg:w-[52%]">
          <ResilientImage src={assetUrl('/images/dog_max.jpg')} alt="Perro rescatado esperando conocer a su familia" className="h-full w-full object-cover opacity-45 lg:opacity-95" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#171717] via-[#171717]/75 to-transparent lg:from-[#171717]/90 lg:via-[#171717]/15" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#171717] via-transparent to-transparent lg:hidden" />
        </div>

        <div className="mx-auto grid min-h-[690px] max-w-7xl items-end gap-12 px-5 py-16 sm:px-8 lg:min-h-[760px] lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:px-10 lg:py-24">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }} className="max-w-3xl">
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[.18em] text-[#ff9b87]"><Sparkles className="h-4 w-4" /> Un proceso humano y transparente</p>
            <h1 className="mt-6 font-heading text-6xl font-extrabold leading-[.86] tracking-[-.075em] sm:text-7xl lg:text-[6.5rem]">4 pasos.<br /><span className="text-[#f0644a]">Una decisión</span><br />para toda la vida.</h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/75">{settings?.process_intro?.trim() || 'Queremos que la conexión sea bonita, pero también responsable. Te explicamos cada paso antes de pedirte un compromiso.'}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/adopta" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f0644a] px-6 py-3.5 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#ff8069]">Conocer a los perritos <ArrowRight className="h-4 w-4" /></Link>
              <button type="button" onClick={() => document.getElementById('el-proceso')?.scrollIntoView({ behavior: 'smooth' })} className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 font-bold text-white backdrop-blur transition hover:bg-white/15">Ver cómo funciona</button>
            </div>
          </motion.div>

          <div className="hidden self-end justify-self-end lg:block">
            <div className="w-56 rounded-[2rem] border border-white/20 bg-white/10 p-6 backdrop-blur-xl"><PawPrint className="h-7 w-7 text-[#ff9b87]" /><p className="mt-12 font-heading text-2xl font-extrabold leading-tight">El match correcto importa más que la prisa.</p></div>
          </div>
        </div>
      </section>

      <section id="el-proceso" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-sm font-bold uppercase tracking-[.16em] text-[#f0644a]">Tu recorrido</p>
            <h2 className="mt-4 font-heading text-5xl font-extrabold leading-[.95] tracking-[-.06em] sm:text-6xl">Sin letras pequeñas. Sin saltos de fe.</h2>
            <p className="mt-6 max-w-md leading-relaxed text-[#6e6a64]">Cada etapa existe para proteger el bienestar del animal y darte la seguridad de que estás tomando una decisión informada.</p>
          </div>

          <div className="space-y-5">
            {steps.map((step, index) => (
              <motion.article key={`${step.number}-${step.title}`} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .25 }} transition={{ delay: index * .06 }} className={`group grid gap-7 rounded-[2rem] border border-[#171717]/10 p-7 transition hover:-translate-y-1 sm:grid-cols-[110px_1fr] sm:p-9 ${index === 1 ? 'bg-[#ffcf5a]' : index === 3 ? 'bg-[#171717] text-white' : 'bg-white shadow-[0_15px_45px_rgba(23,23,23,.05)]'}`}>
                <div className="flex items-start justify-between sm:block">
                  <span className={`font-heading text-5xl font-extrabold tracking-[-.06em] ${index === 3 ? 'text-[#f0644a]' : 'text-[#171717]/25'}`}>{step.number || String(index + 1).padStart(2, '0')}</span>
                  <span className="mt-8 block text-4xl" aria-hidden="true">{step.emoji || '🐾'}</span>
                </div>
                <div className="self-center">
                  <p className={`text-xs font-bold uppercase tracking-[.16em] ${index === 3 ? 'text-white/50' : 'text-[#f0644a]'}`}>Paso {index + 1}</p>
                  <h3 className="mt-2 font-heading text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">{step.title}</h3>
                  <p className={`mt-4 max-w-xl leading-relaxed ${index === 3 ? 'text-white/70' : 'text-[#5f5a54]'}`}>{step.text}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#ede5da] px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2.25rem] bg-[#fffdf9] shadow-[0_25px_70px_rgba(23,23,23,.1)] lg:grid-cols-2">
          <div className="relative min-h-[390px] overflow-hidden">
            <ResilientImage src={assetUrl('/images/shelter_hero_1785817115197.jpg')} alt="Familia compartiendo con un perro adoptado" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
            <p className="absolute bottom-7 left-7 max-w-sm font-heading text-3xl font-extrabold leading-tight text-white sm:bottom-10 sm:left-10 sm:text-4xl">Prepararse también es una forma de amar.</p>
          </div>
          <div className="p-7 sm:p-10 lg:p-14">
            <p className="text-sm font-bold uppercase tracking-[.16em] text-[#f0644a]">Antes de decir sí</p>
            <h2 className="mt-3 font-heading text-4xl font-extrabold tracking-[-.055em]">Hazte estas cuatro promesas.</h2>
            <ul className="mt-8 space-y-5">{READINESS.map((item) => <li key={item} className="flex items-start gap-3 border-b border-[#171717]/10 pb-5 font-semibold leading-relaxed"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f0644a] text-white"><Check className="h-4 w-4" /></span>{item}</li>)}</ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
        <div className="grid gap-5 md:grid-cols-3">
          <article className="rounded-[1.75rem] border border-[#171717]/10 bg-white p-7"><MessageCircleHeart className="h-7 w-7 text-[#f0644a]" /><h3 className="mt-8 font-heading text-2xl font-extrabold">Conversación, no examen</h3><p className="mt-3 leading-relaxed text-[#6e6a64]">Queremos conocerte y resolver dudas con honestidad. La conversación va en ambos sentidos.</p></article>
          <article className="rounded-[1.75rem] bg-[#f0644a] p-7 text-white"><ShieldCheck className="h-7 w-7" /><h3 className="mt-8 font-heading text-2xl font-extrabold">Bienestar primero</h3><p className="mt-3 leading-relaxed text-white/80">Las necesidades de cada animal orientan el match, incluso cuando eso significa esperar un poco más.</p></article>
          <article className="rounded-[1.75rem] border border-[#171717]/10 bg-white p-7"><HeartHandshake className="h-7 w-7 text-[#f0644a]" /><h3 className="mt-8 font-heading text-2xl font-extrabold">No te soltamos la mano</h3><p className="mt-3 leading-relaxed text-[#6e6a64]">La llegada a casa abre una nueva etapa. Te acompañamos con orientación para una adaptación gradual.</p></article>
        </div>
      </section>

      <ContextualFaq category="adoption" title="Antes de dar el sí, despeja tus dudas." />

      <section className="bg-[#171717] px-5 py-20 text-white sm:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-bold uppercase tracking-[.18em] text-[#ff9b87]">¿Listo para empezar?</p>
          <h2 className="mt-4 font-heading text-5xl font-extrabold tracking-[-.06em] sm:text-6xl">Tu próximo mejor amigo puede estar esperando.</h2>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/adopta" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f0644a] px-6 py-3.5 font-bold hover:bg-[#ff8069]">Explorar adopciones <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/voluntariado" className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3.5 font-bold hover:bg-white/10">Todavía no puedo adoptar</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
