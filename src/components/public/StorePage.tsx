import { useEffect, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Heart,
  PackageCheck,
  PawPrint,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResilientImage } from '@/components/ui/ResilientImage';
import { supabase } from '@/lib/supabase';
import { assetUrl } from '@/lib/assets';
import { ContextualFaq } from './ContextualFaq';
import { RefugeDogRibbon } from './RefugeDogRibbon';

const PRODUCTS = [
  {
    slug: 'camiseta-adoptame',
    name: 'Camiseta AdoptaME',
    category: 'Ropa solidaria',
    description: 'Una prenda para llevar la conversación sobre adopción a todas partes.',
    details: ['Tallas por confirmar', 'Edición solidaria'],
    image: assetUrl('/images/hero.jpg'),
    color: 'coral',
    featured: true,
    isLive: false,
  },
  {
    slug: 'panuelo-me-eligieron',
    name: 'Pañuelo “ME eligieron”',
    category: 'Para tu mejor amigo',
    description: 'Un detalle especial para celebrar la conexión que cambia dos vidas.',
    details: ['Medidas por confirmar', 'Para compartir el mensaje'],
    image: assetUrl('/images/dog_max.jpg'),
    color: 'yellow',
    featured: false,
    isLive: false,
  },
  {
    slug: 'tote-bag-adoptame',
    name: 'Tote bag AdoptaME',
    category: 'Uso diario',
    description: 'Tu aliado cotidiano para que la causa viaje contigo cada día.',
    details: ['Disponibilidad por confirmar', 'Compra con propósito'],
    image: assetUrl('/images/shelter_hero_1785817115197.jpg'),
    color: 'cream',
    featured: false,
    isLive: false,
  },
] as const;

type Product = {
  slug: string;
  name: string;
  category: string;
  description: string;
  details: readonly string[];
  image: string;
  color: keyof typeof productBackground;
  featured: boolean;
  isLive: boolean;
  price?: string;
  priceCents?: number;
  inventory?: number;
};

type DatabaseProduct = Product;

const productBackground = {
  coral: 'bg-[#f0644a]',
  yellow: 'bg-[#ffcf5a]',
  cream: 'bg-[#ede5da]',
} as const;

export function StorePage() {
  const [added, setAdded] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState('Todo');
  const [quantity, setQuantity] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const productsQuery = useQuery({
    queryKey: ['public-store-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('slug, name, description, price_cents, image_url, inventory').eq('is_active', true).eq('currency', 'USD').gt('inventory', 0).order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((product) => ({ ...product, category: 'Catálogo', details: [`${product.inventory ?? 0} disponibles`, 'Compra con propósito'], image: product.image_url || assetUrl('/images/hero.jpg'), color: 'cream' as const, featured: false, isLive: true, priceCents: product.price_cents ?? 0, price: `$${(((product.price_cents ?? 0) / 100)).toFixed(2)} USD` })) as DatabaseProduct[];
    },
  });
  const databaseProducts = productsQuery.data ?? [];
  const catalog: Product[] = databaseProducts.length > 0 ? databaseProducts : PRODUCTS.map((product) => product);
  const categories = Array.from(new Set(['Todo', ...catalog.map((product) => product.category)]));
  const products = activeCategory === 'Todo' ? catalog : catalog.filter((product) => product.category === activeCategory);

  const addProduct = (product: Product) => { if (!product.isLive) { toast.info('Este artículo está en preparación. Escríbenos para conocer disponibilidad.'); return; } setQuantity(1); setSelectedProduct(product); };

  useEffect(() => {
    if (!selectedProduct) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelectedProduct(null); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedProduct]);

  const submitOrder = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedProduct || !form.name || !form.email || !form.phone) return;

    setSubmitting(true);
    const { error } = await supabase.rpc('create_merchandise_order', {
      p_customer_name: form.name,
      p_customer_email: form.email,
      p_customer_phone: form.phone,
      p_product_slug: selectedProduct.slug,
      p_quantity: quantity,
      p_idempotency_key: crypto.randomUUID(),
    });
    setSubmitting(false);

    if (error) {
      toast.error('No pudimos enviar tu pedido. Intenta nuevamente en unos minutos.');
      return;
    }

    setAdded((items) => items.includes(selectedProduct.name) ? items : [...items, selectedProduct.name]);
    toast.success('¡Pedido recibido! Te contactaremos para coordinar los detalles. 🐾');
    void productsQuery.refetch();
    setSelectedProduct(null);
    setQuantity(1);
    setForm({ name: '', email: '', phone: '' });
  };

  return (
    <div className="overflow-hidden bg-[#fffdf9] pt-16 text-[#171717]">
      <section className="relative isolate bg-[#171717] text-[#fffdf9]">
        <ResilientImage
          src={assetUrl('/images/shelter_hero_1785817115197.jpg')}
          alt="Perro rescatado de AdoptaME"
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-25"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#171717] via-[#171717]/95 to-[#171717]/55" />
        <div className="max-w-7xl mx-auto px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="grid items-end gap-10 lg:grid-cols-[1.25fr_.75fr]">
            <div className="max-w-3xl">
              <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[.16em] text-[#ffad7f]">
                <Sparkles className="h-4 w-4" /> Tienda solidaria
              </p>
              <h1 className="mt-5 font-heading text-5xl font-extrabold leading-[.9] tracking-[-.065em] sm:text-7xl lg:text-8xl">
                Lleva un <span className="text-[#f0644a]">ME</span> contigo.
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
            <aside className="rounded-[2rem] border border-white/15 bg-[#f0644a] p-7 shadow-2xl shadow-black/20 lg:p-9">
              <PawPrint className="h-8 w-8" />
              <p className="mt-16 font-heading text-3xl font-extrabold leading-none tracking-[-.04em]">Una compra, una señal de esperanza.</p>
              <p className="mt-4 leading-relaxed text-white/85">Te contactamos antes de finalizar los detalles de tu pedido: disponibilidad, envío y pago.</p>
            </aside>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="grid gap-8 border-b border-[#171717]/10 pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[.15em] text-[#f0644a]">Colección AdoptaME</p>
            <h2 className="mt-3 font-heading text-4xl font-extrabold tracking-[-.055em] sm:text-5xl">Pequeños objetos. Un mensaje enorme.</h2>
            <p className="mt-4 leading-relaxed text-[#6e6a64]">Explora la colección y elige la pieza que mejor lleva la causa contigo. Los detalles finales se confirman contigo de forma personal.</p>
          </div>
          <p className="rounded-2xl bg-[#fff2e9] px-5 py-4 text-sm leading-relaxed text-[#9e3b2b] lg:max-w-xs">
            <span className="block font-bold">Precios transparentes</span>
            {databaseProducts.length ? 'Precios publicados en USD' : 'Catálogo inicial en preparación'}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-2" aria-label="Categorías de productos">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              aria-pressed={activeCategory === category}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${activeCategory === category ? 'bg-[#171717] text-white' : 'border border-[#171717]/15 bg-white text-[#5f5a54] hover:border-[#f0644a] hover:text-[#f0644a]'}`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <article key={product.slug} className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-[#171717]/10 bg-white shadow-[0_12px_35px_rgba(23,23,23,.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(23,23,23,.12)]">
              <div className={`relative aspect-[4/3] overflow-hidden ${productBackground[product.color]}`}>
                <ResilientImage src={product.image} alt={product.name} loading="lazy" decoding="async" className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                <div className="absolute left-4 top-4 flex gap-2">
                  <span className="rounded-full bg-[#fffdf9] px-3 py-1 text-xs font-bold text-[#171717]">{product.category}</span>
                  {product.featured && <span className="rounded-full bg-[#171717] px-3 py-1 text-xs font-bold text-white">Destacado</span>}
                </div>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-heading text-2xl font-extrabold tracking-[-.04em]">{product.name}</h3>
                  <Heart className="mt-1 h-5 w-5 shrink-0 text-[#f0644a]" aria-hidden="true" />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#6e6a64]">{product.description}</p>
                <ul className="mt-5 space-y-2 text-sm text-[#4d4944]">
                  {(product.details || []).map((detail) => <li key={detail} className="flex items-center gap-2"><Check className="h-4 w-4 text-[#f0644a]" /> {detail}</li>)}
                </ul>
                <div className="mt-6 border-t border-[#171717]/10 pt-4">
                  <p className="text-xs font-bold uppercase tracking-[.12em] text-[#6e6a64]">Valor</p>
                  <p className="mt-1 font-heading text-lg font-extrabold text-[#f0644a]">{product.price || 'Precio en USD por confirmar'}</p>
                </div>
                {product.isLive ? (
                  <Button onClick={() => addProduct(product)} className="mt-5 w-full bg-[#171717] text-white hover:bg-[#38332f]">
                    {added.includes(product.name) ? <><Check /> Pedido recibido</> : <><ShoppingBag /> Lo quiero</>}
                  </Button>
                ) : (
                  <Button asChild className="mt-5 w-full bg-[#171717] text-white hover:bg-[#38332f]"><Link to="/contacto"><ShoppingBag /> Consultar disponibilidad</Link></Button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <RefugeDogRibbon start={9} tone="dark" eyebrow="La causa detrás de cada objeto" title="Llevas el mensaje. Ellos reciben más oportunidades." description="Scooby, Tigresa, Yeri y sus compañeros son el rostro real de una tienda creada para sostener el cuidado." />

      <section className="bg-[#ede5da] px-5 py-16 sm:px-8 lg:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[.15em] text-[#f0644a]">Más que una compra</p>
            <h2 className="mt-3 font-heading text-4xl font-extrabold tracking-[-.05em]">Así cuidamos cada pedido.</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <div className="rounded-[1.5rem] bg-[#fffdf9] p-6"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff2e9] text-[#f0644a]"><Heart className="h-5 w-5 fill-current" /></span><h3 className="mt-5 font-heading text-xl font-bold">Propósito visible</h3><p className="mt-2 text-sm leading-relaxed text-[#6e6a64]">Tu compra ayuda a que más personas hablen de adopción responsable.</p></div>
            <div className="rounded-[1.5rem] bg-[#fffdf9] p-6"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff2e9] text-[#f0644a]"><PackageCheck className="h-5 w-5" /></span><h3 className="mt-5 font-heading text-xl font-bold">Detalles confirmados contigo</h3><p className="mt-2 text-sm leading-relaxed text-[#6e6a64]">Antes de avanzar, validamos disponibilidad y las características de tu producto.</p></div>
            <div className="rounded-[1.5rem] bg-[#fffdf9] p-6"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff2e9] text-[#f0644a]"><Truck className="h-5 w-5" /></span><h3 className="mt-5 font-heading text-xl font-bold">Envío con claridad</h3><p className="mt-2 text-sm leading-relaxed text-[#6e6a64]">Coordinamos contigo el envío y la forma de pago antes de confirmar el pedido.</p></div>
          </div>
        </div>
      </section>

      <ContextualFaq category="store" title="Tu pedido, con las cosas claras." />

      <section className="max-w-5xl mx-auto px-5 py-16 text-center sm:px-8 lg:py-20">
        <ShieldCheck className="mx-auto h-8 w-8 text-[#f0644a]" />
        <h2 className="mt-4 font-heading text-3xl font-extrabold tracking-[-.045em]">¿Quieres apoyar de otra manera?</h2>
        <p className="mx-auto mt-3 max-w-lg text-[#6e6a64]">Una donación directa también nos ayuda a cuidar, alimentar y acompañar a nuestros rescatados.</p>
        <Link to="/donaciones" className="mt-6 inline-flex items-center gap-2 font-bold text-[#f0644a] transition hover:text-[#c84130]">Haz una donación <ArrowRight className="h-4 w-4" /></Link>
      </section>

      {selectedProduct && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Solicitar producto" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelectedProduct(null); }}>
          <form onSubmit={submitOrder} className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-[1.75rem] bg-[#fffdf9] p-6 text-[#171717] shadow-2xl sm:p-8">
            <div className="mb-2 flex justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#f0644a]">Tu pedido</p><h2 className="mt-1 font-heading text-2xl font-extrabold">{selectedProduct.name}</h2></div>
              <button type="button" onClick={() => setSelectedProduct(null)} className="text-xl text-[#6e6a64]" aria-label="Cerrar">×</button>
            </div>
            <div className="mb-5 grid grid-cols-[88px_1fr] gap-4 rounded-2xl bg-[#ede5da] p-3">
              <ResilientImage src={selectedProduct.image} alt={selectedProduct.name} className="h-24 w-full rounded-xl object-cover" />
              <div className="self-center"><p className="text-sm font-semibold text-[#f0644a]">{selectedProduct.price || 'Precio por confirmar'}</p><p className="mt-1 text-xs leading-relaxed text-[#6e6a64]">{selectedProduct.inventory ?? 0} unidades disponibles</p></div>
            </div>
            <p className="mb-6 text-sm text-[#6e6a64]">Déjanos tus datos. El equipo recibirá el pedido en el panel para confirmar envío y forma de pago.</p>
            <div className="space-y-4">
              <div><Label htmlFor="order-quantity">Cantidad</Label><div className="mt-1 flex items-center justify-between rounded-xl border border-[#171717]/15 bg-white p-2"><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1} className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ede5da] text-xl font-bold disabled:opacity-40" aria-label="Reducir cantidad">−</button><div className="text-center"><output id="order-quantity" className="font-heading text-xl font-extrabold">{quantity}</output><p className="text-[10px] uppercase tracking-[.12em] text-[#6e6a64]">unidades</p></div><button type="button" onClick={() => setQuantity((value) => Math.min(Math.min(20, selectedProduct.inventory ?? 20), value + 1))} disabled={quantity >= Math.min(20, selectedProduct.inventory ?? 20)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#171717] text-xl font-bold text-white disabled:opacity-40" aria-label="Aumentar cantidad">+</button></div></div>
              <div><Label htmlFor="order-name">Nombre</Label><Input id="order-name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Tu nombre" /></div>
              <div><Label htmlFor="order-email">Correo</Label><Input id="order-email" required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="tu@email.com" /></div>
              <div><Label htmlFor="order-phone">WhatsApp</Label><Input id="order-phone" required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Tu número" /></div>
            </div>
            {selectedProduct.priceCents !== undefined && <div className="mt-5 flex items-center justify-between border-t border-[#171717]/10 pt-4"><span className="text-sm text-[#6e6a64]">Total del producto</span><strong className="font-heading text-xl text-[#f0644a]">${((selectedProduct.priceCents * quantity) / 100).toFixed(2)} USD</strong></div>}
            <Button disabled={submitting} className="mt-5 w-full bg-[#f0644a] text-white hover:bg-[#e94f3a]" type="submit">{submitting ? 'Enviando…' : `Enviar pedido de ${quantity}`}</Button>
          </form>
        </div>
      )}
    </div>
  );
}
