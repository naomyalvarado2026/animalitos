import { Link } from 'react-router-dom';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { useCampaigns, campaignPeriod } from '@/lib/campaigns';
import { assetUrl } from '@/lib/assets';
export function CampaignsSection({ compact = false }: { compact?: boolean }) {
  const query = useCampaigns();
  const Heading = compact ? 'h2' : 'h1';
  return <section className={`mx-auto max-w-7xl px-5 pb-16 sm:px-8 ${compact ? 'pt-16' : 'pt-28'}`}>
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-widest text-[var(--color-primary)]">Un calendario para cuidar</p><Heading className="mt-3 font-heading text-3xl font-bold sm:text-4xl">{compact ? 'Cada temporada, una forma de ayudar.' : 'Campañas de la manada'}</Heading><p className="mt-4 max-w-2xl text-[var(--color-muted-foreground)]">Planes de temporada para sumar alimento, compañía y difusión. La participación y logística se coordinan con el equipo; ninguna actividad está confirmada por este calendario.</p></div>{compact && <Link className="inline-flex items-center gap-2 font-semibold" to="/campanas">Ver calendario <ArrowRight size={18} /></Link>}</div>
    {query.isLoading && <p role="status">Cargando campañas…</p>}
    {query.error && <div role="alert"><p>No pudimos cargar el calendario.</p><button onClick={() => query.refetch()} className="mt-2 underline">Reintentar</button></div>}
    {!query.isLoading && !query.error && !query.data?.length && <p>Estamos preparando las próximas campañas.</p>}
    <div className="grid gap-6 md:grid-cols-2">{(compact ? query.data?.slice(0, 2) : query.data)?.map(c => <article key={c.id} className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)]">
      <div className="relative"><img src={assetUrl(c.image_url)} alt={`Fotografía del refugio para ${c.season}`} className="aspect-[16/9] w-full object-cover" width="800" height="450" loading="lazy" /><span className="absolute left-4 top-4 rounded-full bg-[#17022b] px-3 py-1 text-xs font-bold text-white">{c.season} · Propuesta</span></div>
      <div className="space-y-4 p-6"><p className="flex items-start gap-2 text-xs text-[var(--color-muted-foreground)]"><CalendarDays size={16} className="shrink-0" />{campaignPeriod(c)}</p><h3 className="font-heading text-2xl font-bold">{c.title}</h3><p className="leading-relaxed text-[var(--color-muted-foreground)]">{c.description}</p><ul className="space-y-2 text-sm">{c.actions.map(action => <li key={action}>🐾 {action}</li>)}</ul><div className="flex flex-wrap gap-4 pt-2"><Link to={`/contacto?campana=${encodeURIComponent(c.slug)}`} className="rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-[var(--color-primary-foreground)]">Quiero participar</Link><Link to="/tienda" className="rounded-full border px-4 py-2 text-sm font-semibold">Ver colección</Link></div></div>
    </article>)}</div>
    {!compact && <aside className="mt-10 rounded-3xl bg-[#f1e2ff] p-6 text-[#17022b]"><h2 className="font-heading text-xl font-bold">Celebrar también es protegerlos</h2><p className="mt-3 leading-relaxed">En Halloween evita disfraces que incomoden o limiten el movimiento. En Navidad mantén adornos, chocolate y cables fuera de su alcance. Durante las fiestas de fin de año prepara un espacio tranquilo, cerrado y acompañado. En San Valentín, el mejor regalo es una adopción responsable, consensuada y con seguimiento.</p><Link to="/recursos" className="mt-4 inline-block font-bold underline">Leer recursos de cuidado</Link></aside>}
  </section>;
}
export function CampaignsPage() { return <CampaignsSection />; }
