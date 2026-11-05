import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, CheckCircle2, Heart, House, MapPin, PawPrint, Share2, Sparkles, Stethoscope } from 'lucide-react';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ResilientImage } from '@/components/ui/ResilientImage';
import { AdoptionRequestDialog } from './AdoptionRequestDialog';
import { DogSocialCardPreview } from './DogSocialCardPreview';
import { RefugeDogRibbon } from './RefugeDogRibbon';
import { supabase } from '@/lib/supabase';
import { assetUrl } from '@/lib/assets';
import { mergeRefugeDogs } from '@/lib/refugeDogs';
import { useDogEditorial } from '@/hooks/useDogEditorial';
import type { Animal } from '@/types';
import type { DogEditorialProfile } from '@/data/dogEditorialProfiles';

function formatAge(months: number | null, estimated = false) {
  if (months == null) return 'Edad por confirmar';
  if (months < 12) return `${estimated ? 'Aprox. ' : ''}${months} meses`;
  const years = Math.floor(months / 12);
  return `${estimated ? 'Aprox. ' : ''}${years} ${years === 1 ? 'año' : 'años'}`;
}

const sizeLabels: Record<Animal['size'], string> = {
  unknown: 'Tamaño por confirmar',
  small: 'Pequeño',
  medium: 'Mediano',
  large: 'Grande',
  extra_large: 'Muy grande',
};

function buildEditorialFallback(dog: Animal): DogEditorialProfile {
  const storyParts = (dog.story || dog.description).split(/(?<=[.!?])\s+/).filter(Boolean);
  const chapters = storyParts.length ? storyParts : [dog.description];
  return {
    slug: dog.adoption_slug || dog.name.toLowerCase(),
    voice_line: `ME llamo ${dog.name}. Mi historia todavía se está escribiendo y me gustaría encontrar un hogar responsable.`,
    social_caption: `${dog.name} tiene una historia que merece continuar en familia. Conoce su perfil en AdoptaME.`,
    sponsor_focus: dog.is_special_needs
      ? dog.special_needs_desc || 'Bienestar diario, controles y cuidados especiales.'
      : 'Alimento, prevención veterinaria y bienestar diario.',
    accent_color: '#ff8069',
    cover_image_url: dog.main_image_url,
    gallery_urls: dog.gallery_urls || [],
    focal_x: 50,
    focal_y: 50,
    featured: false,
    appearances: ['adoption'],
    timeline: chapters.slice(0, 3).map((description, index) => ({
      id: `${dog.id}-chapter-${index}`,
      eyebrow: index === 0 ? 'Su historia' : index === chapters.length - 1 ? 'Su presente' : 'Su camino',
      title: index === 0 ? 'Antes del refugio' : index === chapters.length - 1 ? 'Una nueva oportunidad' : 'Cuidado y recuperación',
      description,
    })),
  };
}

export function DogProfilePage() {
  const { slug = '' } = useParams();
  const [isAdoptOpen, setIsAdoptOpen] = useState(false);
  const savedEditorial = useDogEditorial(slug);
  const query = useQuery({
    queryKey: ['dog-profile', slug],
    queryFn: async () => {
      const { data, error } = await supabase.from('animals').select('*').eq('species', 'dog');
      if (error) throw error;
      return (data ?? []) as Animal[];
    },
    staleTime: 60_000,
  });
  const dogs = useMemo(() => mergeRefugeDogs(query.data ?? []), [query.data]);
  const dog = dogs.find((item) => (item.adoption_slug || item.name.toLowerCase()) === slug);
  const editorial = savedEditorial || (dog ? buildEditorialFallback(dog) : undefined);
  const dogIndex = dog ? dogs.findIndex((item) => item.id === dog.id) : -1;
  const previous = dogIndex > 0 ? dogs[dogIndex - 1] : dogs[dogs.length - 1];
  const next = dogIndex >= 0 && dogIndex < dogs.length - 1 ? dogs[dogIndex + 1] : dogs[0];

  if (!dog || !editorial) {
    return (
      <div className="min-h-[70vh] bg-[#17022b] px-5 pt-36 text-center text-[#faf7fd]">
        <PawPrint className="mx-auto h-10 w-10 text-[#ff8069]" />
        <h1 className="mt-5 font-heading text-4xl font-extrabold">Esa historia todavía no está publicada.</h1>
        <Link to="/adopta" className="mt-7 inline-flex items-center gap-2 font-bold text-[#e0beff]">
          <ArrowLeft className="h-4 w-4" /> Volver a la manada
        </Link>
      </div>
    );
  }

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: `${dog.name} busca familia | AdoptaME`, text: editorial.social_caption, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success('Enlace copiado.');
      }
    } catch {
      /* compartir cancelado */
    }
  };

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${dog.name} busca familia`,
    description: dog.description,
    image: new URL(assetUrl(editorial.cover_image_url), window.location.origin).toString(),
    about: { '@type': 'Thing', name: 'Adopción responsable de perros' },
  };

  return (
    <div className="overflow-hidden bg-[var(--color-background)] pt-16 text-[var(--color-foreground)]">
      <Helmet>
        <title>{dog.name} busca familia | AdoptaME</title>
        <meta name="description" content={dog.description} />
        <meta property="og:title" content={`${dog.name} busca familia | AdoptaME`} />
        <meta property="og:description" content={editorial.voice_line} />
        <meta property="og:image" content={assetUrl(editorial.cover_image_url)} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <section className="relative min-h-[680px] bg-[#17022b] text-[#faf7fd]">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[54%]">
          <ResilientImage
            src={assetUrl(editorial.cover_image_url)}
            alt={`${dog.name}, perrito rescatado de AdoptaME`}
            className="h-full w-full object-cover opacity-55 lg:opacity-100"
            style={{ objectPosition: `${editorial.focal_x}% ${editorial.focal_y}%` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#17022b] via-[#17022b]/75 to-transparent lg:from-[#17022b] lg:via-[#17022b]/25" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#17022b] to-transparent lg:hidden" />
        </div>
        <div className="relative mx-auto flex min-h-[680px] max-w-7xl items-end px-5 py-14 sm:px-8 lg:items-center lg:px-10 lg:py-24">
          <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
            <Link to="/adopta" className="inline-flex items-center gap-2 text-sm font-bold text-[#f1e2ff]/70 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Volver a la manada
            </Link>
            <p className="mt-8 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.18em] text-[#e0beff]">
              <Sparkles className="h-4 w-4 text-[#ff8069]" /> Una historia real
            </p>
            <h1 className="mt-4 font-heading text-6xl font-extrabold leading-[.86] tracking-[-.07em] sm:text-8xl lg:text-[7rem]">
              {dog.name}
            </h1>
            <blockquote className="mt-7 max-w-xl border-l-2 border-[#ff8069] pl-5 text-lg font-semibold leading-relaxed text-[#f1e2ff]/88 sm:text-xl">
              “{editorial.voice_line}”
            </blockquote>
            <div className="mt-7 flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-white/10 px-3 py-2">{dog.gender === 'male' ? 'Macho' : 'Hembra'}</span>
              <span className="rounded-full bg-white/10 px-3 py-2">{formatAge(dog.age_months, dog.age_is_estimated)}</span>
              <span className="rounded-full bg-white/10 px-3 py-2">{sizeLabels[dog.size]}</span>
              {dog.is_special_needs && (
                <span className="rounded-full bg-[#ff8069] px-3 py-2 text-[#17022b]">Cuidados especiales</span>
              )}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="bg-[#ff8069] text-[#17022b] hover:bg-[#ff9885]" onClick={() => setIsAdoptOpen(true)}>
                Quiero conocer a {dog.name} <ArrowRight />
              </Button>
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
                <Link to={`/apadrina/${slug}`}>
                  <Heart className="text-[#ff8069]" /> Apadrinar
                </Link>
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-11 w-11 border-white/20 text-white hover:bg-white/10"
                onClick={share}
                aria-label={`Compartir la historia de ${dog.name}`}
              >
                <Share2 />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[.72fr_1.28fr] lg:px-10 lg:py-24">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-xs font-extrabold uppercase tracking-[.17em] text-[var(--color-primary)]">Su historia completa</p>
          <h2 className="mt-4 font-heading text-4xl font-extrabold leading-[.95] tracking-[-.06em] sm:text-5xl">
            Antes de conocerte, ya había recorrido un camino enorme.
          </h2>
          <p className="mt-5 leading-relaxed text-[var(--color-muted-foreground)]">
            Contamos lo que sabemos con honestidad, sin completar datos que todavía necesitan confirmación.
          </p>
          <Button variant="warm" className="mt-6" onClick={() => setIsAdoptOpen(true)}>
            <Heart className="h-4 w-4" /> Solicitar encuentro con {dog.name}
          </Button>
        </aside>
        <div>
          <p className="text-lg leading-8 text-[var(--color-foreground)]/90">{dog.story}</p>
          {dog.show_brand_moment && (
            <blockquote className="mt-8 rounded-[1.75rem] bg-[#3c096c] p-7 text-white">
              <p className="font-heading text-2xl font-extrabold">
                Adopta<span className="text-[#ff8069]">ME</span>
              </p>
              <p className="mt-3 text-lg leading-relaxed text-[#f1e2ff]/88">{dog.brand_message}</p>
            </blockquote>
          )}
        </div>
      </section>

      <section className="border-y border-[var(--color-border)] bg-[var(--color-muted)]/60 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[.17em] text-[var(--color-primary)]">Su línea de vida</p>
            <h2 className="mt-4 font-heading text-4xl font-extrabold tracking-[-.055em] sm:text-5xl">Rescate, recuperación y presente.</h2>
          </div>
          <div className="relative mt-12 grid gap-5 lg:grid-cols-3">
            <div className="absolute left-[16%] right-[16%] top-7 hidden h-px bg-[var(--color-border)] lg:block" />
            {editorial.timeline.map((item, index) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: index * 0.1 }}
                className="relative rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-card)] p-7"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#17022b] font-heading text-xl font-extrabold text-[#ff8069]">
                  0{index + 1}
                </span>
                <p className="mt-8 text-xs font-extrabold uppercase tracking-[.15em] text-[var(--color-primary)]">{item.eyebrow}</p>
                <h3 className="mt-3 font-heading text-2xl font-extrabold">{item.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted-foreground)]">{item.description}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
            <Stethoscope className="h-6 w-6 text-[#ff8069]" />
            <h2 className="mt-6 font-heading text-xl font-extrabold">Salud</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted-foreground)]">{dog.health_status}</p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
            <House className="h-6 w-6 text-[#ff8069]" />
            <h2 className="mt-6 font-heading text-xl font-extrabold">Hogar ideal</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              {dog.ideal_home || 'El equipo debe confirmar esta recomendación antes de avanzar.'}
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
            <PawPrint className="h-6 w-6 text-[#ff8069]" />
            <h2 className="mt-6 font-heading text-xl font-extrabold">Convivencia</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              {dog.compatibility_notes || 'Convivencia por evaluar con el equipo durante la conversación inicial.'}
            </p>
          </article>
          <article className="rounded-[1.5rem] bg-[#17022b] p-6 text-white">
            <MapPin className="h-6 w-6 text-[#ff8069]" />
            <h2 className="mt-6 font-heading text-xl font-extrabold">Dónde está</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#f1e2ff]/75">
              {dog.location}. Las visitas se coordinan previamente para cuidar su rutina.
            </p>
            <p className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-300">
              <CheckCircle2 className="h-4 w-4" /> Perfil revisado por el refugio
            </p>
          </article>
        </div>
      </section>

      <section className="border-t border-[var(--color-border)] bg-[var(--color-muted)]/40 px-5 py-16 sm:px-8 lg:py-22">
        <div className="mx-auto max-w-6xl rounded-[2.25rem] border border-[var(--color-border)] bg-[var(--color-card)] p-6 sm:p-10 lg:p-14">
          <DogSocialCardPreview animal={dog} editorial={editorial} />
        </div>
      </section>

      <section className="bg-[#17022b] px-5 py-16 text-white sm:px-8 lg:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.17em] text-[#e0beff]">Acompañar mientras espera</p>
            <h2 className="mt-4 font-heading text-4xl font-extrabold tracking-[-.055em] sm:text-5xl">
              También puedes ser parte de su presente.
            </h2>
            <p className="mt-5 max-w-2xl leading-relaxed text-[#f1e2ff]/75">
              El apadrinamiento no reemplaza la adopción. Ayuda a sostener su bienestar mientras llega el hogar adecuado.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
            <Heart className="h-7 w-7 fill-[#ff8069] text-[#ff8069]" />
            <p className="mt-5 text-sm leading-relaxed text-[#f1e2ff]/80">{editorial.sponsor_focus}</p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button variant="warm" className="flex-1" asChild>
                <Link to={`/apadrina/${slug}`}>Quiero apadrinar a {dog.name}</Link>
              </Button>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => setIsAdoptOpen(true)}>
                Adoptar
              </Button>
            </div>
          </div>
        </div>
      </section>

      <nav aria-label="Otras historias" className="grid grid-cols-2 bg-[#f1e2ff] text-[#17022b]">
        <Link to={`/adopta/${previous.adoption_slug}`} className="border-r border-[#17022b]/15 p-6 transition hover:bg-[#e0beff]/60 sm:p-10">
          <span className="text-xs font-bold uppercase tracking-[.14em] text-[#3c096c]">← Historia anterior</span>
          <span className="mt-2 block font-heading text-2xl font-extrabold">{previous.name}</span>
        </Link>
        <Link to={`/adopta/${next.adoption_slug}`} className="p-6 text-right transition hover:bg-[#e0beff]/60 sm:p-10">
          <span className="text-xs font-bold uppercase tracking-[.14em] text-[#3c096c]">Siguiente historia →</span>
          <span className="mt-2 block font-heading text-2xl font-extrabold">{next.name}</span>
        </Link>
      </nav>
      <RefugeDogRibbon
        start={(dogIndex + 1) % dogs.length}
        eyebrow="Sigue conociendo la manada"
        title="Cada mirada guarda otra historia."
        description="Explora otros perfiles y descubre qué tipo de hogar necesita cada uno."
      />

      <AdoptionRequestDialog animal={dog} open={isAdoptOpen} onClose={() => setIsAdoptOpen(false)} />
    </div>
  );
}
