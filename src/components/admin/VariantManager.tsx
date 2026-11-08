import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Palette, Plus, Ruler, Save } from 'lucide-react';
import { AccessibleDialog } from '@/components/ui/AccessibleDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { assetUrl } from '@/lib/assets';
import { buildVariantLabel, isSupportedProductImageUrl, splitVariantLabel } from '@/lib/merchandise';
import { toast } from 'sonner';

type Variant = {
  id: string;
  label: string;
  size_label: string | null;
  color_hex: string | null;
  image_url: string | null;
  inventory: number;
  price_delta_cents: number;
  is_active: boolean;
  sku: string | null;
};

type VariantForm = {
  colorName: string;
  sizeLabel: string;
  colorHex: string;
  imageUrl: string;
  inventory: string;
  priceDelta: string;
  isActive: boolean;
  sku: string;
};

const emptyForm: VariantForm = {
  colorName: 'Morado',
  sizeLabel: '',
  colorHex: '#3c096c',
  imageUrl: '',
  inventory: '0',
  priceDelta: '0',
  isActive: true,
  sku: '',
};

export function VariantManager({
  productId,
  name,
  basePriceCents,
  productImages = [],
  onClose,
}: {
  productId: string;
  name: string;
  basePriceCents: number;
  productImages?: string[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VariantForm>(emptyForm);

  const variantsQuery = useQuery({
    queryKey: ['admin-variants', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select('id,label,size_label,color_hex,image_url,inventory,price_delta_cents,is_active,sku')
        .eq('product_id', productId)
        .order('label');
      if (error) throw error;
      return (data ?? []) as Variant[];
    },
  });

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function editVariant(variant: Variant) {
    const parts = splitVariantLabel({ name: variant.label, sizeLabel: variant.size_label });
    setEditingId(variant.id);
    setForm({
      colorName: parts.colorName,
      sizeLabel: parts.sizeLabel ?? '',
      colorHex: variant.color_hex || '#3c096c',
      imageUrl: variant.image_url || '',
      inventory: String(variant.inventory),
      priceDelta: (variant.price_delta_cents / 100).toFixed(2),
      isActive: variant.is_active,
      sku: variant.sku || '',
    });
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const inventory = Number(form.inventory);
      const priceDelta = Number(form.priceDelta);
      const label = buildVariantLabel(form.colorName, form.sizeLabel);
      const colorHex = form.colorHex.trim();
      const imageUrl = form.imageUrl.trim();

      if (!form.colorName.trim() || form.colorName.trim().length > 80 || !label) {
        throw new Error('Escribe un nombre de color u opción, de hasta 80 caracteres.');
      }
      if (form.sizeLabel.trim().length > 40) throw new Error('La talla no puede superar 40 caracteres.');
      if (!Number.isSafeInteger(inventory) || inventory < 0) throw new Error('Las existencias deben ser un entero igual o mayor a cero.');
      if (!Number.isFinite(priceDelta) || basePriceCents + Math.round(priceDelta * 100) <= 0) throw new Error('El precio final de la variante debe ser mayor a cero.');
      if (!/^#[0-9a-f]{6}$/i.test(colorHex)) throw new Error('Selecciona un color válido.');
      if (imageUrl && !isSupportedProductImageUrl(imageUrl)) throw new Error('La imagen debe usar una URL HTTPS o una ruta local.');

      const body = {
        product_id: productId,
        label,
        size_label: form.sizeLabel.trim() || null,
        color_hex: colorHex,
        image_url: imageUrl || null,
        inventory,
        price_delta_cents: Math.round(priceDelta * 100),
        is_active: form.isActive,
        sku: form.sku.trim() || null,
      };
      const result = editingId
        ? await supabase.from('product_variants').update(body).eq('id', editingId).eq('product_id', productId)
        : await supabase.from('product_variants').insert(body);
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-variants', productId] });
      void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      void queryClient.invalidateQueries({ queryKey: ['public-store-products'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-commerce-summary'] });
      resetForm();
      toast.success('Variante guardada');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AccessibleDialog open onClose={() => { if (!saveMutation.isPending) onClose(); }} title={`Variantes de ${name}`}>
      <div className="max-h-[calc(100dvh-4rem)] space-y-5 overflow-y-auto bg-[var(--color-card)] p-4 text-[var(--color-foreground)] sm:p-6">
        <div className="rounded-2xl bg-[var(--color-muted)]/50 p-4">
          <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">Crea una opción por combinación, por ejemplo “Morado · M”. Cada combinación guarda su propio código, precio y existencias; ocultarla conserva los pedidos anteriores.</p>
        </div>

        {variantsQuery.isPending && <p role="status" className="text-sm">Cargando opciones…</p>}
        {variantsQuery.isError && <p role="alert" className="rounded-xl border border-rose-300 p-3 text-sm">No se pudieron consultar las opciones. <button type="button" onClick={() => void variantsQuery.refetch()} className="font-semibold underline">Reintentar</button></p>}
        {variantsQuery.data?.length === 0 && <p className="rounded-xl border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-muted-foreground)]">Aún no hay colores o tallas. Añade la primera combinación aquí.</p>}

        {!!variantsQuery.data?.length && (
          <ul className="grid gap-2 sm:grid-cols-2" aria-label="Variantes del producto">
            {variantsQuery.data.map((variant) => {
              const parts = splitVariantLabel({ name: variant.label, sizeLabel: variant.size_label });
              return (
                <li key={variant.id}>
                  <button type="button" onClick={() => editVariant(variant)} aria-label={`Editar ${variant.label}`} className={`flex min-h-[76px] w-full items-center gap-3 rounded-xl border p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] ${editingId === variant.id ? 'border-[var(--color-primary)] bg-[var(--color-muted)]' : 'border-[var(--color-border)] hover:bg-[var(--color-muted)]/50'}`}>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10" style={{ backgroundColor: variant.color_hex || '#e0beff' }} aria-hidden="true">{editingId === variant.id && <Check className="h-4 w-4 text-white" />}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{parts.colorName}{parts.sizeLabel ? ` · ${parts.sizeLabel}` : ''}</span>
                      <span className="mt-0.5 block text-xs text-[var(--color-muted-foreground)]">{variant.inventory} unidades · {variant.is_active ? 'Visible' : 'Oculta'}{variant.sku ? ` · ${variant.sku}` : ''}</span>
                    </span>
                    {variant.price_delta_cents !== 0 && <span className="shrink-0 text-xs font-semibold">{variant.price_delta_cents > 0 ? '+' : '−'}${(Math.abs(variant.price_delta_cents) / 100).toFixed(2)}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <form onSubmit={(event) => { event.preventDefault(); saveMutation.mutate(); }} className="space-y-4 rounded-2xl border border-[var(--color-border)] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-heading text-lg font-bold">{editingId ? 'Editar combinación' : 'Nueva combinación'}</h3>
            {editingId && <Button type="button" variant="outline" size="sm" onClick={resetForm}><Plus aria-hidden="true" className="mr-1 h-4 w-4" />Nueva</Button>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="variant-color-name">Color u opción</Label>
              <Input id="variant-color-name" required maxLength={80} value={form.colorName} onChange={(event) => setForm((current) => ({ ...current, colorName: event.target.value }))} placeholder="Morado" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="variant-size"><span className="inline-flex items-center gap-1"><Ruler aria-hidden="true" className="h-4 w-4" />Talla u opción adicional</span></Label>
              <Input id="variant-size" maxLength={40} value={form.sizeLabel} onChange={(event) => setForm((current) => ({ ...current, sizeLabel: event.target.value }))} placeholder="M · opcional" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="variant-sku">Código SKU · opcional</Label>
              <Input id="variant-sku" value={form.sku} onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))} placeholder="CAM-MOR-M" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="variant-color">Muestra de color</Label>
              <div className="flex min-h-11 items-center gap-3 rounded-xl border border-[var(--color-border)] px-3">
                <input id="variant-color" type="color" value={form.colorHex} onChange={(event) => setForm((current) => ({ ...current, colorHex: event.target.value }))} className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0" />
                <span className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)]"><Palette aria-hidden="true" className="h-4 w-4" />{form.colorHex.toUpperCase()}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="variant-inventory">Existencias</Label>
              <Input id="variant-inventory" type="number" inputMode="numeric" min="0" step="1" required value={form.inventory} onChange={(event) => setForm((current) => ({ ...current, inventory: event.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="variant-price-delta">Diferencia de precio · USD</Label>
              <Input id="variant-price-delta" type="number" inputMode="decimal" step="0.01" value={form.priceDelta} onChange={(event) => setForm((current) => ({ ...current, priceDelta: event.target.value }))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="variant-image">Foto para este color · opcional</Label>
            {productImages.length > 0 && (
              <select id="variant-image" value={form.imageUrl} onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))} className="min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-sm">
                <option value="">Usar la portada del producto</option>
                {productImages.map((image, index) => <option key={image} value={image}>Foto {index + 1}{index === 0 ? ' · portada' : ''}</option>)}
                {form.imageUrl && !productImages.includes(form.imageUrl) && <option value={form.imageUrl}>Imagen personalizada</option>}
              </select>
            )}
            <Input aria-label="URL o ruta de la foto de la variante" type="url" value={form.imageUrl.startsWith('/') ? '' : form.imageUrl} onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))} placeholder="https://… o elige una foto del producto" />
            {form.imageUrl && <img src={assetUrl(form.imageUrl)} alt={`Vista previa del color ${form.colorName}`} loading="lazy" className="mt-2 h-28 w-28 rounded-xl border border-[var(--color-border)] object-cover" />}
          </div>

          <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />
            Mostrar esta combinación en la tienda
          </label>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={saveMutation.isPending}>Cerrar</Button>
            <Button type="submit" disabled={saveMutation.isPending || variantsQuery.isPending || variantsQuery.isError} className="bg-[#3c096c] text-white hover:bg-[#17022b]">
              <Save aria-hidden="true" className="mr-2 h-4 w-4" />{saveMutation.isPending ? 'Guardando…' : 'Guardar combinación'}
            </Button>
          </div>
        </form>
      </div>
    </AccessibleDialog>
  );
}
