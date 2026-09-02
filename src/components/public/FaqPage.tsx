import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowUpRight, MessageCircleHeart, Search } from 'lucide-react';
import { useFaqs } from '@/hooks/useFaqs';
import { FAQ_CATEGORIES, filterFaqItems, isFaqCategory } from '@/lib/faq';
import { EmptyState } from '@/components/ui/EmptyState';
import { FaqAccordion } from './FaqAccordion';

export function FaqPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const categoryParam = params.get('category');
  const category = isFaqCategory(categoryParam) ? categoryParam : undefined;
  const faqs = useFaqs();
  const filtered = filterFaqItems(faqs.items, query, category);
  const updateFilter = (key: string, value: string) => setParams((previous) => { const next = new URLSearchParams(previous); if (value) next.set(key, value); else next.delete(key); return next; }, { replace: true });

  return (
    <div className="bg-[var(--color-background)] pt-16 text-[var(--color-foreground)]">
      <Helmet><title>Centro de ayuda | AdoptaME</title></Helmet>
      <section className="bg-[#171717] px-5 py-16 text-white sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
          <div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#ff9b87]"><MessageCircleHeart aria-hidden="true" className="h-5 w-5" /> Centro de ayuda</p><h1 className="mt-5 font-heading text-5xl font-extrabold leading-[.95] tracking-[-.06em] sm:text-7xl">Menos dudas.<br /><span className="text-[#f0644a]">Más confianza.</span></h1><p className="mt-6 max-w-xl text-lg leading-relaxed text-white/65">Todo empieza con una buena pregunta. Encuentra orientación para adoptar, ayudar, visitar o hacer un pedido.</p></div>
          <Link to="/contacto" className="group rounded-[1.75rem] bg-[#ffcf5a] p-6 text-[#171717]"><ArrowUpRight aria-hidden="true" className="ml-auto h-6 w-6" /><p className="mt-9 font-heading text-2xl font-extrabold">¿Tu caso es diferente?</p><p className="mt-2 text-sm leading-relaxed">Habla con el equipo. Hay preguntas que merecen una conversación.</p></Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:py-16" aria-label="Buscar respuestas">
        <label htmlFor="faq-search" className="mb-2 block text-sm font-bold">Busca una pregunta o un tema</label>
        <div className="relative"><Search aria-hidden="true" className="absolute left-4 top-4 h-5 w-5 text-[var(--color-primary)]" /><input id="faq-search" type="search" value={query} maxLength={300} onChange={(event) => updateFilter('q', event.target.value)} placeholder="Prueba con solicitud, envío o visita…" className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] pl-12 pr-4 text-base" /></div>
        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Temas de ayuda">
          <button type="button" aria-pressed={!category} onClick={() => updateFilter('category', '')} className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${!category ? 'border-[#171717] bg-[#171717] text-white' : 'border-[var(--color-border)] bg-[var(--color-card)]'}`}>Todos</button>
          {Object.entries(FAQ_CATEGORIES).map(([key, label]) => <button key={key} type="button" aria-pressed={category === key} onClick={() => updateFilter('category', key)} className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition ${category === key ? 'border-[#171717] bg-[#171717] text-white' : 'border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-primary)]'}`}>{label}</button>)}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[.35fr_1fr]">
          <div><p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--color-primary)]">Respuestas publicadas</p><h2 className="mt-3 font-heading text-2xl font-extrabold">{category ? FAQ_CATEGORIES[category] : 'Todas las preguntas'}</h2><p className="mt-2 text-sm text-[var(--color-muted-foreground)]" role="status" aria-live="polite" aria-atomic="true">{faqs.isPending ? 'Cargando…' : faqs.isError ? 'No disponibles temporalmente' : `${filtered.length} ${filtered.length === 1 ? 'respuesta' : 'respuestas'}`}</p></div>
          <div>
            {faqs.isPending ? <div className="rounded-2xl bg-[var(--color-card)] p-8 text-sm" role="status">Cargando el centro de ayuda…</div> : faqs.isError ? <EmptyState title="No pudimos cargar las respuestas" description="Puedes volver a intentar o comunicarte directamente con el refugio." action={<><button type="button" onClick={() => void faqs.refetch()} className="min-h-11 rounded-xl border border-[var(--color-border)] px-4 text-sm font-bold">Reintentar</button><Link to="/contacto" className="px-4 py-3 text-sm font-bold underline">Contacto</Link></>} /> : filtered.length ? <FaqAccordion key={`${category}-${query}`} items={filtered} openFirst={Boolean(query)} /> : <EmptyState title="No hay respuestas para estos filtros" description="Cambia el tema, prueba otras palabras o cuéntale tu duda al equipo." action={<><button type="button" onClick={() => setParams({}, { replace: true })} className="min-h-11 rounded-xl border border-[var(--color-border)] px-4 text-sm font-bold">Limpiar filtros</button><Link to="/contacto" className="rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-bold text-[var(--color-primary-foreground)]">Preguntar al equipo</Link></>} />}
          </div>
        </div>
      </section>
    </div>
  );
}
