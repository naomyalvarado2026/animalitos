import { motion } from 'motion/react';
import { Heart, Quote, Sparkles } from 'lucide-react';
import { ResilientImage } from '@/components/ui/ResilientImage';
import { assetUrl } from '@/lib/assets';

const TESTIMONIALS = [
  {
    author: 'Camila Morales',
    role: 'Voluntaria de Paseos · 8 meses en AdoptaME',
    dogName: 'Scooby',
    dogImage: '/images/refugio/scooby-garden-2026-10.jpg',
    text: 'Cuando llegué al refugio, Scooby temblaba cada vez que alguien le ponía la correa. Dediqué varias semanas solo a sentarme en el suelo con él a hablarle despacito. El día que salió al sendero moviendo la cola y volteó a mirarme con ojos de gratitud, entendí que el voluntariado cura tanto al perro como al humano.',
  },
  {
    author: 'Javier Restrepo',
    role: 'Hogar Temporal · 3 perritos acogidos',
    dogName: 'Cheesy',
    dogImage: '/images/refugio/cheesy-garden-2026-10.jpg',
    text: 'Recibir a Cheesy en casa mientras aprendía a caminar de nuevo tras su rehabilitación fue el mayor regalo para mi familia. Ver cómo pasaba de la fragilidad a correr alegre por la sala te enseña lo que de verdad importa. Ser hogar de paso salva vidas en tiempo récord.',
  },
  {
    author: 'Sofía Torres',
    role: 'Fotógrafa & Redes · 1 año colaborando',
    dogName: 'Noah',
    dogImage: '/images/refugio/noah-garden-2026-10.jpg',
    text: 'A veces la gente piensa que para ayudar necesitas dinero o medicina. Yo solo traje mi cámara un sábado al mes. Con retratos que mostraban la mirada dulce de Noah y sus compañeros, logramos que 4 familias viajaran para conocerlos y adoptarlos. La difusión cambia destinos.',
  },
];

export function VolunteerTestimonials() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#f0644a]/20 bg-[#f0644a]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-[.14em] text-[#f0644a]">
          <Sparkles className="h-3.5 w-3.5" /> Voces de la manada
        </div>
        <h2 className="mt-4 font-heading text-4xl font-extrabold tracking-[-.05em] text-[#171717] sm:text-5xl">
          Historias de quienes ya cambiaron un destino
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#6e6a64]">
          Cada sábado y domingo se tejen vínculos que marcan un antes y un después en la recuperación de nuestros perros.
        </p>
      </div>

      <div className="mt-14 grid gap-8 md:grid-cols-3">
        {TESTIMONIALS.map((item, index) => (
          <motion.article
            key={item.author}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="relative flex flex-col justify-between rounded-3xl border border-[#171717]/10 bg-white p-7 shadow-xs transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div>
              <Quote className="h-8 w-8 text-[#f0644a]/30" />
              <p className="mt-4 text-xs italic leading-relaxed text-[#4f4a45]">
                "{item.text}"
              </p>
            </div>

            <div className="mt-8 flex items-center gap-3 border-t border-[#171717]/10 pt-5">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-[#f0644a]/40 shadow-xs">
                <ResilientImage
                  src={assetUrl(item.dogImage)}
                  alt={`Compañero canino de ${item.author}: ${item.dogName}`}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-sm font-extrabold text-[#171717]">
                  {item.author}
                </p>
                <p className="truncate text-[11px] font-medium text-[#6e6a64]">
                  {item.role}
                </p>
                <p className="flex items-center gap-1 text-[10px] font-bold text-[#f0644a]">
                  <Heart className="h-2.5 w-2.5 fill-current" /> Acompañó a {item.dogName}
                </p>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
