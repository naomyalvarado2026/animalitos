import { useRef, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  Check,
  Eye,
  Heart,
  PackageCheck,
  PawPrint,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AccessibleDialog } from '@/components/ui/AccessibleDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResilientImage } from '@/components/ui/ResilientImage';
import { supabase } from '@/lib/supabase';
import { assetUrl } from '@/lib/assets';
import { getColorOptions, normalizeCatalogSearch, normalizeProductImageUrls, splitVariantLabel, type MerchandiseProduct, type MerchandiseVariantOption } from '@/lib/merchandise';
import { motionDistance, motionDuration, motionEaseOut } from '@/lib/motionTokens';
import { ContextualFaq } from './ContextualFaq';
import { ProductDetailDialog } from './ProductDetailDialog';
import { RefugeDogRibbon } from './RefugeDogRibbon';

type Product = MerchandiseProduct & {
  color: keyof typeof productBackground;
  featured: boolean;
  selectedVariantId?: string;
  selectedVariantLabel?: string;
};

const productBackground = {
  coral: 'bg-[#ff8069]',
  yellow: 'bg-[#e0beff]',
  cream: 'bg-[#f1e2ff]',
} as const;

export function StorePage() {
  const shouldReduceMotion = useReducedMotion();
  const orderKey = useRef('');
  const orderSignature = useRef('');
  const [chosenVariants, setChosenVariants] = useState<Record<string, string>>({});
  const [added, setAdded] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'recent' | 'name' | 'price-low' | 'price-high'>('recent');
  const [activeCategory, setActiveCategory] = useState('Todo');
  const [quantity, setQuantity] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const productsQuery = useQuery({
    queryKey: ['public-store-products'],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('slug, name, description, price_cents, image_url, gallery_urls, inventory, is_proposal, category, characteristics, created_at, product_variants(id, label, size_label, color_hex, image_url, is_active, inventory, price_delta_cents)').eq('is_active', true).eq('currency', 'USD').order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((product): Product => {
        const galleryImages = normalizeProductImageUrls([...(product.gallery_urls ?? []), product.image_url]).map(assetUrl);
        const variants: MerchandiseVariantOption[] = product.product_variants.filter((variant) => variant.is_active).map((variant) => ({
          id: variant.id,
          name: variant.label,
          sizeLabel: variant.size_label,
          hex: variant.color_hex || '#e0beff',
          image: variant.image_url ? assetUrl(variant.image_url) : '',
          inventory: variant.inventory,
          priceDelta: variant.price_delta_cents,
        }));
        return {
          slug: product.slug,
          name: product.name,
          category: product.category || 'Catálogo',
          description: product.description || '',
          details: product.characteristics?.length ? product.characteristics : [],
          galleryImages,
          image: galleryImages[0] ?? '',
          isLive: !product.is_proposal,
          priceCents: product.price_cents ?? 0,
          price: `$${(((product.price_cents ?? 0) / 100)).toFixed(2)} USD`,
          inventory: variants.length ? variants.reduce((total, variant) => total + variant.inventory, 0) : product.inventory ?? 0,
          variants,
          color: 'cream',
          featured: false,
        };
      });
    },
  });
  const databaseProducts = productsQuery.data ?? [];
  const catalog: Product[] = databaseProducts;
  const categories = Array.from(new Set(['Todo', ...catalog.map((product) => product.category)]));
  const normalizedSearch = normalizeCatalogSearch(search);
  const matchingProducts = catalog.filter((product) => {
    const matchesCategory = activeCategory === 'Todo' || product.category === activeCategory;
    const searchable = normalizeCatalogSearch([product.name, product.description, product.category, ...product.details, ...product.variants.map((variant) => variant.name)].join(' '));
    return matchesCategory && (!normalizedSearch || searchable.includes(normalizedSearch));
  });
  const products = [...matchingProducts].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name, 'es');
    if (sort === 'price-low') return a.priceCents - b.priceCents;
    if (sort === 'price-high') return b.priceCents - a.priceCents;
    return catalog.indexOf(a) - catalog.indexOf(b);
  });

  const addProduct = (product: Product, variant: MerchandiseVariantOption | null) => {
    if (!product.isLive) { toast.info('Este artículo está en preparación. Escríbenos para conocer disponibilidad.'); return; }
    const priceCents = product.priceCents + (variant?.priceDelta ?? 0);
    orderKey.current = crypto.randomUUID();
    setQuantity(1);
    setSelectedProduct({
      ...product,
      image: variant?.image || product.image,
      inventory: variant?.inventory ?? product.inventory,
      selectedVariantId: variant?.id,
      selectedVariantLabel: variant?.name,
      priceCents,
      price: `$${(priceCents / 100).toFixed(2)} USD`,
    });
    setDetailProduct(null);
  };

  const submitOrder = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedProduct || !form.name || !form.email || !form.phone) return;

    if (submitting) return;
    const signature = JSON.stringify([selectedProduct.slug, selectedProduct.selectedVariantId, quantity, form]);
    if (orderSignature.current !== signature) { orderKey.current = crypto.randomUUID(); orderSignature.current = signature; }
    setSubmitting(true);
    try {
    const { data: receipt, error } = await supabase.rpc('create_merchandise_variant_order', {
      p_customer_name: form.name,
      p_customer_email: form.email,
      p_customer_phone: form.phone,
      p_product_slug: selectedProduct.slug,
      p_quantity: quantity,
      p_variant_id: selectedProduct.selectedVariantId ?? null,
      p_idempotency_key: orderKey.current,
    });
    setSubmitting(false);

    if (error) {
      toast.error('No pudimos enviar tu pedido. Intenta nuevamente en unos minutos.');
      return;
    }

    setAdded((items) => items.includes(selectedProduct.name) ? items : [...items, selectedProduct.name]);
    toast.success(`Pedido ${receipt?.order_number ?? ''} recibido. Te contactaremos para coordinar envío y pago.`, { duration: 10000 });
    void productsQuery.refetch();
    setSelectedProduct(null);
    setQuantity(1);
    setForm({ name: '', email: '', phone: '' });
    } catch { toast.error('No pudimos conectar. Puedes volver a intentar el mismo pedido.'); } finally { setSubmitting(false); }
  };

  return (
    <div className="overflow-hidden bg-[#fffdf9] pt-16 text-[#17022b]">
      <section className="relative isolate bg-[#17022b] text-[#fffdf9]">
        <ResilientImage
          src={assetUrl('/images/shelter_hero_1785817115197.jpg')}
          alt="Perro rescatado de AdoptaME"
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-25"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#17022b] via-[#17022b]/95 to-[#17022b]/55" />
        <div className="max-w-7xl mx-auto px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="grid items-end gap-10 lg:grid-cols-[1.25fr_.75fr]">
            <div className="max-w-3xl">
              <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[.16em] text-[#ffad7f]">
                <Sparkles className="h-4 w-4" /> Tienda solidaria
              </p>
              <h1 className="mt-5 font-heading text-5xl font-extrabold leading-[.9] tracking-[-.065em] sm:text-7xl lg:text-8xl">
                Lleva un <span className="text-[#ff8069]">ME</span> contigo.
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/75">
                Objetos con propósito para hacer visible una idea simple: adoptar cambia vidas. Cada pedido nos acerca al cuidado que nuestros rescatados necesitan.
              </p>
              <div className="mt-9 flex flex-wrap gap-3 text-sm font-semibold text-white/85">
                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">Compra con causa</span>
                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">Valores en USD</span>
                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">Confirmación personal</span>
              </div>
            </div>
            <aside className="rounded-[2rem] border border-white/15 bg-[#ff8069] text-[#17022b] p-7 shadow-2xl shadow-black/20 lg:p-9">
              <PawPrint className="h-8 w-8" />
              <p className="mt-16 font-heading text-3xl font-extrabold leading-none tracking-[-.04em]">Una compra, una señal de esperanza.</p>
              <p className="mt-4 leading-relaxed text-[#17022b]/80">Te contactamos antes de finalizar los detalles de tu pedido: disponibilidad, envío y pago.</p>
            </aside>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="grid gap-8 border-b border-[#17022b]/10 pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[.15em] text-[#3c096c]">Colección AdoptaME</p>
            <h2 className="mt-3 font-heading text-4xl font-extrabold tracking-[-.055em] sm:text-5xl">Diseños que llevan la causa contigo.</h2>
            <p className="mt-4 leading-relaxed text-[#65566f]">Conoce nuestra propuesta de colección. Los renders muestran la propuesta de diseño; precios de referencia, materiales, medidas y colores están sujetos a validación antes de producir.</p>
          </div>
          <p className="rounded-2xl bg-[#f1e2ff] px-5 py-4 text-sm leading-relaxed text-[#3c096c] lg:max-w-xs">
            <span className="block font-bold">{databaseProducts.some(product => product.isLive) ? "Catálogo disponible" : "Propuestas de diseño"}</span>
            {databaseProducts.some(product => product.isLive) ? 'Precios publicados en USD' : 'Colección propuesta · precios de referencia'}
          </p>
        </div>

        {productsQuery.isPending && <p role="status" className="mt-6">Consultando disponibilidad del catálogo…</p>}
        {productsQuery.isError && <div role="status" className="mt-6 rounded-2xl border border-[#3c096c]/20 p-4">No pudimos consultar la disponibilidad. Puedes explorar las propuestas o <button onClick={() => void productsQuery.refetch()} className="font-bold underline">volver a intentar</button>.</div>}
        <div className="mt-8 flex flex-wrap gap-2" aria-label="Categorías de productos">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              aria-pressed={activeCategory === category}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${activeCategory === category ? 'bg-[#17022b] text-white' : 'border border-[#17022b]/15 bg-white text-[#5f5a54] hover:border-[#ff8069] hover:text-[#ff8069]'}`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="relative block">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#65566f]" />
            <Input aria-label="Buscar en la tienda" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar producto, color o característica…" className="min-h-11 border-[#17022b]/15 bg-white pl-10 text-[#17022b]" />
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#65566f]">
            <span className="sr-only">Ordenar productos</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="min-h-11 w-full rounded-xl border border-[#17022b]/15 bg-white px-3 text-sm text-[#17022b] sm:min-w-52">
              <option value="recent">Más recientes</option>
              <option value="name">Nombre · A a Z</option>
              <option value="price-low">Precio · menor a mayor</option>
              <option value="price-high">Precio · mayor a menor</option>
            </select>
          </label>
        </div>
        <p className="mt-3 text-xs text-[#65566f]">{products.length} {products.length === 1 ? 'artículo' : 'artículos'} en esta selección</p>

        {!productsQuery.isPending && !productsQuery.isError && !products.length && <p role="status" className="mt-8 rounded-2xl bg-[#f1e2ff] p-6">No encontramos artículos con esos filtros. Prueba otra palabra o categoría.</p>}
        <div className="mt-10 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false} mode="popLayout">
          {products.map((product, index) => {
            const chosen = product.variants.find((item) => item.id === chosenVariants[product.slug]) ?? product.variants[0] ?? null;
            const image = chosen?.image || product.image;
            const stock = chosen?.inventory ?? product.inventory;
            const cents = (product.priceCents ?? 0) + (chosen?.priceDelta ?? 0);
            const colorOptions = getColorOptions(product.variants);
            return (
            <motion.article
              key={product.slug}
              layout={!shouldReduceMotion}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : motionDistance.subtle }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.985 }}
              transition={{
                layout: { duration: shouldReduceMotion ? 0 : motionDuration.standard, ease: motionEaseOut },
                opacity: { duration: motionDuration.quick },
                y: { duration: shouldReduceMotion ? 0 : motionDuration.standard, ease: motionEaseOut, delay: shouldReduceMotion ? 0 : Math.min(index * 0.035, 0.14) },
              }}
              className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-[#17022b]/10 bg-white shadow-[0_12px_35px_rgba(23,23,23,.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(23,23,23,.12)]"
            >
              <button type="button" onClick={() => setDetailProduct(product)} className={`relative block aspect-[4/3] w-full overflow-hidden text-left ${productBackground[product.color]} focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-[#3c096c]`} aria-label={`Ver ficha completa de ${product.name}`}>
                {image ? <ResilientImage src={image} srcSet={!product.isLive && image.includes('-960.webp') ? `${image.replace('-960.webp', '-480.webp')} 480w, ${image} 960w` : undefined} sizes="(min-width: 1280px) 390px, (min-width: 768px) 50vw, 100vw" alt={product.isLive ? product.name : `Render de propuesta: ${product.name}`} width={1448} height={1086} loading="lazy" decoding="async" className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.02]" /> : <div className="flex h-full items-center justify-center text-[#3c096c]/45"><PackageCheck aria-hidden="true" className="h-12 w-12" /></div>}
                {product.galleryImages.length > 1 && <span className="absolute bottom-4 right-4 rounded-full bg-[#17022b]/85 px-3 py-1 text-xs font-bold text-white">{product.galleryImages.length} fotos</span>}
                
                <div className="absolute left-4 top-4 flex gap-2">
                  <span className="rounded-full bg-[#fffdf9] px-3 py-1 text-xs font-bold text-[#17022b]">{product.category}</span>
                  {!product.isLive && <span className="rounded-full bg-[#17022b] px-3 py-1 text-xs font-bold text-white">Propuesta</span>}
                </div>
                <span className="sr-only">Abrir ficha del producto</span>
              </button>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-heading text-2xl font-extrabold tracking-[-.04em]">{product.name}</h3>
                  <Heart className="mt-1 h-5 w-5 shrink-0 text-[#ff8069]" aria-hidden="true" />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#65566f]">{product.description}</p>
                {colorOptions.length > 0 && <fieldset className="mt-5"><legend className="text-sm font-semibold">Color: {chosen ? splitVariantLabel(chosen).colorName : 'elige una opción'}</legend><div className="mt-2 flex flex-wrap gap-2">{colorOptions.map((option) => { const active = chosen ? option.key === getColorOptions([chosen])[0]?.key : false; return <button key={option.key} type="button" title={option.name} aria-label={`${product.name}: color ${option.name}`} aria-pressed={active} onClick={() => { const selectedSize = chosen ? splitVariantLabel(chosen).sizeLabel : null; const matching = option.variants.find((item) => splitVariantLabel(item).sizeLabel === selectedSize) ?? option.variants[0]; setChosenVariants((current) => ({ ...current, [product.slug]: matching.id })); }} className={`flex h-11 w-11 items-center justify-center rounded-full border-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3c096c] ${active ? 'border-[#3c096c]' : 'border-transparent hover:border-[#e0beff]'}`}><span className="flex h-8 w-8 items-center justify-center rounded-full border border-black/15" style={{ background: option.hex }}>{active && <Check className="h-4 w-4" style={{ color: option.hex.toLowerCase() === '#3c096c' ? 'white' : '#17022b' }} />}</span></button>; })}</div></fieldset>}
                {chosen && splitVariantLabel(chosen).sizeLabel && <p className="mt-3 text-xs font-semibold text-[#65566f]">Talla seleccionada: {splitVariantLabel(chosen).sizeLabel} · elige otra en la ficha completa</p>}
                {!product.isLive && <p className="mt-4 text-xs font-semibold text-[#65566f]">Características propuestas</p>}
                <ul className="mt-3 space-y-2 text-sm text-[#4d4944]">
                  {(product.details.slice(0, 2)).map((detail) => <li key={detail} className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-[#ff8069]" /> {detail}</li>)}
                </ul>
                <div className="mt-6 border-t border-[#17022b]/10 pt-4">
                  <p className="text-xs font-bold uppercase tracking-[.12em] text-[#65566f]">{product.isLive ? 'Valor' : 'Precio de referencia'}</p>
                  <p className="mt-1 font-heading text-lg font-extrabold text-[#3c096c]">{`$${(cents / 100).toFixed(2)} USD`}</p>
                </div>
                <Button variant="outline" onClick={() => setDetailProduct(product)} className="mt-4 w-full border-[#3c096c]/20 text-[#3c096c] hover:bg-[#f1e2ff]"><Eye aria-hidden="true" /> Ver ficha completa</Button>
                {product.isLive ? (
                  <Button disabled={stock < 1} onClick={() => addProduct(product, chosen)} className="mt-3 w-full bg-[#17022b] text-white hover:bg-[#38332f]">
                    {stock < 1 ? 'Sin existencias' : added.includes(product.name) ? <><Check /> Pedido recibido</> : <><ShoppingBag /> Lo quiero</>}
                  </Button>
                ) : (
                  <Button asChild className="mt-5 w-full bg-[#17022b] text-white hover:bg-[#38332f]"><Link to="/contacto"><ShoppingBag /> Me interesa este diseño</Link></Button>
                )}
              </div>
            </motion.article>
          ); })}
          </AnimatePresence>
        </div>
      </section>

      <RefugeDogRibbon start={9} tone="dark" eyebrow="La causa detrás de cada objeto" title="Llevas el mensaje. Ellos reciben más oportunidades." description="Scooby, Tigresa, Yeri y sus compañeros son el rostro real de una tienda creada para sostener el cuidado." />

      <section className="bg-[#f1e2ff] px-5 py-16 sm:px-8 lg:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[.15em] text-[#3c096c]">Más que una compra</p>
            <h2 className="mt-3 font-heading text-4xl font-extrabold tracking-[-.05em]">Así cuidamos cada pedido.</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <div className="rounded-[1.5rem] bg-[#fffdf9] p-6"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f1e2ff] text-[#ff8069]"><Heart className="h-5 w-5 fill-current" /></span><h3 className="mt-5 font-heading text-xl font-bold">Propósito visible</h3><p className="mt-2 text-sm leading-relaxed text-[#65566f]">Tu compra ayuda a que más personas hablen de adopción responsable.</p></div>
            <div className="rounded-[1.5rem] bg-[#fffdf9] p-6"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f1e2ff] text-[#ff8069]"><PackageCheck className="h-5 w-5" /></span><h3 className="mt-5 font-heading text-xl font-bold">Detalles confirmados contigo</h3><p className="mt-2 text-sm leading-relaxed text-[#65566f]">Antes de avanzar, validamos disponibilidad y las características de tu producto.</p></div>
            <div className="rounded-[1.5rem] bg-[#fffdf9] p-6"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f1e2ff] text-[#ff8069]"><Truck className="h-5 w-5" /></span><h3 className="mt-5 font-heading text-xl font-bold">Envío con claridad</h3><p className="mt-2 text-sm leading-relaxed text-[#65566f]">Coordinamos contigo el envío y la forma de pago antes de confirmar el pedido.</p></div>
          </div>
        </div>
      </section>

      <ContextualFaq category="store" title="Tu pedido, con las cosas claras." />

      <section className="max-w-5xl mx-auto px-5 py-16 text-center sm:px-8 lg:py-20">
        <ShieldCheck className="mx-auto h-8 w-8 text-[#ff8069]" />
        <h2 className="mt-4 font-heading text-3xl font-extrabold tracking-[-.045em]">¿Quieres apoyar de otra manera?</h2>
        <p className="mx-auto mt-3 max-w-lg text-[#65566f]">Una donación directa también nos ayuda a cuidar, alimentar y acompañar a nuestros rescatados.</p>
        <Link to="/donaciones" className="mt-6 inline-flex items-center gap-2 font-bold text-[#ff8069] transition hover:text-[#c84130]">Haz una donación <ArrowRight className="h-4 w-4" /></Link>
      </section>

      <ProductDetailDialog
        product={detailProduct}
        variant={detailProduct ? detailProduct.variants.find((variant) => variant.id === chosenVariants[detailProduct.slug]) ?? detailProduct.variants[0] ?? null : null}
        onClose={() => setDetailProduct(null)}
        onSelectVariant={(variant) => {
          if (detailProduct) setChosenVariants((current) => ({ ...current, [detailProduct.slug]: variant.id }));
        }}
        onOrder={() => {
          if (detailProduct) addProduct(detailProduct, detailProduct.variants.find((variant) => variant.id === chosenVariants[detailProduct.slug]) ?? detailProduct.variants[0] ?? null);
        }}
      />

      {selectedProduct && (
        <AccessibleDialog open={!!selectedProduct} onClose={() => { if (!submitting) setSelectedProduct(null); }} title="Solicitar producto">
          <form onSubmit={submitOrder} className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-[1.75rem] bg-[#fffdf9] p-6 text-[#17022b] shadow-2xl sm:p-8">
            <div className="mb-2 flex justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#ff8069]">Tu pedido</p><h2 className="mt-1 font-heading text-2xl font-extrabold">{selectedProduct.name}</h2></div>
            </div>
            <div className="mb-5 grid grid-cols-[88px_1fr] gap-4 rounded-2xl bg-[#f1e2ff] p-3">
              <ResilientImage src={selectedProduct.image} alt={selectedProduct.name} className="h-24 w-full rounded-xl object-cover" />
              <div className="self-center"><p className="text-sm font-semibold text-[#ff8069]">{selectedProduct.price || 'Precio por confirmar'}</p><p className="mt-1 text-xs leading-relaxed text-[#65566f]">{selectedProduct.inventory ?? 0} unidades disponibles</p></div>
            </div>
            {selectedProduct.selectedVariantLabel && <p className="mb-3 text-sm font-semibold">Variante: {selectedProduct.selectedVariantLabel}</p>}
            <p className="mb-6 text-sm text-[#65566f]">El envío se cotiza aparte. Esta solicitud no realiza ningún cobro. Déjanos tus datos. El equipo recibirá el pedido en el panel para confirmar envío y forma de pago.</p>
            <div className="space-y-4">
              <div><Label htmlFor="order-quantity">Cantidad</Label><div className="mt-1 flex items-center justify-between rounded-xl border border-[#17022b]/15 bg-white p-2"><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1} className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f1e2ff] text-xl font-bold disabled:opacity-40" aria-label="Reducir cantidad">−</button><div className="text-center"><output id="order-quantity" className="font-heading text-xl font-extrabold">{quantity}</output><p className="text-[10px] uppercase tracking-[.12em] text-[#65566f]">unidades</p></div><button type="button" onClick={() => setQuantity((value) => Math.min(Math.min(20, selectedProduct.inventory ?? 20), value + 1))} disabled={quantity >= Math.min(20, selectedProduct.inventory ?? 20)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#17022b] text-xl font-bold text-white disabled:opacity-40" aria-label="Aumentar cantidad">+</button></div></div>
              <div><Label htmlFor="order-name">Nombre</Label><Input id="order-name" autoComplete="name" data-dialog-autofocus required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Tu nombre" /></div>
              <div><Label htmlFor="order-email">Correo</Label><Input id="order-email" autoComplete="email" required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="tu@email.com" /></div>
              <div><Label htmlFor="order-phone">WhatsApp</Label><Input id="order-phone" type="tel" autoComplete="tel" required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Tu número" /></div>
            </div>
            {selectedProduct.priceCents !== undefined && <div className="mt-5 flex items-center justify-between border-t border-[#17022b]/10 pt-4"><span className="text-sm text-[#65566f]">Total del producto</span><strong className="font-heading text-xl text-[#ff8069]">${((selectedProduct.priceCents * quantity) / 100).toFixed(2)} USD</strong></div>}
            <Button disabled={submitting} className="mt-5 w-full bg-[#3c096c] text-white hover:bg-[#17022b]" type="submit">{submitting ? 'Enviando…' : `Enviar pedido de ${quantity}`}</Button>
          </form>
        </AccessibleDialog>
      )}
    </div>
  );
}
