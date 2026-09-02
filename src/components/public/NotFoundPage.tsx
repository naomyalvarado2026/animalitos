import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, PawPrint } from 'lucide-react';
import { SiteSearchTrigger } from '@/components/layout/SiteSearch';

export function NotFoundPage() {
  return (
    <section className="bg-[var(--color-background)] px-5 pb-20 pt-32 text-[var(--color-foreground)] sm:px-8">
      <Helmet><title>Página no encontrada | AdoptaME</title><meta name="robots" content="noindex" /></Helmet>
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-[#171717] p-7 text-white sm:p-12">
        <div className="flex items-center gap-3 text-[#ff9b87]"><PawPrint aria-hidden="true" className="h-6 w-6" /><span className="text-xs font-bold uppercase tracking-[.18em]">Nos salimos del camino · 404</span></div>
        <h1 className="mt-10 max-w-3xl font-heading text-5xl font-extrabold leading-[.96] tracking-[-.06em] sm:text-7xl">Esta huella no lleva a una página.</h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">El enlace puede haber cambiado o estar incompleto. Te ayudamos a encontrar el camino sin perder tu lugar.</p>
        <div className="mt-8 flex flex-wrap gap-3"><Link to="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#f0644a] px-5 py-3 font-bold">Volver al inicio <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link><SiteSearchTrigger expanded /></div>
      </div>
      <div className="mx-auto mt-6 grid max-w-5xl gap-3 sm:grid-cols-3">{[{ href: '/adopta', title: 'Quiero adoptar' }, { href: '/voluntariado', title: 'Quiero ayudar' }, { href: '/contacto', title: 'Necesito contactar' }].map((item) => <Link key={item.href} to={item.href} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 font-bold hover:border-[var(--color-primary)]">{item.title}<ArrowRight aria-hidden="true" className="h-4 w-4 text-[var(--color-primary)]" /></Link>)}</div>
    </section>
  );
}
