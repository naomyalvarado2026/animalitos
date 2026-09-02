import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Activity, Plus, Edit2, Trash2, Heart, Search, Upload, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ResilientImage } from '@/components/ui/ResilientImage';
import { assetUrl } from '@/lib/assets';
import { toast } from 'sonner';
import type { Animal } from '@/types';
import { AnimalOperationsPanel } from './AnimalOperationsPanel';
import { REFUGE_DOG_PROFILES } from '@/data/refugeDogProfiles';

const animalSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  species: z.literal('dog'),
  breed: z.string().optional(),
  age_months: z.preprocess((value) => value === '' ? null : value, z.union([z.null(), z.coerce.number().int().min(0)])),
  age_is_estimated: z.boolean().default(false),
  gender: z.enum(['male', 'female']),
  size: z.enum(['unknown', 'small', 'medium', 'large', 'extra_large']),
  status: z.enum(['available', 'pending', 'adopted', 'medical_care']),
  description: z.string().min(5, 'Descripción requerida'),
  story: z.string().min(20, 'La historia debe tener al menos 20 caracteres'),
  health_status: z.string().min(3, 'Estado de salud requerido'),
  personality_summary: z.string().min(3, 'Personalidad requerida'),
  ideal_home: z.string().optional(),
  compatibility_notes: z.string().optional(),
  main_image_url: z.string().min(1, 'URL de imagen requerida'),
  vaccination_status: z.enum(['unknown', 'up_to_date', 'pending']),
  is_neutered: z.boolean().default(true),
  is_special_needs: z.boolean().default(false),
  special_needs_desc: z.string().optional(),
  is_published: z.boolean().default(true),
  show_brand_moment: z.boolean().default(false),
  brand_message: z.string().optional(),
  sort_order: z.coerce.number().int().min(0).default(0),
});

type AnimalForm = z.infer<typeof animalSchema>;

function resolveAnimalImage(animal: Animal): string {
  if (animal.main_image_url) return assetUrl(animal.main_image_url);
  if (animal.gallery_urls && animal.gallery_urls.length > 0) return assetUrl(animal.gallery_urls[0]);
  const raw = animal as unknown as Record<string, unknown>;
  if (Array.isArray(raw.image_urls) && raw.image_urls.length > 0 && typeof raw.image_urls[0] === 'string') {
    return assetUrl(raw.image_urls[0]);
  }
  return assetUrl('/images/dog_max.jpg');
}

export function AnimalManagement() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);
  const [search, setSearch] = useState('');
  const [operationsAnimal, setOperationsAnimal] = useState<Animal | null>(null);

  const { data: animals = [], isLoading } = useQuery({
    queryKey: ['admin-animals'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('animals').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return ((data ?? []) as Animal[]).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      } catch (error) {
        throw error instanceof Error ? error : new Error('No se pudieron cargar los rescatados.');
      }
    },
  });

  const form = useForm<AnimalForm>({
    resolver: zodResolver(animalSchema) as any,
    defaultValues: {
      species: 'dog',
      gender: 'male',
      size: 'unknown',
      status: 'available',
      age_months: null,
      age_is_estimated: false,
      vaccination_status: 'unknown',
      is_neutered: true,
      is_special_needs: false,
      story: '',
      health_status: '',
      personality_summary: '',
      ideal_home: '',
      compatibility_notes: '',
      special_needs_desc: '',
      is_published: true,
      show_brand_moment: false,
      brand_message: '',
      sort_order: 0,
      main_image_url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=800',
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: AnimalForm) => {
      const payload = {
        ...data,
        adoption_slug: editingAnimal?.adoption_slug || data.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        ideal_home: data.ideal_home?.trim() || null,
        compatibility_notes: data.compatibility_notes?.trim() || null,
        special_needs_desc: data.special_needs_desc?.trim() || null,
        brand_message: data.show_brand_moment ? data.brand_message?.trim() || 'AdoptaME: cada historia merece otra oportunidad.' : null,
        is_vaccinated: data.vaccination_status === 'unknown' ? null : data.vaccination_status === 'up_to_date',
        image_urls: [data.main_image_url],
        gallery_urls: [data.main_image_url],
        updated_at: new Date().toISOString(),
      };
      if (editingAnimal) {
        const { error } = await supabase.from('animals').update(payload).eq('id', editingAnimal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('animals').insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-animals'] });
      qc.invalidateQueries({ queryKey: ['animals-public'] });
      qc.invalidateQueries({ queryKey: ['public-home-dogs'] });
      qc.invalidateQueries({ queryKey: ['public-matchmaker-dogs'] });
      toast.success(editingAnimal ? 'Animal actualizado.' : 'Animal registrado con éxito.');
      setShowForm(false);
      setEditingAnimal(null);
      form.reset();
    },
    onError: () => toast.error('No se pudo guardar el registro en Supabase.'),
  });

  const importStoriesMutation = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      const rows = REFUGE_DOG_PROFILES.map((profile) => ({ ...profile, image_urls: [profile.main_image_url], updated_at: now }));
      const { error } = await supabase.from('animals').upsert(rows, { onConflict: 'adoption_slug' });
      if (error) throw error;
    },
    onSuccess: () => {
      ['admin-animals', 'animals-public', 'public-home-dogs', 'public-matchmaker-dogs'].forEach((queryKey) => qc.invalidateQueries({ queryKey: [queryKey] }));
      toast.success('Las 12 historias del refugio quedaron sincronizadas.');
    },
    onError: (error: Error) => toast.error(error.message.includes('column') ? 'Aplica primero la migración 0015 de perfiles narrativos.' : 'No pudimos importar las historias.'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('animals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-animals'] });
      qc.invalidateQueries({ queryKey: ['animals-public'] });
      qc.invalidateQueries({ queryKey: ['public-home-dogs'] });
      qc.invalidateQueries({ queryKey: ['public-matchmaker-dogs'] });
      toast.success('Animal eliminado.');
    },
    onError: () => toast.error('No se pudo eliminar el animal en Supabase.'),
  });

  function startEdit(animal: Animal) {
    setEditingAnimal(animal);
    const raw = animal as unknown as Record<string, unknown>;
    const img = animal.main_image_url || (Array.isArray(raw.image_urls) ? raw.image_urls[0] : '') || 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=800';
    form.reset({
      name: animal.name ?? '',
      species: 'dog',
      breed: animal.breed ?? '',
      age_months: animal.age_months,
      age_is_estimated: animal.age_is_estimated ?? false,
      gender: animal.gender ?? 'male',
      size: animal.size ?? 'unknown',
      status: animal.status ?? 'available',
      description: animal.description ?? '',
      story: animal.story ?? '',
      health_status: animal.health_status ?? '',
      personality_summary: animal.personality_summary ?? '',
      ideal_home: animal.ideal_home ?? '',
      compatibility_notes: animal.compatibility_notes ?? '',
      main_image_url: String(img),
      vaccination_status: animal.vaccination_status ?? (animal.is_vaccinated === true ? 'up_to_date' : animal.is_vaccinated === false ? 'pending' : 'unknown'),
      is_neutered: animal.is_neutered ?? true,
      is_special_needs: animal.is_special_needs ?? false,
      special_needs_desc: animal.special_needs_desc ?? '',
      is_published: animal.is_published ?? true,
      show_brand_moment: animal.show_brand_moment ?? false,
      brand_message: animal.brand_message ?? '',
      sort_order: animal.sort_order ?? 0,
    });
    setShowForm(true);
  }

  const filteredAnimals = animals.filter(a =>
    (a.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (a.breed ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Heart className="h-6 w-6 text-[var(--color-primary)]" />
            Gestión de Rescatados
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">Registra, actualiza y administra la información de los perros en adopción.</p>
        </div>
        {!showForm && <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => importStoriesMutation.mutate()} disabled={importStoriesMutation.isPending} title="Crea los perfiles que faltan y actualiza los que tengan el mismo identificador"><Upload className="mr-2 h-4 w-4" />{importStoriesMutation.isPending ? 'Sincronizando…' : 'Sincronizar 12 historias'}</Button><Button variant="warm" onClick={() => { setEditingAnimal(null); form.reset(); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" />Nuevo Rescatado</Button></div>}
      </div>

      {showForm && (
        <Card className="border-[var(--color-primary)] shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">{editingAnimal ? `Editar a ${editingAnimal.name}` : 'Registrar Nuevo Perro'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" {...form.register('name')} placeholder="Ej. Toby" />
                {form.formState.errors.name && <p className="text-xs text-[var(--color-destructive)]">{form.formState.errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="breed">Raza / Tipo</Label>
                <Input id="breed" {...form.register('breed')} placeholder="Ej. Mestizo, Golden Mix..." />
              </div>

              <div className="space-y-1.5"><Label htmlFor="age_months">Edad en meses (opcional)</Label><Input id="age_months" type="number" min="0" {...form.register('age_months')} placeholder="Vacío si no está confirmada" /><label className="flex items-center gap-2 text-xs"><input type="checkbox" {...form.register('age_is_estimated')} /> Edad aproximada</label></div>

              <div className="space-y-1.5">
                <Label htmlFor="gender">Género</Label>
                <select id="gender" {...form.register('gender')} className="flex h-9 w-full rounded-lg border border-[var(--color-input)] bg-transparent px-3 text-xs">
                  <option value="male">Macho</option>
                  <option value="female">Hembra</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="size">Tamaño</Label>
                <select id="size" {...form.register('size')} className="flex h-9 w-full rounded-lg border border-[var(--color-input)] bg-transparent px-3 text-xs">
                  <option value="unknown">Por confirmar</option>
                  <option value="small">Pequeño</option>
                  <option value="medium">Mediano</option>
                  <option value="large">Grande</option>
                  <option value="extra_large">Muy Grande</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status">Estado</Label>
                <select id="status" {...form.register('status')} className="flex h-9 w-full rounded-lg border border-[var(--color-input)] bg-transparent px-3 text-xs">
                  <option value="available">Disponible para Adopción</option>
                  <option value="pending">Proceso de Adopción</option>
                  <option value="adopted">Adoptado</option>
                  <option value="medical_care">Tratamiento Médico</option>
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="main_image_url">URL de Imagen</Label>
                <Input id="main_image_url" {...form.register('main_image_url')} placeholder="https://... o /images/dog_max.jpg" />
                {form.formState.errors.main_image_url && <p className="text-xs text-[var(--color-destructive)]">{form.formState.errors.main_image_url.message}</p>}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="description">Presentación corta</Label>
                <Textarea id="description" rows={2} {...form.register('description')} placeholder="Quién es hoy, en una frase cercana…" />
                {form.formState.errors.description && <p className="text-xs text-[var(--color-destructive)]">{form.formState.errors.description.message}</p>}
              </div>

              <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="story">Historia completa</Label><Textarea id="story" rows={7} {...form.register('story')} placeholder="Cuenta su rescate, recuperación y quién es hoy…" />{form.formState.errors.story && <p className="text-xs text-[var(--color-destructive)]">{form.formState.errors.story.message}</p>}</div>
              <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="personality_summary">Personalidad</Label><Textarea id="personality_summary" rows={2} {...form.register('personality_summary')} placeholder="Cariñoso, activo, cauteloso…" /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="health_status">Salud (solo información confirmada)</Label><Textarea id="health_status" rows={2} {...form.register('health_status')} placeholder="Esterilización, recuperación o tratamiento actual…" /></div>
              <div className="space-y-1.5"><Label htmlFor="ideal_home">Hogar ideal</Label><Textarea id="ideal_home" rows={4} {...form.register('ideal_home')} placeholder="Déjalo vacío si falta confirmar" /></div>
              <div className="space-y-1.5"><Label htmlFor="compatibility_notes">Convivencia y compatibilidad</Label><Textarea id="compatibility_notes" rows={4} {...form.register('compatibility_notes')} placeholder="Niños, otros animales, espacio o rutina" /></div>
              <div className="space-y-1.5"><Label htmlFor="vaccination_status">Vacunación</Label><select id="vaccination_status" {...form.register('vaccination_status')} className="flex h-9 w-full rounded-lg border border-[var(--color-input)] bg-transparent px-3 text-xs"><option value="unknown">Por confirmar</option><option value="up_to_date">Al día</option><option value="pending">Pendiente</option></select></div>
              <div className="space-y-1.5"><Label htmlFor="sort_order">Orden en la galería</Label><Input id="sort_order" type="number" min="0" {...form.register('sort_order')} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="special_needs_desc">Cuidados especiales</Label><Textarea id="special_needs_desc" rows={2} {...form.register('special_needs_desc')} placeholder="Tratamiento, movilidad o acompañamiento específico" /></div>

              <div className="sm:col-span-2 flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input type="checkbox" {...form.register('is_neutered')} className="rounded accent-[var(--color-primary)]" />
                  Esterilizado/a
                </label>
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input type="checkbox" {...form.register('is_special_needs')} className="rounded accent-[var(--color-primary)]" />
                  Cuidados Especiales
                </label>
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer"><input type="checkbox" {...form.register('is_published')} className="rounded accent-[var(--color-primary)]" /> Visible en la web</label>
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer"><input type="checkbox" {...form.register('show_brand_moment')} className="rounded accent-[var(--color-primary)]" /> Incluir momento AdoptaME</label>
              </div>

              {form.watch('show_brand_moment') && <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="brand_message">Mensaje AdoptaME</Label><Input id="brand_message" {...form.register('brand_message')} placeholder="AdoptaME: cada historia merece otra oportunidad." /></div>}

              <div className="sm:col-span-2 flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setEditingAnimal(null); }}>Cancelar</Button>
                <Button type="submit" variant="warm" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {operationsAnimal && <AnimalOperationsPanel animal={operationsAnimal} onClose={() => setOperationsAnimal(null)} />}

      {/* List */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <CardTitle className="text-base">{animals.length} Registrado(s)</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-muted-foreground)]" />
            <Input placeholder="Buscar por nombre o raza..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-[var(--color-muted-foreground)]">Cargando...</div>
          ) : filteredAnimals.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-muted-foreground)]">
              {search ? 'No hay resultados que coincidan con la búsqueda.' : 'No hay animales registrados.'}
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {filteredAnimals.map((animal) => {
                const img = resolveAnimalImage(animal);
                return (
                  <div key={animal.id} className="flex items-center justify-between py-3 gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <ResilientImage src={img} alt={animal.name || 'Perrito'} className="w-12 h-12 rounded-xl object-cover border shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading font-bold text-base">{animal.name}</h3>
                          <Badge variant={animal.status === 'available' ? 'success' : animal.status === 'adopted' ? 'warm' : 'secondary'} className="text-xs">
                            {animal.status === 'available' ? 'Disponible' : animal.status === 'adopted' ? 'Adoptado' : animal.status === 'medical_care' ? 'En Tratamiento' : 'En Proceso'}
                          </Badge>
                          <span title={animal.is_published === false ? 'Borrador' : 'Visible en la web'}>{animal.is_published === false ? <EyeOff className="h-4 w-4 text-amber-500" /> : <Eye className="h-4 w-4 text-emerald-500" />}</span>
                        </div>
                        <p className="text-xs text-[var(--color-muted-foreground)]">{animal.breed ?? 'Raza por confirmar'} · {animal.gender === 'male' ? 'Macho ♂' : 'Hembra ♀'} · {animal.age_months == null ? 'Edad por confirmar' : `${animal.age_is_estimated ? 'Aprox. ' : ''}${Math.floor(animal.age_months / 12)} años`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="icon" variant="ghost" onClick={() => setOperationsAnimal(animal)} aria-label={`Abrir ficha de ${animal.name}`}>
                        <Activity className="h-4 w-4 text-[var(--color-primary)]" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => startEdit(animal)} aria-label="Editar">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-[var(--color-destructive)]" onClick={() => { if (confirm(`¿Eliminar a ${animal.name}?`)) deleteMutation.mutate(animal.id); }} aria-label="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
