import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Heart, PawPrint, ShoppingBag, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORIES = [
  { name: 'Max', detail: '2 años · Grande', image: '/images/dog_max.jpg', text: 'me encanta correr, jugar y estar cerca de las personas.' },
  { name: 'Toby', detail: '8 meses · Mediano', image: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&q=80&w=800', text: 'soy curioso, aprendo rápido y busco una familia paciente.' },
  { name: 'Bella', detail: '3 años · Grande', image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=800', text: 'soy noble, tranquila y sueño con compartir paseos.' },
];

const IMPACT = [
  { value: '1.240+', label: 'perritos rescatados' },
  { value: '890+', label: 'historias con final feliz' },
  { value: '100%', label: 'adopción responsable' },
];

export function HomePage() {
  return (
    <div className="overflow-hidden">
      <section className="relative bg-[#171717] text-[#fffdf9] pt-20 pb-14 lg:pt-24 lg:pb-24">
        <div className="absolute right-0 top-0 h-full w-1/2 bg-[#f0644a] hidden lg:block" />
        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 grid lg:grid-cols-[1.05fr_.95fr] gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-[#ff9a62] mb-7"><PawPrint className="h-4 w-4" /> Rescate · cuidado · adopción</div>
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-[5.2rem] leading-[.98] tracking-[-.06em] font-extrabold max-w-2xl">Una familia puede <span className="text-[#f0644a]">cambiarlo todo.</span></h1>
            <p className="mt-7 text-lg text-white/70 max-w-xl leading-relaxed">En AdoptaME rescatamos perros, les devolvemos la confianza y encontramos el hogar donde puedan ser ellos mismos.</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-9"><Button size="xl" className="bg-[#f0644a] hover:bg-[#ff8069] text-white" asChild><Link to="/adopta">Conoce a los perritos <ArrowRight /></Link></Button><Button size="xl" variant="ghost" className="text-white border border-white/20 hover:bg-white/10" asChild><Link to="/donaciones">Quiero ayudar</Link></Button></div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .7, delay: .12 }} className="relative lg:translate-x-8">
            <div className="relative rounded-[2rem] overflow-hidden border-[10px] border-[#fffdf9]/10 shadow-2xl rotate-[1.5deg]"><img src="/images/dog_max.jpg" alt="Max, un perro rescatado de AdoptaME" className="w-full aspect-[4/5] object-cover" /><div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-[#fffdf9] text-[#171717] p-4 flex items-center justify-between"><div><p className="text-xs text-[#6e6a64]">Conoce a</p><p className="font-heading text-xl font-bold">Max</p></div><span className="text-[#f0644a] font-bold text-sm">Adóptame <span className="text-xl">→</span></span></div></div>
            <div className="absolute -bottom-5 -left-5 bg-[#ffcf5a] text-[#171717] px-4 py-3 rounded-2xl font-heading font-bold text-sm -rotate-6 shadow-lg">Tu mejor amigo<br />te está esperando</div>
          </motion.div>
        </div>
      </section>

      <section className="bg-[#f0644a] text-white py-7"><div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 grid grid-cols-1 sm:grid-cols-3 gap-5">{IMPACT.map((item) => <div key={item.label} className="flex sm:block items-baseline gap-3 sm:text-center"><span className="font-heading text-3xl font-extrabold">{item.value}</span><span className="text-sm text-white/80">{item.label}</span></div>)}</div></section>

      <section className="py-20 lg:py-28 max-w-7xl mx-auto px-5 sm:px-8 lg:px-10"><div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-10"><div><p className="text-[#f0644a] font-bold text-sm uppercase tracking-[.15em]">Historias que empiezan aquí</p><h2 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-[-.05em] mt-3">Ellos tienen algo que decirte.</h2></div><Link to="/adopta" className="font-bold text-[#f0644a] inline-flex items-center gap-2">Ver todos los perritos <ArrowRight className="h-4 w-4" /></Link></div><div className="grid md:grid-cols-3 gap-6">{STORIES.map((dog, i) => <motion.article key={dog.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .08 }} className="group"><Link to="/adopta" className="block"><div className="rounded-[1.5rem] overflow-hidden bg-[#ede5da] aspect-[4/4.6]"><img src={dog.image} alt={`${dog.name}, perrito en adopción`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div><div className="pt-4"><div className="flex items-center justify-between"><h3 className="font-heading text-2xl font-extrabold">{dog.name}</h3><span className="text-xs text-[#6e6a64]">{dog.detail}</span></div><p className="mt-2 text-[#6e6a64] leading-relaxed"><span className="text-[#f0644a] font-extrabold">ME</span> llamo {dog.name}, {dog.text}</p></div></Link></motion.article>)}</div></section>

      <section className="bg-[#ede5da] py-20"><div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 grid lg:grid-cols-[.9fr_1.1fr] gap-12 items-center"><div><div className="w-12 h-12 rounded-2xl bg-[#f0644a] text-white flex items-center justify-center mb-6"><Heart className="fill-current" /></div><p className="text-[#f0644a] font-bold text-sm uppercase tracking-[.15em]">Más que una compra</p><h2 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-[-.05em] mt-3">Lleva la causa contigo.</h2><p className="mt-5 text-[#6e6a64] leading-relaxed max-w-lg">Cada pieza de nuestra tienda solidaria ayuda a pagar alimento, vacunas y tratamientos. Viste la historia de un rescate.</p><Button className="mt-7 bg-[#171717] hover:bg-[#333] text-white" size="lg" asChild><Link to="/tienda"><ShoppingBag /> Explorar tienda</Link></Button></div><div className="grid grid-cols-2 gap-4"><div className="bg-[#f0644a] rounded-[1.5rem] p-5 text-white min-h-48 flex flex-col justify-between"><Sparkles className="h-7 w-7" /><span className="font-heading text-2xl font-extrabold">Adopta<br />la actitud</span></div><div className="bg-[#ffcf5a] rounded-[1.5rem] p-5 text-[#171717] min-h-48 flex flex-col justify-end"><span className="text-4xl">🐾</span><span className="font-heading text-2xl font-extrabold mt-3">100% para<br />ellos</span></div></div></div></section>

      <section className="py-20 max-w-6xl mx-auto px-5 sm:px-8 text-center"><ShieldCheck className="h-9 w-9 text-[#f0644a] mx-auto" /><h2 className="font-heading text-3xl sm:text-4xl font-extrabold mt-4">Adoptar es un compromiso para toda la vida.</h2><p className="mt-4 text-[#6e6a64] max-w-2xl mx-auto leading-relaxed">Te acompañamos antes, durante y después de la adopción para que la llegada de tu nuevo mejor amigo sea una historia feliz para ambos.</p><Link to="/faq" className="inline-flex items-center gap-2 mt-6 text-[#f0644a] font-bold">Conoce el proceso <ArrowRight className="h-4 w-4" /></Link></section>
    </div>
  );
}
