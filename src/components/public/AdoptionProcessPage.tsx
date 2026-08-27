import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ClipboardCheck, Home, HeartHandshake, ShieldCheck } from 'lucide-react';

const STEPS = [
  { number: '01', title: 'Conoce', text: 'Explora la personalidad, energía, salud y necesidades de cada perrito.', icon: HeartHandshake },
  { number: '02', title: 'Conecta', text: 'Completa una pre-solicitud para contarnos sobre tu hogar y tu rutina.', icon: ClipboardCheck },
  { number: '03', title: 'Prepárate', text: 'Conversamos contigo, resolvemos dudas y confirmamos que sea un buen match.', icon: Home },
  { number: '04', title: 'Acompañamos', text: 'La adopción continúa con orientación para la adaptación y la tenencia responsable.', icon: ShieldCheck },
];

export function AdoptionProcessPage() {
  return (
    <div className="pt-16">
      <section className="bg-[#171717] text-[#fffdf9] py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <p className="text-[#ff8069] uppercase tracking-[.16em] text-sm font-bold">Adoptar es una decisión de vida</p>
          <h1 className="font-heading text-5xl sm:text-7xl font-extrabold tracking-[-.06em] mt-4 max-w-4xl">Un proceso claro para encontrar el hogar correcto.</h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-2xl mt-6">Queremos que la conexión sea bonita, pero también responsable. Te explicamos cada paso antes de pedirte un compromiso.</p>
          <Link to="/adopta" className="inline-flex items-center gap-2 mt-8 rounded-xl bg-[#f0644a] px-5 py-3 font-bold hover:bg-[#ff8069]">Ver perritos disponibles <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
      <section className="py-20 max-w-6xl mx-auto px-5 sm:px-8">
        <div className="grid md:grid-cols-4 gap-5">
          {STEPS.map(({ number, title, text, icon: Icon }) => (
            <article key={number} className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
              <span className="text-[#f0644a] font-heading font-extrabold text-sm">{number}</span>
              <Icon className="h-7 w-7 text-[#f0644a] mt-8" />
              <h2 className="font-heading text-2xl font-extrabold mt-5">{title}</h2>
              <p className="text-[var(--color-muted-foreground)] leading-relaxed mt-3">{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="bg-[#ede5da] py-16">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 grid md:grid-cols-2 gap-10 items-center">
          <div><p className="text-[#f0644a] uppercase tracking-[.15em] text-sm font-bold">Antes de decir sí</p><h2 className="font-heading text-4xl font-extrabold mt-3">La preparación también es amor.</h2><p className="text-[#6e6a64] leading-relaxed mt-4">Considera tiempo, presupuesto, espacio, convivencia y cuidados veterinarios. Si todavía no puedes adoptar, hay otras maneras de cambiar una vida.</p></div>
          <ul className="space-y-4 text-[#171717]">
            {['Tiempo para adaptación y paseos', 'Presupuesto para alimento y salud', 'Acuerdo de todas las personas del hogar', 'Compromiso de por vida'].map((item) => <li key={item} className="flex items-center gap-3 font-semibold"><CheckCircle2 className="h-5 w-5 text-[#f0644a]" />{item}</li>)}
          </ul>
        </div>
      </section>
    </div>
  );
}
