import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Heart, ShoppingBag, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';

const PRODUCTS = [
  { name: 'Camiseta AdoptaME', type: 'Ropa solidaria', price: 'Consultar', image: '/images/hero.jpg', color: 'coral' },
  { name: 'Pañuelo “ME eligieron”', type: 'Para tu mejor amigo', price: 'Consultar', image: '/images/dog_max.jpg', color: 'yellow' },
  { name: 'Tote bag AdoptaME', type: 'Uso diario', price: 'Consultar', image: '/images/shelter_hero_1785817115197.jpg', color: 'cream' },
];

export function StorePage() {
  const [added, setAdded] = useState<string[]>([]);
  const [pending, setPending] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<typeof PRODUCTS[number] | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const addProduct = (product: typeof PRODUCTS[number]) => setSelectedProduct(product);
  const submitOrder = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedProduct || !form.name || !form.email || !form.phone) return;
    setSubmitting(true);
    const message = `Pedido de merchandising: ${selectedProduct.name} (${selectedProduct.price}). WhatsApp: ${form.phone}. Contactar para confirmar talla, envío y pago.`;
    const { error } = await supabase.from('contact_messages').insert([{ name: form.name, email: form.email, subject: `Pedido tienda · ${selectedProduct.name}`, message, type: 'support' }]);
    setSubmitting(false);
    if (error) {
      const pending = JSON.parse(localStorage.getItem('adoptame_pending_orders') ?? '[]');
      localStorage.setItem('adoptame_pending_orders', JSON.stringify([...pending, { ...form, product: selectedProduct.name, created_at: new Date().toISOString() }]));
      toast.info('Pedido guardado en este dispositivo. Activa la base de datos para recibirlo en el panel.');
      setAdded((items) => items.includes(selectedProduct.name) ? items : [...items, selectedProduct.name]);
      setPending((items) => items.includes(selectedProduct.name) ? items : [...items, selectedProduct.name]);
      setSelectedProduct(null);
      setForm({ name: '', email: '', phone: '' });
      return;
    }
    setAdded((items) => items.includes(selectedProduct.name) ? items : [...items, selectedProduct.name]);
    toast.success('¡Pedido recibido! Te contactaremos para coordinar los detalles. 🐾');
    setSelectedProduct(null);
    setForm({ name: '', email: '', phone: '' });
  };

  return (
    <div className="pt-8">
      <section className="bg-[#171717] text-[#fffdf9] py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 grid lg:grid-cols-[1fr_.8fr] gap-10 items-end">
          <div><p className="text-[#ff9a62] uppercase tracking-[.16em] text-sm font-bold">Tienda solidaria</p><h1 className="font-heading text-5xl sm:text-7xl leading-none tracking-[-.06em] font-extrabold mt-4">Lleva un <span className="text-[#f0644a]">ME</span> contigo.</h1><p className="text-white/70 text-lg max-w-xl leading-relaxed mt-6">Productos bonitos con un propósito enorme: cada compra se convierte en alimento, vacunas y oportunidades para nuestros perros.</p></div>
          <div className="rounded-[2rem] bg-[#f0644a] p-7 lg:p-9"><Sparkles className="h-8 w-8" /><p className="font-heading text-3xl font-extrabold mt-14">Compra con propósito.</p><p className="mt-3 text-white/80">Diseños que cuentan que adoptar cambia dos vidas.</p></div>
        </div>
      </section>

      <section className="py-20 max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10"><div><p className="text-[#f0644a] uppercase tracking-[.15em] font-bold text-sm">Colección 01</p><h2 className="font-heading text-4xl font-extrabold tracking-[-.05em] mt-2">Hecho para hablar de adopción.</h2></div><p className="text-[#6e6a64] text-sm max-w-xs">Envíos y tallas se coordinan contigo después de tu pedido.</p></div>
        <div className="grid md:grid-cols-3 gap-7">{PRODUCTS.map((product) => <article key={product.name} className="group"><div className={`relative rounded-[1.5rem] overflow-hidden aspect-square ${product.color === 'coral' ? 'bg-[#f0644a]' : product.color === 'yellow' ? 'bg-[#ffcf5a]' : 'bg-[#ede5da]'}`}><img src={product.image} alt={product.name} loading="lazy" decoding="async" className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-500" /><div className="absolute top-4 left-4 rounded-full bg-[#fffdf9] px-3 py-1 text-xs font-bold text-[#171717]">AdoptaME</div></div><div className="pt-4"><div className="flex justify-between gap-3"><div><p className="font-heading text-xl font-bold">{product.name}</p><p className="text-sm text-[#6e6a64] mt-1">{product.type}</p></div><span className="font-bold text-[#f0644a]">{product.price}</span></div><Button onClick={() => addProduct(product)} className="mt-4 w-full bg-[#171717] hover:bg-[#333] text-white" variant="default">{pending.includes(product.name) ? <><Check /> Pendiente de sincronizar</> : added.includes(product.name) ? <><Check /> Pedido recibido</> : <><ShoppingBag /> Lo quiero</>}</Button></div></article>)}</div>
      </section>

      <section className="bg-[#ede5da] py-16"><div className="max-w-5xl mx-auto px-5 sm:px-8 grid sm:grid-cols-3 gap-8 text-center"><div><div className="mx-auto w-11 h-11 rounded-full bg-[#fffdf9] flex items-center justify-center text-[#f0644a]"><Heart className="fill-current h-5 w-5" /></div><h3 className="font-heading font-bold mt-4">Compra con causa</h3><p className="text-sm text-[#6e6a64] mt-2">Publicaremos el destino de cada venta cuando estén definidos los costos reales.</p></div><div><div className="mx-auto w-11 h-11 rounded-full bg-[#fffdf9] flex items-center justify-center text-[#f0644a] font-bold">2</div><h3 className="font-heading font-bold mt-4">Recibe confirmación</h3><p className="text-sm text-[#6e6a64] mt-2">Te escribimos para confirmar talla, envío y pago.</p></div><div><div className="mx-auto w-11 h-11 rounded-full bg-[#fffdf9] flex items-center justify-center text-[#f0644a]"><Sparkles className="h-5 w-5" /></div><h3 className="font-heading font-bold mt-4">Comparte el mensaje</h3><p className="text-sm text-[#6e6a64] mt-2">Cada producto abre una conversación sobre adopción.</p></div></div></section>
      <section className="py-16 text-center"><p className="text-[#6e6a64]">¿Prefieres apoyar directamente?</p><Link to="/donaciones" className="inline-flex items-center gap-2 mt-3 font-bold text-[#f0644a]">Haz una donación <ArrowRight className="h-4 w-4" /></Link></section>

      {selectedProduct && <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Solicitar producto"><form onSubmit={submitOrder} className="bg-[#fffdf9] text-[#171717] rounded-[1.5rem] p-6 sm:p-8 max-w-md w-full shadow-2xl"><div className="flex justify-between gap-4 mb-2"><div><p className="text-xs uppercase tracking-[.14em] font-bold text-[#f0644a]">Tu pedido</p><h2 className="font-heading text-2xl font-extrabold mt-1">{selectedProduct.name}</h2></div><button type="button" onClick={() => setSelectedProduct(null)} className="text-[#6e6a64] text-xl" aria-label="Cerrar">×</button></div><p className="text-sm text-[#6e6a64] mb-6">Déjanos tus datos y te escribiremos para confirmar talla, envío y forma de pago.</p><div className="space-y-4"><div><Label htmlFor="order-name">Nombre</Label><Input id="order-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tu nombre" /></div><div><Label htmlFor="order-email">Correo</Label><Input id="order-email" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="tu@email.com" /></div><div><Label htmlFor="order-phone">WhatsApp</Label><Input id="order-phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Tu número" /></div></div><Button disabled={submitting} className="w-full mt-6 bg-[#f0644a] hover:bg-[#e94f3a] text-white" type="submit">{submitting ? 'Enviando…' : 'Enviar pedido'}</Button></form></div>}
    </div>
  );
}
