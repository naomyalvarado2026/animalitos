import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, Image, Package, Plus, Save, X } from 'lucide-react';
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

function toSlug(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function ProductManagement() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  const productsQuery = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('id, slug, name, description, price_cents, currency, image_url, inventory, is_active').order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  useEffect(() => {
    if (!editing) setForm(emptyForm);
  }, [editing]);

  const saveProduct = useMutation({
    mutationFn: async () => {
      const name = form.name.trim();
      const slug = toSlug(form.slug || name);
      const priceUsd = Number(form.priceUsd);
      const inventory = Number(form.inventory);
      if (name.length < 2) throw new Error('Escribe un nombre válido.');
      if (!slug) throw new Error('Define un identificador para el producto.');
      if (!Number.isFinite(priceUsd) || priceUsd <= 0) throw new Error('El precio debe ser mayor que 0 USD.');
      if (!Number.isInteger(inventory) || inventory < 0) throw new Error('El inventario debe ser un número entero no negativo.');
      const payload = { name, slug, description: form.description.trim(), price_cents: Math.round(priceUsd * 100), currency: 'USD', image_url: form.imageUrl.trim() || null, inventory, is_active: form.isActive, updated_at: new Date().toISOString() };
      const query = editing ? supabase.from('products').update(payload).eq('id', editing).select('id').single() : supabase.from('products').insert(payload).select('id').single();
      const { data, error } = await query;
      if (error) throw error;
      if (!data) throw new Error('Supabase no confirmó el producto.');
    },
    onSuccess: () => { toast.success(editing ? 'Producto actualizado.' : 'Producto creado.'); setEditing(null); void queryClient.invalidateQueries({ queryKey: ['admin-products'] }); },
    onError: (error: Error) => toast.error(error.message || 'No se pudo guardar el producto.'),
  });

  const toggleProduct = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase.from('products').update({ is_active: isActive, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Visibilidad actualizada.'); void queryClient.invalidateQueries({ queryKey: ['admin-products'] }); },
    onError: () => toast.error('No se pudo cambiar la visibilidad.'),
  });

  function startEdit(product: Product) {
    setEditing(product.id);
    setForm({ name: product.name, slug: product.slug, description: product.description, priceUsd: (product.price_cents / 100).toFixed(2), inventory: String(product.inventory), imageUrl: product.image_url ?? '', isActive: product.is_active });
  }

  return <section className="space-y-6" aria-labelledby="products-title">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h1 id="products-title" className="flex items-center gap-2 font-heading text-2xl font-bold"><Package className="h-6 w-6 text-[var(--color-primary)]" />Productos de tienda</h1><p className="mt-1 text-sm text-[var(--color-muted-foreground)]">Administra el catálogo solidario, los precios en USD y el inventario.</p></div><Button variant="warm" onClick={() => { setEditing('new'); setForm(emptyForm); }} disabled={Boolean(editing)}><Plus className="mr-2 h-4 w-4" />Nuevo producto</Button></div>

    {productsQuery.error && <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100">No se pudo cargar el catálogo. Verifica que la migración de merchandising esté aplicada y que tu perfil tenga permisos.</div>}
    {productsQuery.isLoading && <p className="text-sm text-[var(--color-muted-foreground)]" role="status">Cargando catálogo…</p>}

    {editing && <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">{editing === 'new' ? 'Nuevo producto' : 'Editar producto'}</CardTitle><Button variant="ghost" size="icon" onClick={() => setEditing(null)} aria-label="Cancelar edición"><X className="h-4 w-4" /></Button></CardHeader><CardContent><form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); saveProduct.mutate(); }}><div><Label htmlFor="product-name">Nombre</Label><Input id="product-name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value, slug: form.slug || toSlug(event.target.value) })} placeholder="Camiseta AdoptaME" /></div><div><Label htmlFor="product-slug">Slug</Label><Input id="product-slug" required value={form.slug} onChange={(event) => setForm({ ...form, slug: toSlug(event.target.value) })} placeholder="camiseta-adoptame" /></div><div className="md:col-span-2"><Label htmlFor="product-description">Descripción</Label><Textarea id="product-description" rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe el producto y su propósito solidario." /></div><div><Label htmlFor="product-price">Precio en USD</Label><Input id="product-price" required type="number" min="0.01" step="0.01" value={form.priceUsd} onChange={(event) => setForm({ ...form, priceUsd: event.target.value })} placeholder="25.00" /></div><div><Label htmlFor="product-inventory">Inventario</Label><Input id="product-inventory" required type="number" min="0" step="1" value={form.inventory} onChange={(event) => setForm({ ...form, inventory: event.target.value })} /></div><div className="md:col-span-2"><Label htmlFor="product-image">URL de imagen</Label><div className="relative"><Image className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" /><Input id="product-image" className="pl-9" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} placeholder="https://… o ruta pública de Supabase" /></div></div><label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} className="h-4 w-4 accent-[var(--color-primary)]" />Publicar producto en la tienda</label><div className="flex gap-2 md:col-span-2"><Button type="submit" variant="warm" disabled={saveProduct.isPending}><Save className="mr-2 h-4 w-4" />{saveProduct.isPending ? 'Guardando…' : 'Guardar producto'}</Button><Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button></div></form></CardContent></Card>}

    {!productsQuery.error && !productsQuery.isLoading && productsQuery.data?.length === 0 && <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-10 text-center text-sm text-[var(--color-muted-foreground)]">Todavía no hay productos. Crea el primero para activar el catálogo.</div>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{productsQuery.data?.map((product) => <Card key={product.id} className="overflow-hidden"><div className="aspect-[4/3] bg-[var(--color-muted)]">{product.image_url ? <img src={product.image_url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[var(--color-muted-foreground)]"><Image className="h-8 w-8" /></div>}</div><CardContent className="space-y-3 p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-heading font-bold">{product.name}</h2><p className="text-xs text-[var(--color-muted-foreground)]">{product.slug}</p></div><span className={`rounded-full px-2 py-1 text-xs font-bold ${product.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'}`}>{product.is_active ? 'Publicado' : 'Borrador'}</span></div><p className="line-clamp-2 text-sm text-[var(--color-muted-foreground)]">{product.description || 'Sin descripción'}</p><div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3 text-sm"><span className="font-bold text-[var(--color-primary)]">${(product.price_cents / 100).toFixed(2)} USD</span><span className="text-[var(--color-muted-foreground)]">{product.inventory} disponibles</span></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => startEdit(product)} disabled={Boolean(editing)}><Edit3 className="mr-1 h-4 w-4" />Editar</Button><Button variant="ghost" size="sm" onClick={() => toggleProduct.mutate({ id: product.id, isActive: !product.is_active })} disabled={toggleProduct.isPending}>{product.is_active ? 'Ocultar' : 'Publicar'}</Button></div></CardContent></Card>)}</div>
  </section>;
}
