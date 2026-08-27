import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { dataStore } from '@/lib/dataStore';
import { Plus, Edit2, Trash2, Heart, Check, X, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { Animal, AnimalSpecies, AnimalStatus, AnimalGender, AnimalSize } from '@/types';

const animalSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  species: z.literal('dog'),
  breed: z.string().optional(),
  age_months: z.coerce.number().min(0),
  gender: z.enum(['male', 'female']),
  size: z.enum(['small', 'medium', 'large', 'extra_large']),
  status: z.enum(['available', 'pending', 'adopted', 'medical_care']),
  description: z.string().min(5, 'Descripción requerida'),
  main_image_url: z.string().min(1, 'URL de imagen requerida'),
  is_vaccinated: z.boolean().default(true),
  is_neutered: z.boolean().default(true),
  is_special_needs: z.boolean().default(false),
});

type AnimalForm = z.infer<typeof animalSchema>;

export function AnimalManagement() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);

  const { data: animals = [], isLoading } = useQuery({
    queryKey: ['admin-animals'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('animals').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data as Animal[];
      } catch {}
      return dataStore.getAnimals();
    },
  });

  const form = useForm<AnimalForm>({
    resolver: zodResolver(animalSchema) as any,
    defaultValues: {
      species: 'dog',
      gender: 'male',
      size: 'medium',
      status: 'available',
      age_months: 12,
      is_vaccinated: true,
      is_neutered: true,
      is_special_needs: false,
      main_image_url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=800',
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: AnimalForm) => {
      const payload = editingAnimal ? { ...data, id: editingAnimal.id } : data;
      dataStore.saveAnimal(payload);
      try {
        if (editingAnimal) {
          await supabase.from('animals').update(data).eq('id', editingAnimal.id);
        } else {
          await supabase.from('animals').insert([data]);
        }
      } catch {}
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-animals'] });
      qc.invalidateQueries({ queryKey: ['animals-public'] });
      toast.success(editingAnimal ? 'Animal actualizado.' : 'Animal registrado con éxito.');
      setShowForm(false);
      setEditingAnimal(null);
      form.reset();
    },
    onError: () => toast.error('Error al guardar el registro.'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      dataStore.deleteAnimal(id);
      try {
        await supabase.from('animals').delete().eq('id', id);
      } catch {}
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-animals'] });
      qc.invalidateQueries({ queryKey: ['animals-public'] });
      toast.success('Animal eliminado.');
    },
  });

  function startEdit(animal: Animal) {
    setEditingAnimal(animal);
    form.reset({
      name: animal.name,
      species: 'dog',
      breed: animal.breed ?? '',
      age_months: animal.age_months,
      gender: animal.gender,
      size: animal.size,
      status: animal.status,
      description: animal.description,
      main_image_url: animal.main_image_url,
      is_vaccinated: animal.is_vaccinated,
      is_neutered: animal.is_neutered,
      is_special_needs: animal.is_special_needs,
    });
    setShowForm(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Heart className="h-6 w-6 text-[var(--color-primary)]" />
            Gestión de Rescatados
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            Administra los animales registrados para adopción.
          </p>
        </div>
        <Button variant="warm" onClick={() => { setEditingAnimal(null); form.reset(); setShowForm(!showForm); }}>
          <Plus className="h-4 w-4 mr-2" />
          Registrar Peludito
        </Button>
      </div>

      {showForm && (
        <Card className="border-[var(--color-primary)]">
          <CardHeader>
            <CardTitle className="text-base">
              {editingAnimal ? `Editar a ${editingAnimal.name}` : 'Nuevo Rescatado'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(d => saveMutation.mutate(d))} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" {...form.register('name')} placeholder="Ej: Max" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="species">Especie</Label>
                <select id="species" {...form.register('species')} className="flex h-9 w-full rounded-lg border border-[var(--color-input)] bg-transparent px-3 py-1 text-sm">
                  <option value="dog">Perro 🐶</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="breed">Raza / Mestizo</Label>
                <Input id="breed" {...form.register('breed')} placeholder="Ej: Mestizo de Labrador" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="age_months">Edad (Meses)</Label>
                <Input id="age_months" type="number" {...form.register('age_months')} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gender">Género</Label>
                <select id="gender" {...form.register('gender')} className="flex h-9 w-full rounded-lg border border-[var(--color-input)] bg-transparent px-3 py-1 text-sm">
                  <option value="male">Macho ♂</option>
                  <option value="female">Hembra ♀</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status">Estado</Label>
                <select id="status" {...form.register('status')} className="flex h-9 w-full rounded-lg border border-[var(--color-input)] bg-transparent px-3 py-1 text-sm">
                  <option value="available">Disponible para Adopción</option>
                  <option value="pending">Proceso de Adopción</option>
                  <option value="adopted">Adoptado</option>
                  <option value="medical_care">Tratamiento Médico</option>
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="main_image_url">URL de Imagen</Label>
                <Input id="main_image_url" {...form.register('main_image_url')} placeholder="/images/dog_max.jpg" />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="description">Descripción / Historia</Label>
                <Textarea id="description" rows={3} {...form.register('description')} />
              </div>

              <div className="sm:col-span-2 flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input type="checkbox" {...form.register('is_vaccinated')} className="rounded accent-[var(--color-primary)]" />
                  Vacunado/a
                </label>
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input type="checkbox" {...form.register('is_neutered')} className="rounded accent-[var(--color-primary)]" />
                  Esterilizado/a
                </label>
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input type="checkbox" {...form.register('is_special_needs')} className="rounded accent-[var(--color-primary)]" />
                  Cuidados Especiales
                </label>
              </div>

              <div className="sm:col-span-2 flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" variant="warm" disabled={saveMutation.isPending}>Guardar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{animals.length} Registrado(s)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-[var(--color-muted-foreground)]">Cargando...</div>
          ) : animals.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-muted-foreground)]">No hay animales registrados.</div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {animals.map((animal) => (
                <div key={animal.id} className="flex items-center justify-between py-3 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={animal.main_image_url} alt={animal.name} className="w-12 h-12 rounded-xl object-cover border shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-bold text-base">{animal.name}</h3>
                        <Badge variant={animal.status === 'available' ? 'success' : animal.status === 'adopted' ? 'warm' : 'secondary'} className="text-xs">
                          {animal.status === 'available' ? 'Disponible' : animal.status === 'adopted' ? 'Adoptado' : animal.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-[var(--color-muted-foreground)]">{animal.breed ?? 'Mestizo'} · {animal.gender === 'male' ? 'Macho' : 'Hembra'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => startEdit(animal)} aria-label="Editar">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-[var(--color-destructive)]" onClick={() => { if (confirm(`¿Eliminar a ${animal.name}?`)) deleteMutation.mutate(animal.id); }} aria-label="Eliminar">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
