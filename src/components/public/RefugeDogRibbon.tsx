import { ArrowUpRight, PawPrint } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ResilientImage } from '@/components/ui/ResilientImage';
import { REFUGE_DOG_PROFILES } from '@/data/refugeDogProfiles';
import { assetUrl } from '@/lib/assets';
import { useAllDogEditorial } from '@/hooks/useDogEditorial';

type RefugeDogRibbonProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  start?: number;
  tone?: 'cream' | 'dark' | 'coral';
};

const toneStyles = {
  cream: 'bg-[#fffdf9] text-[#171717]',
  dark: 'bg-[#171717] text-white',
  coral: 'bg-[#f0644a] text-white',
} as const;

export function RefugeDogRibbon({
  eyebrow = 'Ellos son la razón',
  title = 'Tu ayuda tiene nombre, mirada y una historia real.',
  description = 'Conoce a quienes hoy reciben cuidado mientras esperan una familia.',
  start = 0,
  tone = 'cream',
}: RefugeDogRibbonProps) {
  const editorial = useAllDogEditorial();
  const dogs = Array.from({ length: 6 }, (_, index) => {
    const dog = REFUGE_DOG_PROFILES[(start + index) % REFUGE_DOG_PROFILES.length];
    return { dog, story: editorial.find((item) => item.slug === dog.adoption_slug) };
  });
  const isDark = tone !== 'cream';

  return (
    <section className={`${toneStyles[tone]} overflow-hidden py-16 lg:py-20`}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-3xl">
            <p className={`flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.17em] ${isDark ? 'text-[#ffcf5a]' : 'text-[#f0644a]'}`}><PawPrint className="h-4 w-4" /> {eyebrow}</p>
            <h2 className="mt-4 font-heading text-4xl font-extrabold leading-[.95] tracking-[-.055em] sm:text-5xl">{title}</h2>
            <p className={`mt-4 max-w-2xl leading-relaxed ${isDark ? 'text-white/70' : 'text-[#6e6a64]'}`}>{description}</p>
          </div>
          <Link to="/adopta" className={`inline-flex shrink-0 items-center gap-2 font-bold ${isDark ? 'text-white' : 'text-[#f0644a]'}`}>Conocer la manada <ArrowUpRight className="h-4 w-4" /></Link>
        </div>

        <div className="-mx-5 mt-10 flex snap-x gap-3 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-6 lg:overflow-visible lg:px-0 lg:pb-0">
          {dogs.map(({ dog, story }, index) => (
            <motion.article key={dog.adoption_slug} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .3 }} transition={{ delay: index * .05 }} className={`group relative min-w-[10.5rem] snap-start overflow-hidden rounded-[1.35rem] border shadow-xl lg:min-w-0 ${index % 2 ? 'lg:translate-y-5' : ''} ${isDark ? 'border-white/15 bg-white/10' : 'border-[#171717]/10 bg-white'}`}>
              <Link to={`/adopta/${dog.adoption_slug}`} className="block">
                <div className="relative aspect-[4/5] overflow-hidden bg-[#ded6cb]">
                  <ResilientImage src={assetUrl(story?.cover_image_url || dog.main_image_url)} alt={`${dog.name}, perrito rescatado de AdoptaME`} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" style={{ objectPosition: `${story?.focal_x ?? 50}% ${story?.focal_y ?? 50}%` }} />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute inset-x-3 bottom-3 text-white"><p className="font-heading text-xl font-extrabold">{dog.name}</p><p className="mt-0.5 line-clamp-1 text-[10px] text-white/75">{dog.personality_summary}</p></div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
