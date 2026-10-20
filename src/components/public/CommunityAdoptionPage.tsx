import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Heart, MapPin, PawPrint, Search, Share2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ResilientImage } from '@/components/ui/ResilientImage';

type Species = 'dog' | 'cat';
type Gender = 'female' | 'male' | 'unknown';

interface PublicListing {
  id: string;
  name: string;
  slug: string;
  species: Species;
  breed: string | null;
  age_label: string;
  gender: Gender;
  size: string;
  city: string;
  province: string;
  description: string;
  main_image_url: string;
  gallery_urls: string[];
  vaccination_status: string;
  sterilized: boolean | null;
  is_special_needs: boolean;
  special_notes: string | null;
  expires_at: string;
  created_at: string;
}

type SpeciesFilter = 'all' | Species;


export function CommunityAdoptionPage() {
  const { slug } = useParams();
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<SpeciesFilter>('all');

  const { data: listings = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['community-listings'],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('community_adoption_listings')
        .select('id,name,slug,species,breed,age_label,gender,size,city,province,description,main_image_url,gallery_urls,vaccination_status,sterilized,is_special_needs,special_notes,expires_at,created_at')
        .eq('status', 'published')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (rows ?? []) as PublicListing[];
    },
    staleTime: 60_000,
  });

  const selected = slug ? listings.find((item) => item.slug === slug) : undefined;
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return listings.filter((item) => {
      if (speciesFilter !== 'all' && item.species !== speciesFilter) return false;
      return !needle || [item.name, item.breed, item.city, item.province, item.description].some((value) => (value ?? '').toLowerCase().includes(needle));
    });
  }, [listings, search, speciesFilter]);

  async function shareListing(item: PublicListing) {
    const url = window.location.origin + window.location.pathname + '#/comunidad/' + item.slug;
    try {
      if (navigator.share) await navigator.share({ title: item.name + ' busca hogar | AdoptaME', text: 'Ayúdanos a encontrar un hogar para ' + item.name + '.', url });
      else { await navigator.clipboard.writeText(url); toast.success('Enlace copiado para compartir.'); }
    } catch {
      // La persona canceló el menú para compartir.
    }
  }

  return (
    <main className="overflow-hidden pt-16">
      <Helmet>
        <title>{selected ? selected.name + ' busca hogar | AdoptaME' : 'Adopciones de la comunidad | AdoptaME'}</title>
        <meta name="description" content="Perros y gatos que buscan hogar en la comunidad. Envía tu interés para que el equipo coordine el contacto." />
      </Helmet>

      <section className="bg-[#171717] py-14 text-[#fffdf9] sm:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          {slug && <Link to="/comunidad" className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white"><ArrowLeft className="h-4 w-4" />Todas las adopciones de la comunidad</Link>}
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#ff9a62]/30 px-3 py-1.5 text-xs font-bold uppercase tracking-[.16em] text-[#ff9a62]"><PawPrint className="h-4 w-4" /> Adopciones compartidas</div>
          <h1 className="mt-5 max-w-3xl font-heading text-4xl font-extrabold leading-tight tracking-[-.04em] sm:text-6xl">{selected ? selected.name + ' busca una familia' : 'Más animalitos, más oportunidades'}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">Anuncios compartidos por personas de la comunidad y revisados antes de publicarse. Cada difusión puede acercar a un perro o gato a un hogar.</p>
          <p className="mt-4 max-w-2xl text-xs text-white/55">Confirma la información y coordina un encuentro seguro con la persona responsable antes de adoptar.</p>
        </div>
      </section>

      {slug ? (selected ? (
        <section className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1.1fr_.9fr]">
          <div className="space-y-3">
            <ResilientImage src={selected.main_image_url} alt={selected.name + ', en adopción comunitaria'} className="aspect-[4/3] w-full rounded-[2rem] object-cover" />
            {selected.gallery_urls?.length > 1 && <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">{selected.gallery_urls.slice(1).map((url, index) => <ResilientImage key={url + index} src={url} alt={'Foto ' + (index + 2) + ' de ' + selected.name} className="aspect-square w-full rounded-2xl object-cover" />)}</div>}
          </div>
          <Card className="h-fit">
            <CardContent className="space-y-5 p-6 sm:p-8">
              <div className="flex flex-wrap gap-2"><span className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">{selected.species === 'cat' ? 'Gato' : 'Perro'}</span><span className="rounded-full bg-[var(--color-muted)] px-3 py-1 text-xs font-semibold">Anuncio de la comunidad</span></div>
              <div><h2 className="font-heading text-3xl font-extrabold">{selected.name}</h2><p className="mt-2 flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)]"><MapPin className="h-4 w-4" />{selected.city}, {selected.province}</p></div>
              <p className="text-sm leading-relaxed">{selected.description}</p>
              <div className="grid grid-cols-2 gap-3 rounded-2xl bg-[var(--color-background)] p-4 text-sm">
                <div><p className="text-xs text-[var(--color-muted-foreground)]">Edad</p><p className="mt-1 font-semibold">{selected.age_label}</p></div>
                <div><p className="text-xs text-[var(--color-muted-foreground)]">Sexo</p><p className="mt-1 font-semibold">{selected.gender === 'female' ? 'Hembra' : selected.gender === 'male' ? 'Macho' : 'Por confirmar'}</p></div>
                <div><p className="text-xs text-[var(--color-muted-foreground)]">Raza</p><p className="mt-1 font-semibold">{selected.breed || 'Por confirmar'}</p></div>
                <div><p className="text-xs text-[var(--color-muted-foreground)]">Vacunas</p><p className="mt-1 font-semibold">{selected.vaccination_status === 'up_to_date' ? 'Al día' : selected.vaccination_status === 'pending' ? 'Pendientes' : 'Por confirmar'}</p></div>
                <div><p className="text-xs text-[var(--color-muted-foreground)]">Esterilización</p><p className="mt-1 font-semibold">{selected.sterilized == null ? 'Por confirmar' : selected.sterilized ? 'Sí' : 'No'}</p></div>
                {selected.is_special_needs && <div className="col-span-2"><p className="text-xs text-[var(--color-muted-foreground)]">Cuidados</p><p className="mt-1 font-semibold">{selected.special_notes || 'Consulta con la persona responsable.'}</p></div>}
              </div>
              <Button asChild variant="warm" size="lg" className="w-full"><Link to={'/comunidad/' + selected.slug + '/solicitud'}>Quiero adoptar</Link></Button>
              <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => void shareListing(selected)}><Share2 className="mr-2 h-4 w-4" />Compartir</Button><Button asChild variant="ghost" className="flex-1"><Link to="/adopta"><Heart className="mr-2 h-4 w-4" />Ver refugio</Link></Button></div>
              <p className="text-xs leading-relaxed text-[var(--color-muted-foreground)]">Este anuncio fue compartido por la comunidad. AdoptaME recibirá tu interés y ayudará a coordinar el proceso con la persona responsable.</p>
            </CardContent>
          </Card>
        </section>
      ) : <section className="mx-auto max-w-4xl px-5 py-16 text-center"><h2 className="font-heading text-2xl font-bold">Este anuncio ya no está disponible</h2><p className="mt-2 text-sm text-[var(--color-muted-foreground)]">Pudo haber encontrado hogar o haber vencido.</p><Button asChild variant="warm" className="mt-5"><Link to="/comunidad">Ver otros animalitos</Link></Button></section>) : (
        <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
          <div className="mb-8 grid gap-3 rounded-3xl bg-[var(--color-card)] p-4 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, ciudad o descripción" className="pl-9" /></div>
            <div className="flex gap-2">{(['all', 'dog', 'cat'] as SpeciesFilter[]).map((value) => <Button key={value} size="sm" variant={speciesFilter === value ? 'warm' : 'outline'} onClick={() => setSpeciesFilter(value)}>{value === 'all' ? 'Todos' : value === 'dog' ? 'Perros' : 'Gatos'}</Button>)}</div>
          </div>

          {isLoading ? <p className="py-14 text-center text-sm text-[var(--color-muted-foreground)]">Buscando animalitos…</p>
            : isError ? <Card><CardContent className="p-8 text-center"><h2 className="font-heading text-xl font-bold">No pudimos cargar los anuncios</h2><p className="mt-2 text-sm text-[var(--color-muted-foreground)]">Intenta nuevamente en un momento.</p><Button className="mt-4" variant="warm" onClick={() => void refetch()}>Reintentar</Button></CardContent></Card>
              : filtered.length === 0 ? <div className="rounded-3xl border border-dashed border-[var(--color-border)] px-6 py-16 text-center"><PawPrint className="mx-auto h-10 w-10 text-[var(--color-primary)]" /><h2 className="mt-3 font-heading text-xl font-bold">{search ? 'No encontramos coincidencias' : 'Aún no hay anuncios activos'}</h2><p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{search ? 'Prueba otra palabra o ciudad.' : 'Vuelve pronto; publicaremos aquí nuevos animalitos que buscan hogar.'}</p><Button asChild variant="warm" className="mt-5"><Link to="/adopta">Ver animales del refugio</Link></Button></div>
                : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((item) => <Card key={item.id} className="overflow-hidden transition-transform hover:-translate-y-1"><Link to={'/comunidad/' + item.slug} className="block"><ResilientImage src={item.main_image_url} alt={item.name + ', ' + (item.species === 'cat' ? 'gato' : 'perro') + ' en adopción'} className="aspect-[4/3] w-full object-cover" /></Link><CardContent className="space-y-3 p-5"><div className="flex items-center justify-between gap-2"><span className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">{item.species === 'cat' ? 'Gato' : 'Perro'}</span><span className="text-xs text-[var(--color-muted-foreground)]">{item.age_label}</span></div><div><Link to={'/comunidad/' + item.slug} className="font-heading text-xl font-extrabold hover:text-[var(--color-primary)]">{item.name}</Link><p className="mt-1 flex items-center gap-1 text-xs text-[var(--color-muted-foreground)]"><MapPin className="h-3.5 w-3.5" />{item.city}, {item.province}</p></div><p className="line-clamp-3 min-h-[3.75rem] text-sm leading-relaxed text-[var(--color-muted-foreground)]">{item.description}</p><div className="flex items-center gap-2"><Button asChild variant="warm" className="flex-1"><Link to={'/comunidad/' + item.slug}>Conocer</Link></Button><Button variant="outline" size="icon" onClick={() => void shareListing(item)} aria-label={'Compartir anuncio de ' + item.name}><Share2 className="h-4 w-4" /></Button></div></CardContent></Card>)}</div>}
        </section>
      )}
    </main>
  );
}
