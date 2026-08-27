import { BookOpen, Download, HeartHandshake, ShieldCheck } from 'lucide-react';

const RESOURCES = [
  { title: 'Preparar tu hogar', text: 'Una lista sencilla para recibir a un perrito y facilitar sus primeros días.', icon: ShieldCheck },
  { title: 'Tenencia responsable', text: 'Rutinas, salud preventiva, identificación y compromiso para toda la vida.', icon: HeartHandshake },
  { title: 'Adaptación y confianza', text: 'Ideas para acompañar miedos, cambios de conducta y nuevos vínculos.', icon: BookOpen },
];

export function ResourcesPage() {
  return (
    <div className="pt-16">
      <section className="bg-[#f0644a] text-white py-20 sm:py-28"><div className="max-w-5xl mx-auto px-5 sm:px-8"><p className="uppercase tracking-[.16em] text-sm font-bold text-white/80">Educar también es rescatar</p><h1 className="font-heading text-5xl sm:text-7xl font-extrabold tracking-[-.06em] mt-4 max-w-4xl">Herramientas para cuidar mejor.</h1><p className="text-white/80 text-lg leading-relaxed mt-6 max-w-2xl">Recursos claros para familias adoptantes, hogares temporales y cualquier persona que quiera convivir responsablemente con un perro.</p></div></section>
      <section className="py-20 max-w-6xl mx-auto px-5 sm:px-8"><div className="grid md:grid-cols-3 gap-6">{RESOURCES.map(({ title, text, icon: Icon }) => <article key={title} className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-7"><Icon className="h-8 w-8 text-[#f0644a]" /><h2 className="font-heading text-2xl font-extrabold mt-6">{title}</h2><p className="text-[var(--color-muted-foreground)] leading-relaxed mt-3">{text}</p><button type="button" disabled className="inline-flex items-center gap-2 mt-7 text-sm font-bold text-[var(--color-muted-foreground)] cursor-not-allowed"><Download className="h-4 w-4" /> Descargable próximamente</button></article>)}</div></section>
    </div>
  );
}
