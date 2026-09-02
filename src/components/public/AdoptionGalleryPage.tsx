import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Baby, Check, CheckCircle2, Heart, House, MapPin, PawPrint, RotateCcw, Ruler, Search, Share2, ShieldCheck, Sparkles, Stethoscope, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { assetUrl } from '@/lib/assets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResilientImage } from '@/components/ui/ResilientImage';
import { Textarea } from '@/components/ui/textarea';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
import { PetMatchmaker } from './PetMatchmaker';
import { isLocalRefugeDog, mergeRefugeDogs } from '@/lib/refugeDogs';
import type { Animal } from '@/types';

const adoptionSchema = z.object({
  applicant_name: z.string().min(2, 'Ingresa tu nombre completo'),
  applicant_email: z.string().email('Email inválido'),
  applicant_phone: z.string().min(7, 'Teléfono válido requerido'),
  applicant_address: z.string().min(5, 'Ingresa tu dirección'),
  housing_type: z.enum(['house', 'apartment', 'farm']),
  has_yard: z.boolean(),
  has_other_pets: z.boolean(),
  other_pets_desc: z.string().optional(),
  reason: z.string().min(15, 'Explícanos brevemente por qué deseas adoptar (mínimo 15 caracteres)'),
});

type AdoptionFormData = z.infer<typeof adoptionSchema>;
type GalleryMode = 'all' | 'medical' | 'favorites';

const sizeLabels: Record<Animal['size'], string> = {
  unknown: 'Por confirmar',
  small: 'Pequeño',
  medium: 'Mediano',
  large: 'Grande',
  extra_large: 'Muy grande',
};

function getAgeMonths(animal: Animal): number | null {
  const raw = animal as unknown as Record<string, unknown>;
  return animal.age_months ?? (typeof raw.age_years === 'number' ? raw.age_years * 12 : null);
}

function formatAge(months: number | null, estimated = false) {
  if (months == null) return 'Por confirmar';
  const prefix = estimated ? 'Aprox. ' : '';
  if (months < 12) return `${prefix}${months} ${months === 1 ? 'mes' : 'meses'}`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return `${prefix}${years} ${years === 1 ? 'año' : 'años'}${rest ? ` · ${rest}m` : ''}`;
}

export function getAnimalImageUrl(animal: Animal): string {
  if (animal.main_image_url) return assetUrl(animal.main_image_url);
  if (animal.gallery_urls && animal.gallery_urls.length > 0) return assetUrl(animal.gallery_urls[0]);
  const raw = animal as unknown as Record<string, unknown>;
  if (Array.isArray(raw.image_urls) && raw.image_urls.length > 0 && typeof raw.image_urls[0] === 'string') {
    return assetUrl(raw.image_urls[0]);
  }
  return assetUrl('/images/dog_max.jpg');
}

export function slugify(value?: string | null): string {
  if (!value || typeof value !== 'string') return '';
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function AdoptionGalleryPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dismissedSlugRef = useRef<string | null>(null);
  const [galleryMode, setGalleryMode] = useState<GalleryMode>('all');
  const [search, setSearch] = useState('');
  const [sizeFilter, setSizeFilter] = useState<'all' | 'small' | 'medium' | 'large'>('all');
  const [ageFilter, setAgeFilter] = useState<'all' | 'puppy' | 'adult' | 'senior'>('all');
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailAnimal, setDetailAnimal] = useState<Animal | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('animalitos_favs');
      const parsed: unknown = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('animalitos_favs', JSON.stringify(favorites));
    } catch (e) {
      console.error('Failed to save favorites:', e);
    }
  }, [favorites]);

  const toggleFavorite = (id: string, name: string) => {
    const exists = favorites.includes(id);
    setFavorites(exists ? favorites.filter((item) => item !== id) : [...favorites, id]);
    if (exists) toast.info(`${name} fue removido de tus favoritos`);
    else toast.success(`❤️ ¡${name} fue guardado en tus favoritos!`);
  };

  const handleShare = async (animal: Animal) => {
    const shareData = {
      title: `¡Adopta a ${animal.name}! - AdoptaME`,
      text: `Conoce a ${animal.name}, un perrito en adopción en AdoptaME.`,
      url: `${window.location.origin}${window.location.pathname}#/adopta/${slugify(animal.name)}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled share
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#/adopta/${slugify(animal.name)}`);
        toast.success('¡Enlace copiado al portapapeles!');
      } catch {
        toast.error('No pudimos copiar el enlace. Intenta compartirlo desde tu navegador.');
      }
    }
  };

  const { data: remoteAnimals = [], isLoading, isError } = useQuery({
    queryKey: ['animals-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('animals')
        .select('*')
        .eq('species', 'dog')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Animal[];
    },
  });
  const animals = useMemo(() => mergeRefugeDogs(remoteAnimals), [remoteAnimals]);

  const beginAdoption = (animal: Animal) => {
    if (isLocalRefugeDog(animal)) {
      toast.info(`Te llevamos a contacto para conversar sobre ${animal.name}.`);
      navigate(`/contacto?perrito=${encodeURIComponent(animal.name)}`);
      return;
    }
    setSelectedAnimal(animal);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (!slug) {
      dismissedSlugRef.current = null;
      return;
    }
    if (isLoading || detailAnimal || dismissedSlugRef.current === slug) return;
    const match = animals.find((animal) => (animal.adoption_slug || slugify(animal.name)) === slug);
    if (match) {
      setDetailAnimal(match);
      setIsDetailModalOpen(true);
    }
  }, [slug, animals, isLoading, detailAnimal]);

  const adoptableAnimals = useMemo(() => animals.filter((animal) => animal.species === 'dog' && animal.is_published !== false && ['available', 'medical_care'].includes(animal.status)).sort((a, b) => (a.sort_order ?? Number.MAX_SAFE_INTEGER) - (b.sort_order ?? Number.MAX_SAFE_INTEGER)), [animals]);
  const filtered = useMemo(() => adoptableAnimals.filter((animal) => {
    if (galleryMode === 'favorites' && !favorites.includes(animal.id)) return false;
    if (galleryMode === 'medical' && animal.status !== 'medical_care' && !animal.is_special_needs) return false;
    if (sizeFilter !== 'all' && animal.size !== sizeFilter) return false;
    const ageMonths = getAgeMonths(animal);
    if (ageFilter !== 'all' && ageMonths == null) return false;
    if (ageFilter === 'puppy' && ageMonths != null && ageMonths > 12) return false;
    if (ageFilter === 'adult' && ageMonths != null && (ageMonths <= 12 || ageMonths > 84)) return false;
    if (ageFilter === 'senior' && ageMonths != null && ageMonths <= 84) return false;
    const needle = search.trim().toLowerCase();
    return !needle || [animal.name, animal.breed, animal.description, animal.story, animal.personality_summary, animal.ideal_home, animal.compatibility_notes, animal.location].some((value) => (value ?? '').toLowerCase().includes(needle));
  }), [adoptableAnimals, ageFilter, favorites, galleryMode, search, sizeFilter]);

  const heroAnimals = adoptableAnimals.slice(0, 2);
  const activeFilterCount = Number(galleryMode !== 'all') + Number(sizeFilter !== 'all') + Number(ageFilter !== 'all') + Number(Boolean(search.trim()));
  const resetFilters = () => {
    setGalleryMode('all');
    setSearch('');
    setSizeFilter('all');
    setAgeFilter('all');
  };

  return (
    <div className="overflow-hidden pt-16">
      {detailAnimal && <Helmet><title>{detailAnimal.name} busca familia | AdoptaME</title><meta name="description" content={detailAnimal.description || `Conoce la historia de ${detailAnimal.name} y el proceso de adopción responsable de AdoptaME.`} /></Helmet>}
      <section className="relative bg-[#171717] py-16 text-[#fffdf9] sm:py-20 lg:py-24">
        <div className="pointer-events-none absolute -left-28 top-10 h-72 w-72 rounded-full border-[62px] border-[#f0644a]/10" />
        <div className="pointer-events-none absolute right-[8%] top-0 h-28 w-28 rounded-full bg-[#ffcf5a]/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[.92fr_1.08fr] lg:px-10">
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ff9a62]/30 px-3 py-1.5 text-xs font-bold uppercase tracking-[.16em] text-[#ff9a62]"><PawPrint className="h-4 w-4" /> Tu historia puede empezar hoy</div>
            <h1 className="mt-7 max-w-2xl font-heading text-5xl font-extrabold leading-[.94] tracking-[-.065em] sm:text-6xl lg:text-[5.1rem]">No buscas una mascota. Buscas a alguien único.</h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/68">Conoce su personalidad, entiende sus necesidades y encuentra ese vínculo que no se puede explicar, solo sentir.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button size="xl" className="bg-[#f0644a] text-white hover:bg-[#ff8069]" onClick={() => document.getElementById('perritos')?.scrollIntoView({ behavior: 'smooth' })}>Conocer a la manada <ArrowRight /></Button><Button size="xl" variant="ghost" className="border border-white/20 text-white hover:bg-white/10" onClick={() => document.getElementById('matchmaker')?.scrollIntoView({ behavior: 'smooth' })}><Sparkles /> Encontrar mi match</Button></div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/60"><span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-[#ffcf5a]" /> Perfiles verificados</span><span className="inline-flex items-center gap-1.5"><Heart className="h-4 w-4 text-[#ffcf5a]" /> Acompañamiento real</span><span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-[#ffcf5a]" /> Adopción responsable</span></div>
            {isError && <p role="status" className="mt-5 rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/65">Estás viendo las historias verificadas del refugio. La sincronización con el panel está temporalmente fuera de línea.</p>}
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .65, delay: .1 }} className="relative mx-auto w-full max-w-2xl lg:translate-x-8">
            <div className="relative ml-auto w-[88%] overflow-hidden rounded-[2rem] border-[8px] border-white/10 bg-[#302d2b] shadow-2xl"><ResilientImage src={heroAnimals[0] ? getAnimalImageUrl(heroAnimals[0]) : assetUrl('/images/dog_max.jpg')} alt={heroAnimals[0] ? `${heroAnimals[0].name}, perrito en adopción` : 'Perrito en adopción'} className="aspect-[4/4.6] w-full object-cover" /><div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#171717]/90 to-transparent" /><div className="absolute bottom-5 left-5 right-5 sm:left-44"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#ffcf5a]">Conoce a</p><p className="mt-1 font-heading text-4xl font-extrabold">{heroAnimals[0]?.name ?? 'tu próximo amigo'}</p><p className="mt-1 text-sm text-white/70">{heroAnimals[0]?.breed || 'Una historia esperando familia'}</p></div></div>
            {heroAnimals[1] && <div className="absolute -bottom-7 left-0 hidden w-40 rotate-[-5deg] overflow-hidden rounded-2xl border-[6px] border-[#fffdf9] bg-[#fffdf9] text-[#171717] shadow-xl sm:block"><ResilientImage src={getAnimalImageUrl(heroAnimals[1])} alt={`${heroAnimals[1].name}, perrito en adopción`} className="aspect-square w-full object-cover" /><p className="px-3 py-2 font-heading text-lg font-extrabold">{heroAnimals[1].name}</p></div>}
            <div className="absolute -right-2 top-8 rounded-2xl bg-[#ffcf5a] px-4 py-3 text-[#171717] shadow-xl"><span className="block font-heading text-3xl font-extrabold">{isLoading ? '…' : adoptableAnimals.length}</span><span className="text-xs font-bold">historias esperando</span></div>
          </motion.div>
        </div>
      </section>

      <section className="bg-[#f0644a] py-6 text-white"><div className="mx-auto grid max-w-7xl gap-5 px-5 sm:px-8 md:grid-cols-3 lg:px-10">{[
        ['01', 'Descubre', 'Explora perfiles honestos y encuentra afinidad.'],
        ['02', 'Conversemos', 'Cuéntanos sobre tu hogar y tu estilo de vida.'],
        ['03', 'Crezcan juntos', 'Te acompañamos antes y después de la adopción.'],
      ].map(([number, title, text]) => <div key={number} className="flex items-start gap-4"><span className="font-heading text-3xl font-extrabold text-[#ffcf5a]">{number}</span><div><h2 className="font-heading text-lg font-extrabold">{title}</h2><p className="mt-1 text-xs leading-relaxed text-white/75">{text}</p></div></div>)}</div></section>

      <section aria-label="Buscar y filtrar perritos" className="sticky top-12 z-30 border-y border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-card)_92%,transparent)] py-4 shadow-lg backdrop-blur-xl sm:top-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-1">
              {[
                { id: 'all', label: `Todos (${adoptableAnimals.length})`, icon: PawPrint },
                { id: 'medical', label: 'Cuidados especiales', icon: Stethoscope },
                { id: 'favorites', label: `Favoritos (${favorites.length})`, icon: Heart },
              ].map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setGalleryMode(id as GalleryMode)} aria-pressed={galleryMode === id} className={`inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xs font-bold transition ${galleryMode === id ? 'bg-[#171717] text-white shadow-sm dark:bg-[#f8f4ee] dark:text-[#171717]' : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'}`}><Icon className={`h-3.5 w-3.5 ${id === 'favorites' && favorites.length ? 'fill-[#f0644a] text-[#f0644a]' : ''}`} />{label}</button>)}
            </div>
            {activeFilterCount > 0 && <button type="button" onClick={resetFilters} className="hidden items-center gap-1.5 text-xs font-bold text-[#f0644a] hover:underline sm:inline-flex"><RotateCcw className="h-3.5 w-3.5" /> Limpiar {activeFilterCount}</button>}
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-[1fr_11rem_11rem]">
            <div className="relative col-span-2 sm:col-span-1"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" /><Input aria-label="Buscar perros por nombre, raza o ubicación" placeholder="Busca por nombre, raza o ubicación…" value={search} onChange={(event) => setSearch(event.target.value)} className="h-11 rounded-xl pl-10 text-sm" />{search && <button type="button" onClick={() => setSearch('')} aria-label="Borrar búsqueda" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"><X className="h-3.5 w-3.5" /></button>}</div>
            <label className="relative"><span className="sr-only">Filtrar por tamaño</span><Ruler className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#f0644a]" /><select aria-label="Filtrar por tamaño" value={sizeFilter} onChange={(event) => setSizeFilter(event.target.value as typeof sizeFilter)} className="h-11 w-full appearance-none rounded-xl border border-[var(--color-input)] bg-[var(--color-card)] pl-9 pr-3 text-xs font-semibold"><option value="all">Cualquier tamaño</option><option value="small">Pequeños</option><option value="medium">Medianos</option><option value="large">Grandes</option></select></label>
            <label className="relative"><span className="sr-only">Filtrar por edad</span><Baby className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#f0644a]" /><select aria-label="Filtrar por edad" value={ageFilter} onChange={(event) => setAgeFilter(event.target.value as typeof ageFilter)} className="h-11 w-full appearance-none rounded-xl border border-[var(--color-input)] bg-[var(--color-card)] pl-9 pr-3 text-xs font-semibold"><option value="all">Cualquier edad</option><option value="puppy">Cachorros</option><option value="adult">Adultos</option><option value="senior">Senior</option></select></label>
          </div>
        </div>
      </section>

      <section id="matchmaker" className="bg-[#ede5da] py-14 text-[#171717] lg:py-18"><div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-[.7fr_1.3fr] lg:items-center lg:px-10"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#f0644a]">¿No sabes por dónde empezar?</p><h2 className="mt-3 max-w-md font-heading text-4xl font-extrabold tracking-[-.05em]">Tu estilo de vida también cuenta.</h2><p className="mt-4 max-w-md leading-relaxed text-[#6e6a64]">En menos de un minuto te ayudamos a descubrir qué perfiles pueden encajar mejor contigo. No decide por ti: te da un mejor punto de partida.</p></div><PetMatchmaker /></div></section>

      {/* Gallery Grid */}
      <section id="perritos" className="mx-auto max-w-7xl scroll-mt-48 px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#f0644a]">Perfiles con historia</p><h2 className="mt-3 font-heading text-4xl font-extrabold tracking-[-.05em] sm:text-5xl">Conoce a la manada.</h2></div><p className="max-w-sm text-sm leading-relaxed text-[var(--color-muted-foreground)]">Mostrando <strong className="text-[var(--color-foreground)]">{filtered.length}</strong> {filtered.length === 1 ? 'historia' : 'historias'} que podrían empezar contigo.</p></div>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[var(--color-border)] bg-[var(--color-card)] px-6 py-16 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0644a]/10 text-[#f0644a]"><Search className="h-6 w-6" /></div><h3 className="mt-5 font-heading text-2xl font-extrabold">Ese match todavía no aparece.</h3><p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--color-muted-foreground)]">Prueba ampliando los filtros. A veces la conexión llega en un tamaño o una edad que no habías imaginado.</p><Button variant="outline" className="mt-6" onClick={resetFilters}><RotateCcw className="h-4 w-4" /> Ver toda la manada</Button></div>
        ) : (
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((animal, i) => {
              const isFav = favorites.includes(animal.id);
              const ageMonths = getAgeMonths(animal);
              const imgUrl = getAnimalImageUrl(animal);
              return (
                <motion.article
                  key={animal.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: .15 }}
                  transition={{ delay: Math.min(i * .06, .24), duration: .4 }}
                  className="group"
                >
                  <div className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[0_18px_50px_-32px_rgba(23,23,23,.65)] transition duration-300 hover:-translate-y-1 hover:border-[#f0644a]/50 hover:shadow-[0_24px_60px_-28px_rgba(240,100,74,.35)]">
                    <div className="relative aspect-[4/4.5] overflow-hidden bg-[var(--color-muted)]">
                      <ResilientImage src={imgUrl} alt={`${animal.name}, perrito en adopción`} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
                      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#171717]/95 via-[#171717]/35 to-transparent" />
                      <div className="absolute left-4 top-4 z-10 flex max-w-[68%] flex-wrap gap-2">{animal.status === 'medical_care' || animal.is_special_needs ? <span className="rounded-full bg-[#ffcf5a] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.1em] text-[#171717]">Necesita cuidados</span> : <span className="rounded-full bg-[#fffdf9]/92 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.1em] text-[#171717] backdrop-blur">Listo para conocerte</span>}</div>
                      {animal.show_brand_moment && <span className="absolute right-4 top-4 z-10 rounded-full border border-white/30 bg-[#171717]/72 px-3 py-1.5 font-heading text-xs font-extrabold text-white backdrop-blur">Adopta<span className="text-[#f0644a]">ME</span></span>}
                      <div className="absolute inset-x-5 bottom-5 z-10 text-white"><p className="text-xs font-bold uppercase tracking-[.13em] text-[#ffcf5a]">{animal.breed || 'Perrito rescatado'}</p><div className="mt-1 flex items-end justify-between gap-3"><h3 className="font-heading text-4xl font-extrabold tracking-[-.04em]">{animal.name}</h3><span className="mb-1 text-xs text-white/75">{animal.gender === 'male' ? 'Macho' : 'Hembra'}</span></div></div>
                    </div>

                    <div className="flex flex-1 flex-col p-5 sm:p-6"><div className="grid grid-cols-3 gap-2 text-xs"><span className="flex items-center gap-1.5 rounded-xl bg-[var(--color-background)] px-2.5 py-2 font-semibold"><Baby className="h-3.5 w-3.5 text-[#f0644a]" />{formatAge(ageMonths, animal.age_is_estimated)}</span><span className="flex items-center gap-1.5 rounded-xl bg-[var(--color-background)] px-2.5 py-2 font-semibold"><Ruler className="h-3.5 w-3.5 text-[#f0644a]" />{sizeLabels[animal.size]}</span><span className="flex min-w-0 items-center gap-1.5 rounded-xl bg-[var(--color-background)] px-2.5 py-2 font-semibold"><MapPin className="h-3.5 w-3.5 shrink-0 text-[#f0644a]" /><span className="truncate">{animal.location || 'Refugio'}</span></span></div>
                      <p className="mt-5 line-clamp-3 text-sm leading-relaxed text-[var(--color-muted-foreground)]"><span className="font-extrabold text-[#f0644a]">ME llamo {animal.name}.</span>{' '}{animal.description || 'Estoy esperando una familia responsable que quiera conocerme de verdad.'}</p>
                      <div className="mt-5 flex flex-wrap gap-3 border-t border-[var(--color-border)] pt-4 text-[11px] font-semibold text-[var(--color-muted-foreground)]">{(animal.vaccination_status === 'up_to_date' || (!animal.vaccination_status && animal.is_vaccinated)) && <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Vacunas al día</span>}{animal.is_neutered && <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Esterilizado/a</span>}</div>
                      <div className="mt-auto grid grid-cols-[1fr_auto_auto] gap-2 pt-5"><Button variant="outline" onClick={() => navigate(`/adopta/${animal.adoption_slug || slugify(animal.name)}`)}>Conocer su historia</Button><Button variant="outline" size="icon" aria-label={`Compartir información de ${animal.name}`} onClick={() => handleShare(animal)}><Share2 className="h-4 w-4" /></Button><label aria-label={`${isFav ? 'Quitar a' : 'Guardar a'} ${animal.name} ${isFav ? 'de' : 'en'} favoritos`} className={`flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 transition ${isFav ? 'border-[#f0644a] bg-[#f0644a] text-white' : 'border-[var(--color-input)] bg-[var(--color-background)] hover:bg-[var(--color-accent)]'}`}><input type="checkbox" className="sr-only" checked={isFav} onChange={() => toggleFavorite(animal.id, animal.name)} /><Heart className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} /><span className="text-xs font-bold">{isFav ? 'Guardado' : 'Guardar'}</span></label><Button variant="warm" className="col-span-3" onClick={() => beginAdoption(animal)}><Heart className="h-4 w-4" /> Quiero conocer a {animal.name}</Button></div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </section>

      <section className="relative overflow-hidden bg-[#171717] py-16 text-white lg:py-20"><div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[58px] border-[#f0644a]/15" /><div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#ff9a62]">Un sí bien acompañado</p><h2 className="mt-3 max-w-2xl font-heading text-4xl font-extrabold tracking-[-.05em] sm:text-5xl">La adopción no termina cuando llega a casa.</h2><p className="mt-4 max-w-xl leading-relaxed text-white/65">Compartimos información honesta, preparamos el encuentro y seguimos cerca durante la adaptación.</p></div><div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col"><Button size="lg" className="bg-[#f0644a] text-white hover:bg-[#ff8069]" onClick={() => document.getElementById('perritos')?.scrollIntoView({ behavior: 'smooth' })}>Encontrar a mi compañero <ArrowRight /></Button><Button size="lg" variant="ghost" className="border border-white/20 text-white hover:bg-white/10" asChild><Link to="/como-funciona">Conocer el proceso</Link></Button></div></div></section>

      {/* Adoption Application & Detail Modals */}
      <AnimatePresence>
        {isDetailModalOpen && detailAnimal && (
          <PetDetailModal
            animal={detailAnimal}
            onClose={() => {
              if (slug) {
                dismissedSlugRef.current = slug;
                navigate('/adopta', { replace: true });
              }
              setIsDetailModalOpen(false);
              setDetailAnimal(null);
            }}
            onAdopt={() => {
              beginAdoption(detailAnimal);
            }}
          />
        )}
        {isModalOpen && selectedAnimal && (
          <AdoptionModal
            animal={selectedAnimal}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedAnimal(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AdoptionModal({ animal, onClose }: { animal: Animal; onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<AdoptionFormData>({
    resolver: zodResolver(adoptionSchema),
    defaultValues: {
      housing_type: 'house',
      has_yard: true,
      has_other_pets: false,
    },
  });
  const hasOtherPets = watch('has_other_pets');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, submitting]);

  async function onSubmit(data: AdoptionFormData) {
    setSubmitting(true);
    try {
      const { error } = await supabase.from('adoption_applications').insert([{ animal_id: animal.id, ...data }]);
      if (error) throw error;
      toast.success(`¡Solicitud enviada para ${animal.name}! Nos pondremos en contacto muy pronto. 🐾`);
      reset();
      onClose();
    } catch {
      toast.error('Error al registrar la solicitud');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="adoption-modal-title"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl mobile-bottom-sheet"
      >
        <div className="w-12 h-1.5 bg-[var(--color-muted)] rounded-full mx-auto mb-3 sm:hidden" />
        <button
          onClick={onClose}
          aria-label="Cerrar solicitud"
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 mobile-touch-target"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-4 bg-[#171717] p-6 pr-16 text-white sm:p-8">
          <ResilientImage src={getAnimalImageUrl(animal)} alt={animal.name || 'Perrito'} className="h-16 w-16 rounded-2xl border-2 border-white/15 object-cover" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#ff9a62]">Primer paso · sin compromiso</p><h2 id="adoption-modal-title" className="mt-1 font-heading text-2xl font-extrabold">Quiero conocer a {animal.name}</h2>
            <p className="mt-1 text-xs text-white/60">Queremos conocerte para cuidar el match, no para juzgarte.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6 sm:p-8">
          <div className="space-y-1.5">
            <Label htmlFor="applicant_name">Nombre Completo</Label>
            <Input id="applicant_name" placeholder="Tu nombre y apellidos" {...register('applicant_name')} />
            {errors.applicant_name && <p className="text-xs text-[var(--color-destructive)]">{errors.applicant_name.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="applicant_email">Correo Electrónico</Label>
              <Input id="applicant_email" type="email" placeholder="tu@email.com" {...register('applicant_email')} />
              {errors.applicant_email && <p className="text-xs text-[var(--color-destructive)]">{errors.applicant_email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="applicant_phone">Teléfono / WhatsApp</Label>
              <Input id="applicant_phone" placeholder="+123456789" {...register('applicant_phone')} />
              {errors.applicant_phone && <p className="text-xs text-[var(--color-destructive)]">{errors.applicant_phone.message}</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4"><label className="flex cursor-pointer items-start gap-3"><input type="checkbox" {...register('has_other_pets')} className="mt-0.5 h-4 w-4 rounded accent-[var(--color-primary)]" /><span><span className="block text-sm font-semibold">Convivo con otras mascotas</span><span className="mt-0.5 block text-xs text-[var(--color-muted-foreground)]">Nos ayuda a preparar una presentación segura.</span></span></label>{hasOtherPets && <div className="mt-3"><Label htmlFor="other_pets_desc">Cuéntanos cuáles</Label><Input id="other_pets_desc" className="mt-1.5" placeholder="Ej. Una gata adulta y un perro pequeño" {...register('other_pets_desc')} /></div>}</div>

          <div className="space-y-1.5">
            <Label htmlFor="applicant_address">Dirección de residencia</Label>
            <Input id="applicant_address" placeholder="Ciudad, Barrio, Calle..." {...register('applicant_address')} />
            {errors.applicant_address && <p className="text-xs text-[var(--color-destructive)]">{errors.applicant_address.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="housing_type">Tipo de Vivienda</Label>
              <select
                id="housing_type"
                {...register('housing_type')}
                className="flex h-9 w-full rounded-lg border border-[var(--color-input)] bg-transparent px-3 py-1 text-xs shadow-xs"
              >
                <option value="house">Casa</option>
                <option value="apartment">Departamento</option>
                <option value="farm">Finca / Casa de campo</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="has_yard" {...register('has_yard')} className="rounded accent-[var(--color-primary)]" />
              <Label htmlFor="has_yard" className="text-xs cursor-pointer">¿Tiene patio o jardín cercado?</Label>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reason">¿Por qué deseas adoptar a {animal.name}?</Label>
            <Textarea
              id="reason"
              rows={3}
              placeholder="Cuéntanos un poco sobre tu hogar, tu rutina y el cariño que tienes para dar..."
              {...register('reason')}
            />
            {errors.reason && <p className="text-xs text-[var(--color-destructive)]">{errors.reason.message}</p>}
          </div>

          <Button type="submit" variant="warm" size="lg" className="mt-4 w-full" disabled={submitting}>{submitting ? 'Enviando solicitud…' : <>Enviar mi solicitud <ArrowRight /></>}</Button><p className="flex items-center justify-center gap-1.5 text-center text-[10px] text-[var(--color-muted-foreground)]"><ShieldCheck className="h-3.5 w-3.5" /> Tus datos se usan únicamente para acompañar este proceso.</p>
        </form>
      </motion.div>
    </div>
  );
}

function PetDetailModal({ animal, onClose, onAdopt }: { animal: Animal; onClose: () => void; onAdopt: () => void }) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pet-detail-title"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl mobile-bottom-sheet"
      >
        <div className="w-12 h-1.5 bg-[var(--color-muted)] rounded-full mx-auto mb-3 sm:hidden" />
        <button
          onClick={onClose}
          aria-label="Cerrar detalle"
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-[#171717]/65 text-white backdrop-blur-md transition hover:bg-[#171717] mobile-touch-target"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid min-h-[38rem] lg:grid-cols-[.95fr_1.05fr]">
          <div className="relative min-h-80 overflow-hidden bg-[var(--color-muted)] lg:min-h-full"><ResilientImage src={getAnimalImageUrl(animal)} alt={`${animal.name}, perrito en adopción`} className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#171717]/85 to-transparent" /><div className="absolute bottom-6 left-6 right-6 text-white"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#ffcf5a]">Una historia que puede continuar contigo</p><p className="mt-2 font-heading text-5xl font-extrabold">{animal.name}</p></div>{(animal.status === 'medical_care' || animal.is_special_needs) && <span className="absolute left-5 top-5 rounded-full bg-[#ffcf5a] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.1em] text-[#171717]">Cuidados especiales</span>}</div>

          <div className="flex flex-col p-6 sm:p-8 lg:p-10"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-[#f0644a]">{animal.breed || 'Perrito rescatado'}</p><h2 id="pet-detail-title" className="mt-2 font-heading text-4xl font-extrabold tracking-[-.04em]">Conoce de verdad a {animal.name}.</h2><p className="mt-3 text-base leading-relaxed text-[var(--color-muted-foreground)]">{animal.personality_summary || animal.description}</p></div>
            <div className="mt-6 grid grid-cols-3 gap-2 text-xs"><div className="rounded-xl bg-[var(--color-background)] p-3"><Baby className="mb-2 h-4 w-4 text-[#f0644a]" /><span className="block font-bold">{formatAge(getAgeMonths(animal), animal.age_is_estimated)}</span><span className="text-[var(--color-muted-foreground)]">Edad</span></div><div className="rounded-xl bg-[var(--color-background)] p-3"><Ruler className="mb-2 h-4 w-4 text-[#f0644a]" /><span className="block font-bold">{sizeLabels[animal.size]}</span><span className="text-[var(--color-muted-foreground)]">Tamaño</span></div><div className="rounded-xl bg-[var(--color-background)] p-3"><House className="mb-2 h-4 w-4 text-[#f0644a]" /><span className="block font-bold">{animal.gender === 'male' ? 'Macho' : 'Hembra'}</span><span className="text-[var(--color-muted-foreground)]">Sexo</span></div></div>
            <div className="mt-6"><p className="font-heading text-lg font-extrabold">Su historia</p><p className="mt-2 whitespace-pre-line text-sm leading-7 text-[var(--color-muted-foreground)]">{animal.story || animal.description || 'Cada día conocemos un poco más de su personalidad. Nuestro equipo te contará todo lo necesario antes de avanzar.'}</p></div>
            {animal.show_brand_moment && <blockquote className="my-6 rounded-2xl bg-[#171717] p-5 text-white"><span className="font-heading text-lg font-extrabold">Adopta<span className="text-[#f0644a]">ME</span></span><p className="mt-2 text-sm leading-relaxed text-white/75">{animal.brand_message || 'AdoptaME: cada historia merece otra oportunidad.'}</p></blockquote>}
            <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-[var(--color-border)] p-4"><div className="flex items-center gap-2 font-bold"><Stethoscope className="h-4 w-4 text-[#f0644a]" /> Salud</div><p className="mt-2 text-xs leading-relaxed text-[var(--color-muted-foreground)]">{animal.health_status || 'Información pendiente de confirmar con el equipo veterinario.'}</p><div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{(animal.vaccination_status === 'up_to_date' || (!animal.vaccination_status && animal.is_vaccinated)) && <span>✓ Vacunas al día</span>}{animal.vaccination_status === 'unknown' && <span className="text-[var(--color-muted-foreground)]">Vacunación por confirmar</span>}{animal.is_neutered && <span>✓ Esterilizado/a</span>}</div></div><div className="rounded-2xl border border-[var(--color-border)] p-4"><div className="flex items-center gap-2 font-bold"><House className="h-4 w-4 text-[#f0644a]" /> Hogar ideal</div><p className="mt-2 text-xs leading-relaxed text-[var(--color-muted-foreground)]">{animal.ideal_home || 'El equipo está completando esta recomendación. Pregunta antes de iniciar el proceso.'}</p></div>{animal.compatibility_notes && <div className="rounded-2xl border border-[var(--color-border)] p-4"><div className="flex items-center gap-2 font-bold"><PawPrint className="h-4 w-4 text-[#f0644a]" /> Convivencia</div><p className="mt-2 text-xs leading-relaxed text-[var(--color-muted-foreground)]">{animal.compatibility_notes}</p></div>}<div className="rounded-2xl border border-[var(--color-border)] p-4"><div className="flex items-center gap-2 font-bold"><MapPin className="h-4 w-4 text-[#f0644a]" /> Dónde está</div><p className="mt-2 text-xs leading-relaxed text-[var(--color-muted-foreground)]">{animal.location || 'Refugio principal · visitas coordinadas'}</p></div></div>
            <div className="mt-auto flex flex-col gap-2 pt-8 sm:flex-row"><Button variant="outline" onClick={onClose} className="sm:w-auto">Seguir explorando</Button><Button variant="warm" className="flex-1" onClick={() => { onClose(); onAdopt(); }}><Heart className="h-4 w-4" /> Quiero conocer a {animal.name}</Button></div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
