import { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { BookOpen, ChevronDown, HeartHandshake, PawPrint, Sparkles } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { useMobile } from '@/hooks/useMobile';
import { cn } from '@/lib/utils';

interface SubItem {
  label: string;
  href: string;
}

interface NavItem {
  label: string;
  href: string;
  description: string;
  icon: typeof PawPrint;
  children?: SubItem[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Adoptar', href: '/adopta', description: 'Conoce a quienes esperan una familia.', icon: PawPrint },
  { label: 'Cómo funciona', href: '/como-funciona', description: 'Un proceso claro y responsable.', icon: BookOpen },
  { label: 'Tienda', href: '/tienda', description: 'Compra con propósito.', icon: Sparkles },
  {
    label: 'Ayudar',
    href: '/voluntariado',
    description: 'Hay muchas formas de cambiar una vida.',
    icon: HeartHandshake,
    children: [
      { label: 'Voluntariado', href: '/voluntariado' },
      { label: 'Santuario', href: '/santuario' },
      { label: 'Tienda solidaria', href: '/tienda' },
      { label: 'Donaciones', href: '/donaciones' },
    ],
  },
  {
    label: 'Nosotros',
    href: '/nosotros',
    description: 'La historia detrás de cada rescate.',
    icon: HeartHandshake,
    children: [
      { label: 'Historia', href: '/nosotros/historia' },
      { label: 'Historias de Éxito ✨', href: '/historias-de-exito' },
      { label: 'En memoria de', href: '/en-memoria' },
    ],
  },
  {
    label: 'Más',
    href: '/recursos',
    description: 'Recursos, transparencia y contacto.',
    icon: BookOpen,
    children: [
      { label: 'Recursos', href: '/recursos' },
      { label: 'Transparencia', href: '/transparencia' },
      { label: 'Ingresos y egresos', href: '/transparencia/ingresos' },
      { label: 'Donadores principales', href: '/donaciones/donadores-principales' },
      { label: 'Contacto', href: '/contacto' },
      { label: 'Quiero Apoyar', href: '/contacto/quiero-apoyar' },
    ],
  },
];

export function PublicHeader() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const isMobile = useMobile();
  const location = useLocation();
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (href: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenDropdown(href);
  };

  const handleMouseLeave = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 300); // 300ms grace period so moving mouse is silky smooth and never closes prematurely
  };

  useEffect(() => {
    setOpenDropdown(null);
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'shadow-md border-b border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur-md'
          : 'border-b border-transparent bg-[var(--color-background)]/85 backdrop-blur-sm'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group"
            aria-label="AdoptaME — Inicio"
          >
            <span className="font-heading text-xl tracking-[-0.05em] font-extrabold text-[var(--color-foreground)] group-hover:opacity-80 transition-colors">
              Adopta<span className="text-[var(--color-primary)]">ME</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          {!isMobile && (
            <nav className="flex items-center gap-1" role="navigation" aria-label="Navegación principal">
              {NAV_ITEMS.map((item) =>
                item.children ? (
                  <div
                    key={item.href}
                    className="relative"
                    onMouseEnter={() => handleMouseEnter(item.href)}
                    onMouseLeave={handleMouseLeave}
                    onFocus={() => handleMouseEnter(item.href)}
                    onBlur={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                        setOpenDropdown(null);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') {
                        setOpenDropdown(null);
                        event.currentTarget.querySelector<HTMLAnchorElement>('a')?.focus();
                      }
                    }}
                  >
                    <NavLink
                      to={item.href}
                      aria-haspopup="true"
                      aria-controls={`submenu-${item.href.slice(1)}`}
                      aria-expanded={openDropdown === item.href}
                      onClick={() => {
                        // Toggle on click
                        if (openDropdown === item.href) {
                          setOpenDropdown(null);
                        } else {
                          handleMouseEnter(item.href);
                        }
                      }}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 select-none cursor-pointer',
                          isActive || openDropdown === item.href
                            ? 'text-[var(--color-primary)] bg-[var(--color-accent)]'
                            : 'text-[var(--color-foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-accent)]'
                        )
                      }
                    >
                      {item.label}
                      <ChevronDown
                        className={cn(
                          'h-3.5 w-3.5 transition-transform duration-200',
                          openDropdown === item.href && 'rotate-180 text-[var(--color-primary)]'
                        )}
                      />
                    </NavLink>

                    {/* Dropdown positioned immediately next to the button with zero gap */}
                    {openDropdown === item.href && (
                      <div
                        id={`submenu-${item.href.slice(1)}`}
                        className="absolute top-[calc(100%+2px)] left-0 z-50 animate-fade-in"
                        onMouseEnter={() => handleMouseEnter(item.href)}
                        onMouseLeave={handleMouseLeave}
                      >
                        {/* Invisible bridge overlapping button edge to guarantee unbroken hover hit test */}
                        <div className="absolute -top-3 left-0 right-0 h-4 pointer-events-auto" />

                        <div
                          className="w-[310px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-2.5 shadow-2xl backdrop-blur-md ring-1 ring-black/5 dark:ring-white/10"
                          aria-label={`Enlaces de ${item.label}`}
                        >
                          <div className="mb-1 flex items-start gap-3 rounded-xl bg-[var(--color-background)] p-3"><div className="rounded-lg bg-[var(--color-accent)] p-2 text-[var(--color-primary)]"><item.icon className="h-4 w-4" /></div><div><p className="text-sm font-bold">{item.label}</p><p className="mt-0.5 text-xs leading-relaxed text-[var(--color-muted-foreground)]">{item.description}</p></div></div>
                          {item.children.map((child) => (
                            <NavLink
                              key={child.href}
                              to={child.href}
                              onClick={() => setOpenDropdown(null)}
                              className={({ isActive }) =>
                                cn(
                                  'flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                                  isActive
                                    ? 'text-[var(--color-primary)] bg-[var(--color-accent)] font-semibold'
                                    : 'text-[var(--color-foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-accent)]'
                                )
                              }
                            >
                              {child.label}
                            </NavLink>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.href === '/'}
                    className={({ isActive }) =>
                      cn(
                        'px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
                        isActive
                          ? 'text-[var(--color-primary)] bg-[var(--color-accent)]'
                          : 'text-[var(--color-foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-accent)]'
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                )
              )}
            </nav>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {!isMobile && (
              <Button
                variant="warm"
                size="sm"
                asChild
              >
                <Link to="/donaciones">❤️ Donar</Link>
              </Button>
            )}
            {isMobile && <span className="sr-only">La navegación principal está en la barra inferior</span>}
          </div>
        </div>
      </div>
    </header>
  );
}
