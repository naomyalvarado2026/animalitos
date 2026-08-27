import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams } from 'react-router-dom';
import { Heart, Search, X, CheckCircle2, Share2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { assetUrl } from '@/lib/assets';
import { PawBackground } from '@/components/layout/PawBackground';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResilientImage } from '@/components/ui/ResilientImage';
import { Textarea } from '@/components/ui/textarea';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PetMatchmaker } from './PetMatchmaker';
import type { Animal, AnimalSpecies } from '@/types';


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

export function AdoptionGalleryPage() {
  const { slug } = useParams();
  const [speciesFilter, setSpeciesFilter] = useState<AnimalSpecies | 'all' | 'favorites'>('all');
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
      return saved ? JSON.parse(saved) : [];
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
    setFavorites(prev => {
      const exists = prev.includes(id);
      if (exists) {
        toast.info(`${name} fue removido de tus favoritos`);
        return prev.filter(item => item !== id);
      } else {
        toast.success(`❤️ ¡${name} fue guardado en tus favoritos!`);
        return [...prev, id];
      }
    });
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
      navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#/adopta/${slugify(animal.name)}`);
      toast.success('¡Enlace copiado al portapapeles!');
    }
  };

  const { data: animals = [], isLoading, isError } = useQuery({
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

  useEffect(() => {
    if (!slug || isLoading || detailAnimal) return;
    const match = animals.find((animal) => slugify(animal.name) === slug);
    if (match) {
      setDetailAnimal(match);
      setIsDetailModalOpen(true);
    }
  }, [slug, animals, isLoading, detailAnimal]);

  const filtered = animals.filter(animal => {
    if (animal.species !== 'dog') return false;
    if (!['available', 'medical_care'].includes(animal.status)) return false;
    if (speciesFilter === 'favorites') {
      if (!favorites.includes(animal.id)) return false;
    } else if (speciesFilter !== 'all' && animal.species !== speciesFilter) {
      return false;
    }
    if (sizeFilter !== 'all' && animal.size !== sizeFilter) return false;
    if (ageFilter === 'puppy' && animal.age_months > 12) return false;
    if (ageFilter === 'adult' && (animal.age_months <= 12 || animal.age_months > 84)) return false;
    if (ageFilter === 'senior' && animal.age_months <= 84) return false;
    const matchesSearch =
      animal.name.toLowerCase().includes(search.toLowerCase()) ||
      (animal.breed ?? '').toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative py-16 overflow-hidden">
        <PawBackground className="opacity-40" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="text-5xl block mb-4">🐶</span>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-3">Conoce a tu nuevo mejor amigo</h1>
            <p className="text-lg text-[var(--color-muted-foreground)] max-w-2xl mx-auto leading-relaxed">
              Cada perrito tiene una historia, una personalidad y muchas ganas de empezar de nuevo contigo.
            </p>
            {isError && <p role="alert" className="mt-4 text-sm text-rose-600 dark:text-rose-300">No pudimos cargar los perfiles en este momento. Intenta nuevamente en unos minutos.</p>}
          </motion.div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            ['01', 'Conoce sus historias', 'Busca por tamaño, edad y personalidad para encontrar un buen match.'],
            ['02', 'Conversemos', 'Completa una solicitud y cuéntanos cómo será su nueva vida contigo.'],
            ['03', 'Empieza la aventura', 'Te acompañamos en la adaptación y resolvemos tus dudas después de adoptar.'],
          ].map(([number, title, text]) => (
            <div key={number} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 flex gap-4">
              <span className="font-heading text-2xl font-extrabold text-[var(--color-primary)]">{number}</span>
              <div><h2 className="font-heading font-bold">{title}</h2><p className="text-xs text-[var(--color-muted-foreground)] mt-1 leading-relaxed">{text}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="py-6 bg-[var(--color-card)] border-y border-[var(--color-border)] sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-3">
          {/* Species tabs */}
          <div className="flex items-center gap-1.5 bg-[var(--color-background)] p-1 rounded-xl border border-[var(--color-border)] overflow-x-auto max-w-full">
            {[
              { id: 'all', label: 'Todos 🐾' },
              { id: 'dog', label: 'Perros 🐶' },
              { id: 'favorites', label: `Mis Favoritos (${favorites.length}) ❤️` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSpeciesFilter(tab.id as any)}
                aria-pressed={speciesFilter === tab.id}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  speciesFilter === tab.id
                    ? 'brand-gradient-bg text-white shadow-xs'
                    : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted-foreground)]" />
              <Input aria-label="Buscar perros por nombre o raza" placeholder="Buscar por nombre o raza..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-xs" />
            </div>
            <select aria-label="Filtrar por tamaño" value={sizeFilter} onChange={e => setSizeFilter(e.target.value as typeof sizeFilter)} className="h-9 rounded-lg border border-[var(--color-input)] bg-transparent px-3 text-xs">
              <option value="all">Todos los tamaños</option><option value="small">Pequeños</option><option value="medium">Medianos</option><option value="large">Grandes</option>
            </select>
            <select aria-label="Filtrar por edad" value={ageFilter} onChange={e => setAgeFilter(e.target.value as typeof ageFilter)} className="h-9 rounded-lg border border-[var(--color-input)] bg-transparent px-3 text-xs">
              <option value="all">Todas las edades</option><option value="puppy">Cachorros</option><option value="adult">Adultos</option><option value="senior">Senior</option>
            </select>
          </div>
        </div>
      </section>


      {/* Matchmaker Quiz Section */}
      <section className="py-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <PetMatchmaker />
      </section>

      {/* Gallery Grid */}
      <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[var(--color-muted-foreground)] text-lg mb-2">No encontramos resultados con ese filtro.</p>
            <Button variant="outline" size="sm" onClick={() => { setSpeciesFilter('all'); setSearch(''); setSizeFilter('all'); setAgeFilter('all'); }}>
              Restablecer filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((animal, i) => {
              const isFav = favorites.includes(animal.id);
              return (
                <motion.div
                  key={animal.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                >
                  <Card className="hover-card overflow-hidden h-full flex flex-col group border-[var(--color-border)] relative">
                    {/* Image container */}
                    <div className="relative h-64 overflow-hidden bg-muted">
                      <ResilientImage
                        src={assetUrl(animal.main_image_url)}
                        alt={animal.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <Badge variant="warm" className="capitalize text-xs font-semibold shadow-xs">
                          Perro 🐶
                        </Badge>
                        {animal.is_special_needs && (
                          <Badge variant="warning" className="text-xs">Cuidados Especiales 💛</Badge>
                        )}
                      </div>

                      {/* Floating actions: Favorite & Share */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(animal);
                          }}
                          aria-label={`Compartir información de ${animal.name}`}
                          className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center transition-all hover:scale-110"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(animal.id, animal.name);
                          }}
                          aria-label={`Guardar a ${animal.name} en favoritos`}
                          className={`w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 ${
                            isFav
                              ? 'bg-rose-500 text-white shadow-md'
                              : 'bg-black/40 hover:bg-black/60 text-white'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      <div className="absolute bottom-3 right-3">
                        <Badge variant="outline" className="bg-black/60 backdrop-blur-md text-white border-none text-xs">
                          {Math.floor(animal.age_months / 12)} años {animal.age_months % 12 > 0 ? `${animal.age_months % 12}m` : ''}
                        </Badge>
                      </div>
                    </div>

                  {/* Body */}
                  <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-heading text-2xl font-bold text-[var(--color-foreground)]">{animal.name}</h3>
                        <span className="text-xs text-[var(--color-muted-foreground)] capitalize">{animal.gender === 'male' ? 'Macho ♂' : 'Hembra ♀'}</span>
                      </div>
                      <p className="text-xs font-medium text-[var(--color-primary)] mb-3">{animal.breed ?? 'Mestizo'}</p>
                      <p className="text-sm text-[var(--color-muted-foreground)] line-clamp-3 leading-relaxed">
                        <span className="font-bold text-[var(--color-primary)]">ME llamo {animal.name}.</span>{' '}{animal.description}
                      </p>
                    </div>

                    {/* Features Badges */}
                    <div className="flex items-center gap-2 flex-wrap text-xs text-[var(--color-muted-foreground)] pt-2 border-t border-[var(--color-border)]">
                      {animal.is_vaccinated && (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Vacunado/a
                        </span>
                      )}
                      {animal.is_neutered && (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Esterilizado/a
                        </span>
                      )}
                    </div>

                    {/* CTA Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDetailAnimal(animal);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        📖 Ver Historia
                      </Button>
                      <Button
                        variant="warm"
                        size="sm"
                        onClick={() => {
                          setSelectedAnimal(animal);
                          setIsModalOpen(true);
                        }}
                      >
                        <Heart className="h-3.5 w-3.5 mr-1" />
                        Adoptar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          </div>
        )}
      </section>

      {/* Adoption Application & Detail Modals */}
      <AnimatePresence>
        {isDetailModalOpen && detailAnimal && (
          <PetDetailModal
            animal={detailAnimal}
            onClose={() => {
              setIsDetailModalOpen(false);
              setDetailAnimal(null);
            }}
            onAdopt={() => {
              setSelectedAnimal(detailAnimal);
              setIsModalOpen(true);
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

function slugify(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function AdoptionModal({ animal, onClose }: { animal: Animal; onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<AdoptionFormData>({
    resolver: zodResolver(adoptionSchema),
    defaultValues: {
      housing_type: 'house',
      has_yard: true,
      has_other_pets: false,
    },
  });

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 relative mobile-bottom-sheet"
      >
        <div className="w-12 h-1.5 bg-[var(--color-muted)] rounded-full mx-auto mb-3 sm:hidden" />
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] p-1 rounded-lg mobile-touch-target"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--color-border)]">
          <ResilientImage src={assetUrl(animal.main_image_url)} alt={animal.name} className="w-12 h-12 rounded-full object-cover border" />
          <div>
            <h2 className="font-heading text-xl font-bold">Adopta a {animal.name} 🐾</h2>
            <p className="text-xs text-[var(--color-muted-foreground)]">Completa el formulario para iniciar la solicitud.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

          <Button type="submit" variant="warm" className="w-full mt-4" disabled={submitting}>
            {submitting ? 'Enviando solicitud...' : '📩 Enviar Solicitud de Adopción'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

function PetDetailModal({ animal, onClose, onAdopt }: { animal: Animal; onClose: () => void; onAdopt: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 relative mobile-bottom-sheet"
      >
        <div className="w-12 h-1.5 bg-[var(--color-muted)] rounded-full mx-auto mb-3 sm:hidden" />
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] p-1 rounded-lg mobile-touch-target"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-4">
          <div className="relative h-64 rounded-xl overflow-hidden">
            <ResilientImage src={assetUrl(animal.main_image_url)} alt={animal.name} className="w-full h-full object-cover" />
            <div className="absolute top-3 left-3 flex gap-2">
              <Badge variant="warm">Perro 🐶</Badge>
              <Badge variant="outline" className="bg-black/60 text-white border-none text-xs">
                {animal.gender === 'male' ? 'Macho ♂' : 'Hembra ♀'}
              </Badge>
            </div>
          </div>

          <div>
            <h2 className="font-heading text-3xl font-bold">{animal.name}</h2>
            <p className="text-sm font-medium text-[var(--color-primary)]">{animal.breed ?? 'Mestizo'} · {Math.floor(animal.age_months / 12)} años</p>
          </div>

          <div className="space-y-2 text-sm text-[var(--color-muted-foreground)] leading-relaxed bg-[var(--color-background)] p-4 rounded-xl">
            <p className="font-medium text-[var(--color-foreground)]">Su Historia:</p>
            <p>{animal.story ?? animal.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-[var(--color-border)]">
              <span className="font-semibold block text-[var(--color-foreground)]">Estado de Salud</span>
              <span className="text-[var(--color-muted-foreground)]">{animal.health_status}</span>
            </div>
            <div className="p-3 rounded-lg border border-[var(--color-border)]">
              <span className="font-semibold block text-[var(--color-foreground)]">Ubicación</span>
              <span className="text-[var(--color-muted-foreground)]">{animal.location}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>Cerrar</Button>
            <Button variant="warm" onClick={() => { onClose(); onAdopt(); }}>
              <Heart className="h-4 w-4 mr-1.5" /> Quiero Adoptar a {animal.name}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
