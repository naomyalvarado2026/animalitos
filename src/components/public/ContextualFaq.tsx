import { Link } from 'react-router-dom';
import { ArrowRight, MessageCircleHeart } from 'lucide-react';
import { useFaqs } from '@/hooks/useFaqs';
import { filterFaqItems, type FaqCategory } from '@/lib/faq';
import { FaqAccordion } from './FaqAccordion';

export function ContextualFaq({ category, title }: { category: FaqCategory; title: string }) {
  const { items, isPending, isError, refetch } = useFaqs();
  const relevant = filterFaqItems(items, '', category).slice(0, 3);
  // An explicitly empty category stays hidden: the editor controls publication.
  if (!isPending && !isError && !relevant.length) return null;
  return (
    <section className="border-y border-[var(--color-border)] bg-[var(--color-background)] px-5 py-16 text-[var(--color-foreground)] sm:px-8 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
        <div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[var(--color-primary)]"><MessageCircleHeart aria-hidden="true" className="h-5 w-5" /> Respuestas a mano</p><h2 className="mt-4 max-w-md font-heading text-3xl font-extrabold leading-tight tracking-[-.04em] sm:text-4xl">{title}</h2><Link to={`/faq?category=${category}`} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--color-primary)]">Explorar el centro de ayuda <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></div>
        {isPending ? <p role="status" className="py-6 text-sm text-[var(--color-muted-foreground)]">Cargando preguntas…</p> : isError ? <div role="alert" className="rounded-2xl border border-[var(--color-border)] p-6 text-sm"><p>No pudimos cargar las respuestas.</p><button type="button" onClick={() => void refetch()} className="mt-3 min-h-11 font-bold underline">Volver a intentar</button></div> : <FaqAccordion items={relevant} />}
      </div>
    </section>
  );
}
