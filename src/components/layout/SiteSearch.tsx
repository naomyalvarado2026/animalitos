import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, BookOpen, Compass, Search } from 'lucide-react';
import { AccessibleDialog } from '@/components/ui/AccessibleDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { useFaqs } from '@/hooks/useFaqs';
import { searchPublicContent } from '@/lib/publicDiscovery';

const SearchContext = createContext<(() => void) | null>(null);

function SearchContent({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const faqs = useFaqs();
  const results = searchPublicContent(query, faqs.isPending || faqs.isError ? [] : faqs.items);

  return (
    <div className="px-5 pb-6 pt-5 sm:px-7">
      <label htmlFor="site-search-input" className="mb-2 block text-xs font-bold uppercase tracking-[.15em] text-[var(--color-muted-foreground)]">¿Qué necesitas encontrar?</label>
      <div className="relative">
        <Search aria-hidden="true" className="absolute left-4 top-4 h-5 w-5 text-[var(--color-primary)]" />
        <input id="site-search-input" data-dialog-autofocus type="search" maxLength={300} autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Adoptar, visitas, pedidos…" className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] pl-12 pr-4 text-base text-[var(--color-foreground)]" />
      </div>
      <div className="my-5 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-muted-foreground)]">
        <p role="status" aria-live="polite" aria-atomic="true">{query.trim() ? `${results.length}${results.length === 12 ? ' primeros' : ''} resultados` : 'Empieza por aquí'}</p>
        <span>Tab para recorrer · Esc para cerrar</span>
      </div>
      {results.length ? (
        <ul className="space-y-2">
          {results.map((result) => (
            <li key={result.id}>
              <Link to={result.href} onClick={onClose} className="group flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 transition hover:border-[var(--color-primary)] hover:bg-[var(--color-accent)]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent)] text-[var(--color-primary)]">{result.kind === 'faq' ? <BookOpen aria-hidden="true" className="h-5 w-5" /> : <Compass aria-hidden="true" className="h-5 w-5" />}</span>
                <span className="min-w-0 flex-1"><span className="block text-[10px] font-bold uppercase tracking-[.13em] text-[var(--color-muted-foreground)]">{result.kind === 'faq' ? 'Respuesta del centro de ayuda' : 'Explorar AdoptaME'}</span><span className="mt-1 block font-heading text-base font-bold leading-snug">{result.title}</span><span className="mt-1 block line-clamp-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">{result.description}</span></span>
                <ArrowUpRight aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
              </Link>
            </li>
          ))}
        </ul>
      ) : <EmptyState title="No encontramos esa búsqueda" description="Prueba con un tema más general o pregunta directamente al equipo." action={<><button type="button" onClick={() => setQuery('')} className="rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm font-bold">Ver sugerencias</button><Link to="/contacto" onClick={onClose} className="rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-bold text-[var(--color-primary-foreground)]">Contactar al equipo</Link></>} />}
      {faqs.isPending && <p className="mt-4 text-xs text-[var(--color-muted-foreground)]" role="status">Cargando respuestas publicadas…</p>}
      {faqs.isError && <div className="mt-4 text-sm text-[var(--color-muted-foreground)]">La búsqueda de páginas sigue disponible. No pudimos cargar las respuestas. <button type="button" onClick={() => void faqs.refetch()} className="underline">Reintentar</button></div>}
      <p className="mt-5 border-t border-[var(--color-border)] pt-4 text-xs leading-relaxed text-[var(--color-muted-foreground)]">Solo buscamos páginas y respuestas públicas. No consultamos datos privados ni registramos tus búsquedas en el servidor.</p>
    </div>
  );
}

export function SiteSearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.key]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'k' || event.altKey || event.repeat) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest('input, textarea, select'))) return;
      if (document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]')) return;
      event.preventDefault();
      setOpen(true);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
  return <SearchContext.Provider value={() => setOpen(true)}>{children}<AccessibleDialog open={open} onClose={() => setOpen(false)} title="Buscar en AdoptaME">{open && <SearchContent onClose={() => setOpen(false)} />}</AccessibleDialog></SearchContext.Provider>;
}

export function SiteSearchTrigger({ expanded = false }: { expanded?: boolean }) {
  const open = useContext(SearchContext);
  if (!open) return null;
  return <button type="button" onClick={open} aria-label="Buscar en AdoptaME" aria-haspopup="dialog" aria-keyshortcuts="Control+k Meta+k" title="Buscar en AdoptaME (Ctrl o ⌘ + K)" className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-[var(--color-foreground)] transition hover:bg-[var(--color-accent)] ${expanded ? 'text-sm font-bold' : ''}`}><Search aria-hidden="true" className="h-4 w-4" />{expanded && <span>Buscar en el sitio</span>}</button>;
}
