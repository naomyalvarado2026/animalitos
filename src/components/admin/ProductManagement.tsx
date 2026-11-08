import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Copy, Download, Edit3, ExternalLink, Image, Package, Plus, Save, Store, X } from 'lucide-react';
import { toast } from 'sonner';
import { assetUrl } from '@/lib/assets';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PRODUCT_GALLERY_LIMIT, PRODUCT_IMAGE_BUCKET, isSupportedProductImageUrl, normalizeProductImageUrls, parseProductImageUrls } from '@/lib/merchandise';
import { getProductImageStoragePath, prepareProductImage } from '@/lib/productImages';
import { motionDistance, motionDuration, motionEaseOut } from '@/lib/motionTokens';
import { VariantManager } from './VariantManager';

type ProductVariant = {
  id: string;
  label: string;
  size_label?: string | null;
  color_hex: string | null;
  image_url: string | null;
  inventory: number;
  is_active: boolean;
};

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  currency: string;
  image_url: string | null;
  gallery_urls?: string[] | null;
  inventory: number;
  is_active: boolean;
  is_proposal: boolean;
  category: string;
  characteristics: string[];
  product_variants: ProductVariant[];
};

type ProductForm = {
  name: string;
  slug: string;
  description: string;
  priceUsd: string;
  inventory: string;
  galleryUrls: string;
  isActive: boolean;
  isProposal: boolean;
  category: string;
  characteristics: string;
};

type ProductFilter = 'all' | 'published' | 'proposal' | 'hidden' | 'low-stock' | 'no-stock';
type SaveVariables = { payload: ProductForm; files: File[]; product: Product | null };
const LOW_STOCK_LIMIT = 5;

const emptyForm: ProductForm = {
  name: '',
  slug: '',
  description: '',
  priceUsd: '',
  inventory: '0',
  galleryUrls: '',
  isActive: false,
  isProposal: true,
  category: 'Catálogo',
  characteristics: '',
};

function toSlug(value?: string | null) {
  if (!value || typeof value !== 'string') return '';
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function csvCell(value: string | number | boolean | null | undefined) {
  let text = String(value ?? '');
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadProductsCsv(products: Product[]) {
  const rows = [
    ['Nombre', 'Slug', 'Estado', 'Tipo', 'Precio USD', 'Existencias', 'Categoría', 'Fotos', 'Variantes'],
    ...products.map((product) => [
      product.name,
      product.slug,
      !product.is_active ? 'Oculto' : product.is_proposal ? 'Propuesta' : 'Publicado',
      product.is_proposal ? 'Propuesta' : 'Confirmado',
      (product.price_cents / 100).toFixed(2),
      product.inventory,
      product.category,
      normalizeProductImageUrls([...(product.gallery_urls ?? []), product.image_url]).length,
      product.product_variants.map((variant) => variant.label).join(' | '),
    ]),
  ];
  const content = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `catalogo-adoptame-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ProductManagement() {
  const shouldReduceMotion = useReducedMotion();
  const queryClient = useQueryClient();
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ProductFilter>('all');
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [isCreating, setIsCreating] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  const productsQuery = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_variants(id, label, size_label, color_hex, image_url, inventory, is_active)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return ((data ?? []) as Product[]).map((product) => {
        const variants = product.product_variants ?? [];
        const activeVariants = variants.filter((variant) => variant.is_active);
        return {
          ...product,
          gallery_urls: normalizeProductImageUrls([...(product.gallery_urls ?? []), product.image_url]),
          product_variants: variants,
          inventory: variants.length ? activeVariants.reduce((total, variant) => total + variant.inventory, 0) : product.inventory,
        };
      });
    },
  });

  useEffect(() => {
    if (!editing && isCreating && form.name && !form.slug) {
      setForm((current) => ({ ...current, slug: toSlug(current.name) }));
    }
  }, [form.name, form.slug, editing, isCreating]);

  useEffect(() => {
    const previews = imageFiles.map((file) => URL.createObjectURL(file));
    setFilePreviews(previews);
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview));
  }, [imageFiles]);

  function resetForm() {
    setEditing(null);
    setIsCreating(false);
    setForm(emptyForm);
    setImageFiles([]);
  }

  const saveMutation = useMutation({
    mutationFn: async ({ payload, files, product }: SaveVariables) => {
      const price = Number(payload.priceUsd);
      const inventory = Number(payload.inventory);
      const cleanSlug = toSlug(payload.slug || payload.name);
      const manualImages = parseProductImageUrls(payload.galleryUrls);
      const invalidImages = manualImages.filter((image) => !isSupportedProductImageUrl(image));

      if (!payload.name.trim()) throw new Error('El nombre del producto es obligatorio.');
      if (!cleanSlug) throw new Error('Escribe un nombre de URL válido.');
      if (!Number.isFinite(price) || price <= 0) throw new Error('El precio debe ser un número mayor a cero.');
      if (!Number.isSafeInteger(inventory) || inventory < 0) throw new Error('Las existencias deben ser un entero igual o mayor a cero.');
      if (invalidImages.length) throw new Error('Las fotos deben usar URLs HTTPS o rutas locales que empiecen con /.');
      if (manualImages.length + files.length > PRODUCT_GALLERY_LIMIT) throw new Error(`Cada ficha admite hasta ${PRODUCT_GALLERY_LIMIT} fotos.`);

      const productId = product?.id ?? crypto.randomUUID();
      const uploadedPaths: string[] = [];
      let galleryImages: string[] = [];
      try {
        const uploadedUrls: string[] = [];
        for (const file of files) {
          const prepared = await prepareProductImage(file);
          const extension = prepared.type === 'image/png' ? 'png' : prepared.type === 'image/jpeg' ? 'jpg' : 'webp';
          const path = `products/${productId}/${crypto.randomUUID()}.${extension}`;
          const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, prepared, {
            cacheControl: '31536000',
            contentType: prepared.type,
            upsert: false,
          });
          if (error) throw error;
          uploadedPaths.push(path);
          uploadedUrls.push(supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl);
        }

        galleryImages = normalizeProductImageUrls([...manualImages, ...uploadedUrls]);
        const body = {
          name: payload.name.trim(),
          slug: cleanSlug,
          description: payload.description.trim(),
          price_cents: Math.round(price * 100),
          currency: 'USD',
          inventory,
          image_url: galleryImages[0] ?? null,
          gallery_urls: galleryImages,
          is_active: payload.isActive,
          is_proposal: payload.isProposal,
          category: payload.category.trim() || 'Catálogo',
          characteristics: payload.characteristics.split('\n').map((line) => line.trim()).filter(Boolean),
          updated_at: new Date().toISOString(),
        };

        const result = product
          ? await supabase.from('products').update(body).eq('id', productId)
          : await supabase.from('products').insert([{ id: productId, ...body }]);
        if (result.error) throw result.error;
      } catch (error) {
        if (uploadedPaths.length) await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove(uploadedPaths);
        throw error;
      }

      let cleanupFailed = false;
      if (product) {
        const previousImages = normalizeProductImageUrls([...(product.gallery_urls ?? []), product.image_url]);
        const nextPaths = new Set(galleryImages.map((image) => getProductImageStoragePath(image, productId)).filter((path): path is string => Boolean(path)));
        const removedPaths = previousImages
          .map((image) => getProductImageStoragePath(image, productId))
          .filter((path): path is string => typeof path === 'string' && !nextPaths.has(path));
        if (removedPaths.length) {
          const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove(removedPaths);
          cleanupFailed = Boolean(error);
        }
      }

      return { product, cleanupFailed };
    },
    onSuccess: ({ product, cleanupFailed }) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      void queryClient.invalidateQueries({ queryKey: ['public-store-products'] });
      if (cleanupFailed) toast.warning('La ficha se guardó. Algunas fotos retiradas no pudieron limpiarse del almacenamiento.');
      else toast.success(product ? 'Producto actualizado' : 'Producto creado');
      resetForm();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleProduct = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase.from('products').update({ is_active: isActive, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      void queryClient.invalidateQueries({ queryKey: ['public-store-products'] });
      toast.success('Visibilidad actualizada');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const products = productsQuery.data ?? [];
  const normalizedSearch = search.trim().toLocaleLowerCase('es');
  const filteredProducts = products.filter((product) => {
    const matchesSearch = `${product.name} ${product.slug} ${product.category}`.toLocaleLowerCase('es').includes(normalizedSearch);
    const matchesFilter = filter === 'all'
      || (filter === 'published' && product.is_active && !product.is_proposal)
      || (filter === 'proposal' && product.is_proposal)
      || (filter === 'hidden' && !product.is_active)
      || (filter === 'low-stock' && !product.is_proposal && product.inventory > 0 && product.inventory <= LOW_STOCK_LIMIT)
      || (filter === 'no-stock' && !product.is_proposal && product.inventory === 0);
    return matchesSearch && matchesFilter;
  });
  const publishedCount = products.filter((product) => product.is_active && !product.is_proposal).length;
  const proposalCount = products.filter((product) => product.is_proposal).length;
  const lowStockCount = products.filter((product) => !product.is_proposal && product.inventory > 0 && product.inventory <= LOW_STOCK_LIMIT).length;
  const noStockCount = products.filter((product) => !product.is_proposal && product.inventory === 0).length;
  const galleryUrlList = parseProductImageUrls(form.galleryUrls);
  const invalidGalleryUrl = galleryUrlList.some((image) => !isSupportedProductImageUrl(image));
  const galleryLimitReached = galleryUrlList.length + imageFiles.length >= PRODUCT_GALLERY_LIMIT;

  function startEdit(product: Product) {
    setEditing(product);
    setIsCreating(false);
    setImageFiles([]);
    const gallery = normalizeProductImageUrls([...(product.gallery_urls ?? []), product.image_url]);
    setForm({
      name: product.name ?? '',
      slug: product.slug ?? '',
      description: product.description ?? '',
      priceUsd: ((product.price_cents ?? 0) / 100).toFixed(2),
      inventory: String(product.product_variants.length ? 0 : product.inventory ?? 0),
      galleryUrls: gallery.join('\n'),
      isActive: product.is_active ?? false,
      isProposal: product.is_proposal,
      category: product.category || 'Catálogo',
      characteristics: (product.characteristics ?? []).join('\n'),
    });
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function startDuplicate(product: Product) {
    const takenSlugs = new Set(products.map((item) => item.slug));
    const baseSlug = toSlug(`${product.slug}-copia`) || 'producto-copia';
    let slug = baseSlug;
    let index = 2;
    while (takenSlugs.has(slug)) slug = `${baseSlug}-${index++}`;

    setEditing(null);
    setIsCreating(true);
    setImageFiles([]);
    setForm({
      name: `${product.name} (copia)`,
      slug,
      description: product.description ?? '',
      priceUsd: ((product.price_cents ?? 0) / 100).toFixed(2),
      inventory: '0',
      galleryUrls: normalizeProductImageUrls([...(product.gallery_urls ?? []), product.image_url]).join('\n'),
      isActive: false,
      isProposal: true,
      category: product.category || 'Catálogo',
      characteristics: (product.characteristics ?? []).join('\n'),
    });
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function addImages(event: FormEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    const remaining = Math.max(0, PRODUCT_GALLERY_LIMIT - galleryUrlList.length - imageFiles.length);
    if (!remaining) toast.info(`La galería admite hasta ${PRODUCT_GALLERY_LIMIT} fotos.`);
    else {
      const selected = files.slice(0, remaining);
      setImageFiles((current) => [...current, ...selected]);
      if (selected.length < files.length) toast.info(`Se añadieron ${selected.length} fotos; el máximo es ${PRODUCT_GALLERY_LIMIT}.`);
    }
    input.value = '';
  }

  return (
    <div className="space-y-6">
      {variantProduct && (
        <VariantManager
          productId={variantProduct.id}
          name={variantProduct.name}
          basePriceCents={variantProduct.price_cents}
          productImages={normalizeProductImageUrls([...(variantProduct.gallery_urls ?? []), variantProduct.image_url])}
          onClose={() => setVariantProduct(null)}
        />
      )}

      <header className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold">
            <Package aria-hidden="true" className="h-6 w-6 text-[var(--color-primary)]" />
            Catálogo de merchandising
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">Productos, fotos, variantes y existencias de la tienda solidaria.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button asChild variant="outline" className="w-full sm:w-auto"><Link to="/tienda" target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" className="mr-2 h-4 w-4" />Ver tienda</Link></Button>
          <Button onClick={() => downloadProductsCsv(filteredProducts)} variant="outline" disabled={!filteredProducts.length} className="w-full sm:w-auto"><Download aria-hidden="true" className="mr-2 h-4 w-4" />Descargar CSV</Button>
          {!isCreating && !editing && <Button onClick={() => { setIsCreating(true); setForm(emptyForm); }} variant="warm" className="w-full sm:w-auto"><Plus aria-hidden="true" className="mr-2 h-4 w-4" />Nuevo producto</Button>}
        </div>
      </header>

      <section aria-label="Resumen del catálogo" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Productos', value: products.length, icon: Package, tone: 'text-[var(--color-foreground)]' },
          { label: 'Publicados', value: publishedCount, icon: Store, tone: 'text-emerald-700' },
          { label: `Stock bajo · 1–${LOW_STOCK_LIMIT}`, value: lowStockCount, icon: AlertTriangle, tone: 'text-amber-700' },
          { label: 'Sin existencias', value: noStockCount, icon: AlertTriangle, tone: 'text-rose-700' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <Card key={label}><CardContent className="flex items-center gap-3 p-4"><span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-muted)] ${tone}`}><Icon aria-hidden="true" className="h-5 w-5" /></span><span><span className="block text-xl font-extrabold">{value}</span><span className="text-xs font-semibold text-[var(--color-muted-foreground)]">{label}</span></span></CardContent></Card>
        ))}
      </section>

      <AnimatePresence initial={false}>
      {(isCreating || editing) && (
        <motion.div
          key={editing?.id ?? 'new-product'}
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : motionDistance.subtle }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: shouldReduceMotion ? 0 : motionDistance.subtle }}
          transition={{ duration: motionDuration.standard, ease: motionEaseOut }}
        >
        <Card className="border-[var(--color-primary)]/40 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <div><CardTitle className="text-lg">{editing ? 'Editar producto' : 'Crear producto'}</CardTitle><p className="mt-1 text-xs text-[var(--color-muted-foreground)]">Completa la ficha y guarda; podrás administrar sus combinaciones después.</p></div>
            <Button variant="ghost" size="sm" onClick={resetForm} aria-label="Cerrar editor"><X aria-hidden="true" className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="pt-2">
            <form onSubmit={(event) => { event.preventDefault(); saveMutation.mutate({ payload: form, files: imageFiles, product: editing }); }} className="space-y-5">
              {editing?.product_variants.length ? <p className="rounded-xl bg-[var(--color-muted)]/50 p-3 text-sm text-[var(--color-muted-foreground)]">Las existencias de este producto se administran en “Colores y tallas”; el stock general queda reservado para productos sin variantes.</p> : null}
              {isCreating && form.isProposal && form.name.endsWith('(copia)') && <p className="rounded-xl bg-[var(--color-muted)]/50 p-3 text-sm text-[var(--color-muted-foreground)]">La copia inicia como propuesta oculta y sin existencias. Revisa sus datos y crea sus variantes antes de publicarla.</p>}

              <div className="rounded-xl bg-[var(--color-muted)]/50 p-4">
                <label className="flex min-h-11 items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={form.isProposal} onChange={(event) => setForm((current) => ({ ...current, isProposal: event.target.checked }))} />Propuesta de diseño · todavía sin compra habilitada</label>
                <p className="text-xs leading-relaxed text-[var(--color-muted-foreground)]">Desactiva esta opción solo cuando precio, producción y existencias estén confirmados.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><Label htmlFor="product-name">Nombre</Label><Input id="product-name" required maxLength={120} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Camiseta AdoptaME" /></div>
                <div className="space-y-1.5"><Label htmlFor="product-slug">Slug · URL única</Label><Input id="product-slug" required value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: toSlug(event.target.value) }))} placeholder="camiseta-adoptame" /></div>
                <div className="space-y-1.5"><Label htmlFor="product-category">Categoría</Label><Input id="product-category" maxLength={80} value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} placeholder="Prendas" /></div>
                <div className="space-y-1.5"><Label htmlFor="product-price">Precio · USD</Label><Input id="product-price" type="number" inputMode="decimal" step="0.01" min="0.01" required value={form.priceUsd} onChange={(event) => setForm((current) => ({ ...current, priceUsd: event.target.value }))} placeholder="25.00" /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="product-description">Descripción</Label><Textarea id="product-description" maxLength={1000} rows={3} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Qué hace especial a este artículo solidario…" /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="product-characteristics">Características · una por línea</Label><Textarea id="product-characteristics" rows={4} value={form.characteristics} onChange={(event) => setForm((current) => ({ ...current, characteristics: event.target.value }))} placeholder={'Material\nMedidas\nCuidados'} /><p className="text-xs text-[var(--color-muted-foreground)]">Aparecerán en la ficha completa del producto.</p></div>
              </div>

              <section aria-labelledby="product-gallery-title" className="space-y-3 rounded-2xl border border-[var(--color-border)] p-4 sm:p-5">
                <div>
                  <h3 id="product-gallery-title" className="flex items-center gap-2 font-heading font-bold"><Image aria-hidden="true" className="h-5 w-5 text-[var(--color-primary)]" />Galería de fotos</h3>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted-foreground)]">Hasta {PRODUCT_GALLERY_LIMIT} fotos. La primera URL será la portada. Puedes pegar una URL por línea y añadir archivos JPG, PNG o WebP.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="product-gallery-urls">URLs de fotos · orden de portada a última foto</Label>
                  <Textarea id="product-gallery-urls" rows={3} value={form.galleryUrls} onChange={(event) => setForm((current) => ({ ...current, galleryUrls: event.target.value }))} placeholder={'https://…\nhttps://…'} aria-invalid={invalidGalleryUrl} />
                  {invalidGalleryUrl && <p role="alert" className="text-xs font-semibold text-rose-700">Usa URLs HTTPS o rutas locales que empiecen con /.</p>}
                  {galleryUrlList.length + imageFiles.length > PRODUCT_GALLERY_LIMIT && <p role="alert" className="text-xs font-semibold text-rose-700">La galería supera el máximo de {PRODUCT_GALLERY_LIMIT} fotos.</p>}
                </div>
                <label className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-dashed border-[var(--color-primary)]/50 bg-[var(--color-muted)]/40 px-4 text-center text-sm font-semibold hover:bg-[var(--color-muted)] ${galleryLimitReached ? 'pointer-events-none opacity-50' : ''}`}>
                  <span>{galleryLimitReached ? 'Galería completa' : 'Elegir fotos para subir'}</span>
                  <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={galleryLimitReached} onChange={addImages} aria-label="Elegir fotos para la galería" />
                </label>
                {filePreviews.length > 0 && <p className="text-xs text-[var(--color-muted-foreground)]">Las fotos nuevas se comprimen antes de subirlas y se guardan bajo una ruta aleatoria.</p>}
                {(galleryUrlList.some(isSupportedProductImageUrl) || filePreviews.length > 0) && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {galleryUrlList.filter(isSupportedProductImageUrl).map((image, index) => (
                      <figure key={`${image}-${index}`} className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]">
                        <img src={assetUrl(image)} alt={`Foto ${index + 1} de ${form.name || 'producto'}`} loading="lazy" decoding="async" className="aspect-square w-full object-cover" />
                        <figcaption className="px-2 py-1.5 text-center text-xs font-semibold">{index === 0 ? 'Portada' : `Foto ${index + 1}`}</figcaption>
                      </figure>
                    ))}
                    {filePreviews.map((preview, index) => (
                      <figure key={`${preview}-${index}`} className="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]">
                        <img src={preview} alt={`Nueva foto ${index + 1} de ${form.name || 'producto'}`} className="aspect-square w-full object-cover" />
                        <button type="button" onClick={() => setImageFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} aria-label={`Quitar nueva foto ${index + 1}`} className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#17022b] shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3c096c]"><X aria-hidden="true" className="h-4 w-4" /></button>
                        <figcaption className="px-2 py-1.5 text-center text-xs font-semibold">Nueva foto {index + 1}</figcaption>
                      </figure>
                    ))}
                  </div>
                )}
              </section>

              <div className="grid gap-4 sm:grid-cols-2">
                {!editing?.product_variants.length && <div className="space-y-1.5"><Label htmlFor="product-inventory">Existencias</Label><Input id="product-inventory" type="number" inputMode="numeric" min="0" step="1" value={form.inventory} onChange={(event) => setForm((current) => ({ ...current, inventory: event.target.value }))} /><p className="text-xs text-[var(--color-muted-foreground)]">Si añades variantes, el stock se cuenta por combinación.</p></div>}
                <div className="flex min-h-11 items-center sm:pt-5"><label className="flex min-h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox" id="product-active" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />{form.isActive ? 'Visible en la tienda' : 'Oculto en la tienda'}</label></div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-[var(--color-border)] pt-4 sm:flex-row sm:justify-end">
                <Button variant="outline" type="button" onClick={resetForm}>Cancelar</Button>
                <Button variant="warm" type="submit" disabled={saveMutation.isPending || invalidGalleryUrl || galleryUrlList.length + imageFiles.length > PRODUCT_GALLERY_LIMIT}>
                  <Save aria-hidden="true" className="mr-2 h-4 w-4" />{saveMutation.isPending ? 'Guardando…' : 'Guardar ficha'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        </motion.div>
      )}
      </AnimatePresence>

      <section className="space-y-3" aria-label="Herramientas para buscar y filtrar productos">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input aria-label="Buscar productos" placeholder="Buscar por nombre, URL o categoría…" value={search} onChange={(event) => setSearch(event.target.value)} />
          <select aria-label="Filtrar productos" value={filter} onChange={(event) => setFilter(event.target.value as ProductFilter)} className="min-h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-sm sm:min-w-56">
            <option value="all">Todos los productos</option>
            <option value="published">Publicados</option>
            <option value="proposal">Propuestas · {proposalCount}</option>
            <option value="hidden">Ocultos</option>
            <option value="low-stock">Stock bajo · {lowStockCount}</option>
            <option value="no-stock">Sin existencias · {noStockCount}</option>
          </select>
        </div>
        <p className="text-xs text-[var(--color-muted-foreground)]">Mostrando {filteredProducts.length} de {products.length}. El CSV descarga solo estos resultados.</p>
      </section>

      {productsQuery.isPending && <p role="status">Cargando colección…</p>}
      {productsQuery.isError && <div role="alert" className="rounded-xl border border-[var(--color-border)] p-4">No pudimos cargar el catálogo. <button type="button" className="font-semibold underline" onClick={() => void productsQuery.refetch()}>Reintentar</button></div>}
      {!productsQuery.isPending && !productsQuery.isError && !filteredProducts.length && <p role="status" className="rounded-xl bg-[var(--color-muted)] p-6">No hay productos para esos filtros.</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence initial={false} mode="popLayout">
        {filteredProducts.map((product, index) => {
          const gallery = normalizeProductImageUrls([...(product.gallery_urls ?? []), product.image_url]);
          return (
            <motion.div
              key={product.id}
              layout={!shouldReduceMotion}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : motionDistance.subtle }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.985 }}
              transition={{
                layout: { duration: shouldReduceMotion ? 0 : motionDuration.standard, ease: motionEaseOut },
                opacity: { duration: motionDuration.quick },
                y: { duration: shouldReduceMotion ? 0 : motionDuration.standard, ease: motionEaseOut, delay: shouldReduceMotion ? 0 : Math.min(index * 0.03, 0.15) },
              }}
            >
            <Card className="overflow-hidden">
              <div className="relative aspect-[4/3] bg-[var(--color-muted)]">
                {gallery[0] ? <img src={assetUrl(gallery[0])} loading="lazy" decoding="async" alt={product.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[var(--color-muted-foreground)]"><Image aria-hidden="true" className="h-8 w-8" /></div>}
                <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[#17022b]">{gallery.length} {gallery.length === 1 ? 'foto' : 'fotos'}</span>
                  {product.product_variants.length > 0 && <span className="rounded-full bg-[#3c096c]/90 px-3 py-1 text-xs font-bold text-white">{product.product_variants.length} combinaciones</span>}
                </div>
              </div>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><h2 className="truncate font-heading font-bold">{product.name}</h2><p className="truncate text-xs text-[var(--color-muted-foreground)]">{product.slug}</p></div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${product.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'}`}>{!product.is_active ? 'Oculto' : product.is_proposal ? 'Propuesta' : 'Publicado'}</span>
                </div>
                <p className="line-clamp-2 text-sm text-[var(--color-muted-foreground)]">{product.description || 'Sin descripción'}</p>
                <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-3 text-sm">
                  <span className="font-bold text-[var(--color-primary)]">${((product.price_cents ?? 0) / 100).toFixed(2)} USD</span>
                  <span className={`text-right font-semibold ${(product.inventory ?? 0) === 0 && !product.is_proposal ? 'text-rose-600' : (product.inventory ?? 0) <= LOW_STOCK_LIMIT && !product.is_proposal ? 'text-amber-600' : 'text-[var(--color-muted-foreground)]'}`}>{product.is_proposal ? 'En preparación' : product.inventory === 0 ? 'Sin stock' : product.inventory <= LOW_STOCK_LIMIT ? `Stock bajo · ${product.inventory}` : `${product.inventory} disponibles`}</span>
                </div>
                {!!product.product_variants.length && (
                  <div><p className="text-xs font-semibold text-[var(--color-muted-foreground)]">Colores y tallas</p><div className="mt-2 flex flex-wrap gap-1.5">{product.product_variants.slice(0, 5).map((variant) => <span key={variant.id} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-2 py-1 text-xs"><span className="h-3 w-3 rounded-full border border-black/10" style={{ background: variant.color_hex || '#e0beff' }} />{variant.label}</span>)}{product.product_variants.length > 5 && <span className="px-1 py-1 text-xs text-[var(--color-muted-foreground)]">+{product.product_variants.length - 5}</span>}</div></div>
                )}
                <div className="flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-3">
                  <Button variant="outline" size="sm" onClick={() => setVariantProduct(product)}>Colores y tallas</Button>
                  <Button variant="outline" size="sm" onClick={() => startEdit(product)} disabled={Boolean(editing || isCreating)}><Edit3 aria-hidden="true" className="mr-1 h-4 w-4" />Editar</Button>
                  <Button variant="outline" size="sm" onClick={() => startDuplicate(product)} disabled={Boolean(editing || isCreating)}><Copy aria-hidden="true" className="mr-1 h-4 w-4" />Duplicar</Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleProduct.mutate({ id: product.id, isActive: !product.is_active })} disabled={toggleProduct.isPending}>{product.is_active ? 'Ocultar' : 'Publicar'}</Button>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          );
        })}
        </AnimatePresence>
      </div>
    </div>
  );
}
