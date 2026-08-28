import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, ExternalLink, Image, Package, Plus, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  currency: string;
  image_url: string | null;
  inventory: number;
  is_active: boolean;
};

type ProductForm = {
  name: string;
  slug: string;
  description: string;
  priceUsd: string;
  inventory: string;
  imageUrl: string;
  isActive: boolean;
};

const emptyForm: ProductForm = { name: '', slug: '', description: '', priceUsd: '', inventory: '0', imageUrl: '', isActive: false };

function toSlug(value?: string | null) {
  if (!value || typeof value !== 'string') return '';
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function ProductManagement() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [isCreating, setIsCreating] = useState(false);

  const productsQuery = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  useEffect(() => {
    if (!editing && isCreating && form.name && !form.slug) {
      setForm((prev) => ({ ...prev, slug: toSlug(prev.name) }));
    }
  }, [form.name, form.slug, editing, isCreating]);

  const saveMutation = useMutation({
    mutationFn: async (payload: ProductForm) => {
      const priceCents = Math.round(Math.max(0, parseFloat(payload.priceUsd || '0') * 100));
      const inventory = Math.max(0, parseInt(payload.inventory || '0', 10));
      const cleanSlug = toSlug(payload.slug || payload.name);
      if (!payload.name.trim()) throw new Error('El nombre es obligatorio');
      if (!cleanSlug) throw new Error('El slug es obligatorio');
      if (priceCents <= 0) throw new Error('El precio debe ser mayor a 0');

      const body = {
        name: payload.name.trim(),
        slug: cleanSlug,
        description: payload.description.trim(),
        price_cents: priceCents,
        currency: 'USD',
        inventory,
        image_url: payload.imageUrl.trim() || null,
        is_active: payload.isActive,
        updated_at: new Date().toISOString(),
      };

      if (editing) {
        const { error } = await supabase.from('products').update(body).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert([body]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['public-store-products'] });
      toast.success(editing ? 'Producto actualizado' : 'Producto creado');
      resetForm();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleProduct = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase.from('products').update({ is_active: isActive, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['public-store-products'] });
      toast.success('Estado actualizado');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function startEdit(product: Product) {
    setEditing(product);
    setIsCreating(false);
    setForm({ name: product.name ?? '', slug: product.slug ?? '', description: product.description ?? '', priceUsd: (((product.price_cents ?? 0) / 100)).toFixed(2), inventory: String(product.inventory ?? 0), imageUrl: product.image_url ?? '', isActive: product.is_active ?? false });
  }

  function resetForm() {
    setEditing(null);
    setIsCreating(false);
    setForm(emptyForm);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-[var(--color-primary)]" />
            Catálogo de Merchandising
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">Control de productos, stock y visibilidad en la tienda solidaria.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button asChild variant="outline" className="w-full sm:w-auto"><Link to="/tienda" target="_blank"><ExternalLink className="mr-2 h-4 w-4" />Ver tienda pública</Link></Button>
          {!isCreating && !editing && <Button onClick={() => setIsCreating(true)} variant="warm" className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" />Nuevo producto</Button>}
        </div>
      </div>

      {(isCreating || editing) && (
        <Card className="border-[var(--color-primary)]/40 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">{editing ? 'Editar Producto' : 'Crear Nuevo Producto'}</CardTitle>
            <Button variant="ghost" size="sm" onClick={resetForm}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Camiseta AdoptaME" />
              </div>
              <div className="space-y-1.5">
                <Label>Slug (URL única)</Label>
                <Input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: toSlug(e.target.value) }))} placeholder="camiseta-adoptame" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} placeholder="Detalles de la prenda o artículo solidario..." />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Precio (USD)</Label>
                <Input type="number" step="0.01" min="0" value={form.priceUsd} onChange={(e) => setForm((p) => ({ ...p, priceUsd: e.target.value }))} placeholder="25.00" />
              </div>
              <div className="space-y-1.5">
                <Label>Inventario (Stock)</Label>
                <Input type="number" min="0" value={form.inventory} onChange={(e) => setForm((p) => ({ ...p, inventory: e.target.value }))} placeholder="20" />
              </div>
              <div className="space-y-1.5">
                <Label>URL de Imagen</Label>
                <Input value={form.imageUrl} onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))} placeholder="https://... o /images/..." />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="is_active" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} className="rounded accent-[var(--color-primary)]" />
              <Label htmlFor="is_active" className="cursor-pointer text-sm font-semibold">Publicar en tienda inmediatamente</Label>
            </div>

            {form.imageUrl.trim() && <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)]"><img src={form.imageUrl.trim()} alt="Vista previa del producto" className="h-52 w-full object-cover" /><p className="px-4 py-2 text-xs text-[var(--color-muted-foreground)]">Así se verá la imagen principal en la tienda.</p></div>}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={resetForm}>Cancelar</Button>
              <Button variant="warm" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? 'Guardando...' : 'Guardar Producto'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {productsQuery.data?.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <div className="aspect-[4/3] bg-[var(--color-muted)]">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name ?? ''} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-[var(--color-muted-foreground)]">
                  <Image className="h-8 w-8" />
                </div>
              )}
            </div>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-heading font-bold">{product.name}</h2>
                  <p className="text-xs text-[var(--color-muted-foreground)]">{product.slug}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-bold ${product.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'}`}>
                  {product.is_active ? 'Publicado' : 'Borrador'}
                </span>
              </div>
              <p className="line-clamp-2 text-sm text-[var(--color-muted-foreground)]">{product.description || 'Sin descripción'}</p>
              <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3 text-sm">
                <span className="font-bold text-[var(--color-primary)]">${(((product.price_cents ?? 0) / 100)).toFixed(2)} USD</span>
                <span className={`font-semibold ${(product.inventory ?? 0) === 0 ? 'text-rose-600' : (product.inventory ?? 0) <= 3 ? 'text-amber-600' : 'text-[var(--color-muted-foreground)]'}`}>{(product.inventory ?? 0) === 0 ? 'Agotado' : (product.inventory ?? 0) <= 3 ? `Stock bajo · ${product.inventory}` : `${product.inventory ?? 0} disponibles`}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => startEdit(product)} disabled={Boolean(editing)}>
                  <Edit3 className="mr-1 h-4 w-4" />
                  Editar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleProduct.mutate({ id: product.id, isActive: !product.is_active })} disabled={toggleProduct.isPending}>
                  {product.is_active ? 'Ocultar' : 'Publicar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
