import { ArrowUpRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ResilientImage } from '@/components/ui/ResilientImage';
import { REFUGE_DOG_PROFILES } from '@/data/refugeDogProfiles';
import { assetUrl } from '@/lib/assets';
import { useAllDogEditorial } from '@/hooks/useDogEditorial';

export function PackMosaic() {
  const editorial = useAllDogEditorial();
  const profiles = REFUGE_DOG_PROFILES.map((dog) => ({ dog, editorial: editorial.find((item) => item.slug === dog.adoption_slug) }));

  return (
    <section className="overflow-hidden bg-[#171717] py-20 text-white lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:items-end">
          <div><p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.18em] text-[#ffcf5a]"><Sparkles className="h-4 w-4" /> La manada real</p><h2 className="mt-4 font-heading text-5xl font-extrabold leading-[.92] tracking-[-.06em] sm:text-6xl">Doce miradas.<br /><span className="text-[#f0644a]">Doce mundos.</span></h2></div>
          <div className="lg:pb-1"><p className="max-w-xl leading-relaxed text-white/65">No son fotografías de catálogo. Son quienes viven, juegan, sanan y esperan en el refugio. Entra en una imagen para escuchar su historia.</p><Link to="/adopta" className="mt-5 inline-flex items-center gap-2 font-bold text-[#ff9a62]">Explorar todos los perfiles <ArrowUpRight className="h-4 w-4" /></Link></div>
        </div>

        <div className="-mx-5 mt-12 flex snap-x gap-3 overflow-x-auto px-5 pb-3 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:auto-rows-[155px] lg:grid-cols-6 lg:px-0 lg:pb-0">
          {profiles.map(({ dog, editorial: story }, index) => (
            <motion.article key={dog.adoption_slug} initial={{ opacity: 0, scale: .96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: .25 }} transition={{ delay: Math.min(index * .04, .25) }} className={`group relative min-w-[15rem] snap-center overflow-hidden rounded-[1.4rem] border border-white/10 bg-white/5 ${index === 0 || index === 7 ? 'lg:col-span-2 lg:row-span-2' : 'lg:col-span-1 lg:row-span-1'}`}>
              <Link to={`/adopta/${dog.adoption_slug}`} className="block h-full">
                <ResilientImage src={assetUrl(story?.cover_image_url || dog.main_image_url)} alt={`${dog.name}, integrante de la manada AdoptaME`} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" style={{ objectPosition: `${story?.focal_x ?? 50}% ${story?.focal_y ?? 50}%` }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-transparent" />
                <div className="absolute inset-x-4 bottom-4"><p className="font-heading text-xl font-extrabold">{dog.name}</p><p className="mt-1 line-clamp-2 translate-y-2 text-[11px] leading-relaxed text-white/0 transition duration-300 group-hover:translate-y-0 group-hover:text-white/75">{story?.voice_line}</p></div>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
