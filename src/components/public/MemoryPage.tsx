import { Heart, Sparkles } from 'lucide-react';

export function MemoryPage() {
  return (
    <div className="pt-16">
      <section className="bg-[#171717] text-[#fffdf9] py-20 sm:py-28"><div className="max-w-4xl mx-auto px-5 sm:px-8 text-center"><Sparkles className="h-9 w-9 text-[#ff8069] mx-auto" /><p className="text-[#ff8069] uppercase tracking-[.16em] text-sm font-bold mt-6">En memoria de</p><h1 className="font-heading text-5xl sm:text-7xl font-extrabold tracking-[-.06em] mt-3">Las huellas que siguen con nosotros.</h1><p className="text-white/70 text-lg leading-relaxed mt-6 max-w-2xl mx-auto">Un espacio para honrar a los perritos que pasaron por AdoptaME y dejaron una historia en nuestra manada.</p></div></section>
      <section className="py-24 max-w-3xl mx-auto px-5 sm:px-8 text-center"><Heart className="h-10 w-10 text-[#f0644a] fill-current mx-auto" /><h2 className="font-heading text-3xl font-extrabold mt-5">Próximamente, sus historias.</h2><p className="text-[var(--color-muted-foreground)] leading-relaxed mt-4">Este memorial se llenará con fotografías, fechas y recuerdos compartidos por el equipo y sus familias. Cada homenaje será publicado con autorización y respeto.</p></section>
    </div>
  );
}
