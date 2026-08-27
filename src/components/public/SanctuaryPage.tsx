import { Link } from 'react-router-dom';
import { assetUrl } from '@/lib/assets';
import { ArrowRight, Heart, PawPrint, ShieldCheck } from 'lucide-react';
import { usePublicSettings } from '@/lib/publicSettings';
import { ResilientImage } from '@/components/ui/ResilientImage';

export function SanctuaryPage() {
  const { data: settings } = usePublicSettings(['sanctuary_intro']);
  const { data: content } = usePublicSettings(['sanctuary_residents']);
  let residents: { name: string; text: string; image: string }[] = [];
  try {
    const parsed = content?.sanctuary_residents ? JSON.parse(content.sanctuary_residents) : null;
    if (Array.isArray(parsed)) residents = parsed.filter((resident) => resident?.name && resident?.text).map((resident) => ({ ...resident, image: assetUrl(resident.image || '/images/dog_max.jpg') }));
  } catch { /* usar contenido base */ }
  return (
    <div className="pt-16">
      <section className="bg-[#ffcf5a] text-[#171717] py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-5 sm:px-8"><PawPrint className="h-10 w-10" /><p className="uppercase tracking-[.16em] text-sm font-bold mt-7">La manada permanente</p><h1 className="font-heading text-5xl sm:text-7xl font-extrabold tracking-[-.06em] mt-3 max-w-4xl">Algunos no buscan una familia. Buscan una vida digna.</h1><p className="max-w-2xl text-lg leading-relaxed mt-6">{settings?.sanctuary_intro?.trim() || 'El santuario acompaña a perritos senior o con condiciones especiales que no pueden ser dados en adopción tradicional.'}</p></div>
      </section>
      <section className="py-20 max-w-6xl mx-auto px-5 sm:px-8">{residents.length ? <div className="grid md:grid-cols-2 gap-7">{residents.map((resident) => <article key={resident.name} className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)]"><ResilientImage src={resident.image} alt={`Perrito residente: ${resident.name}`} loading="lazy" decoding="async" className="w-full h-64 object-cover" /><div className="p-7"><div className="flex items-center gap-2 text-[#f0644a]"><Heart className="h-5 w-5 fill-current" /><span className="font-bold text-sm uppercase tracking-[.12em]">Residente permanente</span></div><h2 className="font-heading text-3xl font-extrabold mt-4">{resident.name}</h2><p className="text-[var(--color-muted-foreground)] leading-relaxed mt-3">{resident.text}</p><Link to="/contacto/quiero-apoyar" className="inline-flex items-center gap-2 mt-6 text-[#f0644a] font-bold">Quiero apadrinar <ArrowRight className="h-4 w-4" /></Link></div></article>)}</div> : <div className="rounded-3xl border border-dashed border-[var(--color-border)] p-10 text-center text-[var(--color-muted-foreground)]">Estamos actualizando la información de nuestros residentes permanentes. Si deseas apoyar, <Link to="/contacto/quiero-apoyar" className="font-bold text-[#f0644a]">conoce cómo ayudar</Link>.</div>}</section>
      <section className="bg-[#171717] text-[#fffdf9] py-16"><div className="max-w-4xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row gap-6 items-start"><ShieldCheck className="h-9 w-9 text-[#ff8069] shrink-0" /><div><h2 className="font-heading text-3xl font-extrabold">Apadrinar es sostener una rutina.</h2><p className="text-white/70 leading-relaxed mt-3">Los aportes ayudan a cubrir alimento, medicinas, controles veterinarios y bienestar diario. Publicaremos el impacto con cifras verificables cuando el programa esté conectado a la base de datos.</p></div></div></section>
    </div>
  );
}
