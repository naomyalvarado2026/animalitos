import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Home, Menu, PawPrint, ShoppingBag, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRIMARY_ITEMS = [
  { label: 'Inicio', href: '/', icon: Home, end: true },
  { label: 'Adoptar', href: '/adopta', icon: PawPrint, end: false },
  { label: 'Ayudar', href: '/donaciones', icon: Heart, end: false },
  { label: 'Tienda', href: '/tienda', icon: ShoppingBag, end: false },
];

const MORE_ITEMS = [
  { label: 'Cómo funciona', href: '/como-funciona' },
  { label: 'Santuario', href: '/santuario' },
  { label: 'Tienda solidaria', href: '/tienda' },
  { label: 'Voluntariado', href: '/voluntariado' },
  { label: 'Historias de éxito', href: '/historias-de-exito' },
  { label: 'En memoria de', href: '/en-memoria' },
  { label: 'Transparencia', href: '/transparencia' },
  { label: 'Contacto', href: '/contacto' },
  { label: 'Recursos educativos', href: '/recursos' },
];

export function PublicMobileNav() {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const moreDialogRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const isActive = (href: string) => href === '/'
    ? location.pathname === '/'
    : location.pathname.startsWith(href);
  const isHelping = ['/donaciones', '/voluntariado', '/santuario', '/contacto/quiero-apoyar'].some((path) => location.pathname.startsWith(path));

  const closeMore = (restoreFocus = true) => {
    setIsMoreOpen(false);
    if (restoreFocus) requestAnimationFrame(() => moreButtonRef.current?.focus());
  };

  useEffect(() => setIsMoreOpen(false), [location.pathname]);

  useEffect(() => {
    if (isMoreOpen) {
      moreDialogRef.current?.querySelector<HTMLElement>('button, a')?.focus();
    }
  }, [isMoreOpen]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMoreOpen) closeMore();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isMoreOpen]);

  return (
    <>
      {isMoreOpen && (
        <div className="fixed inset-0 z-[65] md:hidden" role="presentation" onClick={() => closeMore()}>
          <div className="absolute inset-0 bg-black/35" />
          <div ref={moreDialogRef} id="more-menu" className="absolute left-3 right-3 bottom-[calc(4.9rem+env(safe-area-inset-bottom))] rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="more-menu-title" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between px-3 py-2"><p id="more-menu-title" className="font-heading font-bold">Más de AdoptaME</p><button type="button" onClick={() => closeMore()} className="mobile-touch-target rounded-xl" aria-label="Cerrar más opciones"><X className="h-5 w-5 mx-auto" /></button></div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {MORE_ITEMS.map((item) => <Link key={item.href} to={item.href} onClick={() => closeMore(false)} className="rounded-2xl bg-[var(--color-background)] px-3 py-3 text-sm font-semibold hover:bg-[var(--color-accent)]">{item.label}</Link>)}
            </div>
          </div>
        </div>
      )}
      <nav className="fixed bottom-0 left-0 right-0 z-[60] md:hidden border-t border-[var(--color-border)] bg-[var(--color-card)]/95 shadow-[0_-8px_24px_rgba(23,23,23,.12)] backdrop-blur-md pb-[env(safe-area-inset-bottom)]" aria-label="Navegación móvil principal">
        <div className="grid grid-cols-5 h-[4.35rem] max-w-lg mx-auto">
          {PRIMARY_ITEMS.map(({ label, href, icon: Icon }) => { const active = href === '/donaciones' ? isHelping : isActive(href); return <Link key={href} to={href} aria-current={active ? 'page' : undefined} aria-label={`Ir a ${label}`} className={cn('flex flex-col items-center justify-center gap-1 text-[.68rem] font-semibold mobile-touch-target', active ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted-foreground)]')}><Icon className="h-5 w-5" strokeWidth={2.2} /><span>{label}</span></Link>; })}
          <button ref={moreButtonRef} type="button" onClick={() => isMoreOpen ? closeMore(false) : setIsMoreOpen(true)} aria-expanded={isMoreOpen} aria-controls="more-menu" className={cn('flex flex-col items-center justify-center gap-1 text-[.68rem] font-semibold mobile-touch-target', isMoreOpen ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted-foreground)]')}><Menu className="h-5 w-5" strokeWidth={2.2} /><span>Más</span></button>
        </div>
      </nav>
    </>
  );
}
