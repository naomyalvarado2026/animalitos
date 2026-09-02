import { ArrowRight, HandHeart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResilientImage } from '@/components/ui/ResilientImage';
import { REFUGE_DOG_PROFILES } from '@/data/refugeDogProfiles';
import { assetUrl } from '@/lib/assets';
import { useDogEditorial } from '@/hooks/useDogEditorial';

export function DogStoryMoment({ slug, eyebrow, title }: { slug: string; eyebrow: string; title?: string }) {
  const dog = REFUGE_DOG_PROFILES.find((item) => item.adoption_slug === slug);
  const editorial = useDogEditorial(slug);
  if (!dog || !editorial) return null;

  return (
    <section className="bg-[#171717] px-5 py-16 text-white sm:px-8 lg:py-20">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.04] lg:grid-cols-[.82fr_1.18fr]">
        <div className="relative min-h-80 overflow-hidden">
          <ResilientImage src={assetUrl(editorial.cover_image_url)} alt={`${dog.name}, perrito del refugio AdoptaME`} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: `${editorial.focal_x}% ${editorial.focal_y}%` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <p className="absolute bottom-5 left-6 font-heading text-4xl font-extrabold">{dog.name}</p>
        </div>
        <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14"><p className="text-xs font-extrabold uppercase tracking-[.17em] text-[#ffcf5a]">{eyebrow}</p><h2 className="mt-4 font-heading text-4xl font-extrabold leading-[.98] tracking-[-.05em]">{title || editorial.voice_line}</h2>{title && <p className="mt-5 leading-relaxed text-white/70">{editorial.voice_line}</p>}<p className="mt-5 text-sm leading-relaxed text-white/60"><span className="font-bold text-white">Apadrinar puede acompañar:</span> {editorial.sponsor_focus}</p><div className="mt-7 flex flex-col gap-3 sm:flex-row"><Link to={`/adopta/${slug}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f0644a] px-5 py-3 font-bold">Conocer su historia <ArrowRight className="h-4 w-4" /></Link><Link to={`/apadrina/${slug}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-3 font-bold hover:bg-white/10"><HandHeart className="h-4 w-4" /> Apadrinar</Link></div></div>
      </div>
    </section>
  );
}
