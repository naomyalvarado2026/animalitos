import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
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
  children?: SubItem[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Adoptar', href: '/adopta' },
  { label: 'Cómo funciona', href: '/como-funciona' },
  { label: 'Tienda', href: '/tienda' },
  {
      label: 'Ayudar',
      href: '/voluntariado',
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
      children: [
        { label: 'Historia', href: '/nosotros/historia' },
        { label: 'Historias de Éxito ✨', href: '/historias-de-exito' },
        { label: 'En memoria de', href: '/en-memoria' },
      ],
    },
  {
    label: 'Más',
    href: '/recursos',
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

  useEffect(() => {
    setOpenDropdown(null);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'shadow-md border-b border-[var(--color-border)]'
          : 'border-b border-transparent'
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
                    onMouseEnter={() => setOpenDropdown(item.href)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
                          isActive
                            ? 'text-[var(--color-primary)] bg-[var(--color-accent)]'
                            : 'text-[var(--color-foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-accent)]'
                        )
                      }
                    >
                      {item.label}
                      <ChevronDown
                        className={cn(
                          'h-3.5 w-3.5 transition-transform duration-200',
                          openDropdown === item.href && 'rotate-180'
                        )}
                      />
                    </NavLink>

                    {/* Dropdown */}
                    {openDropdown === item.href && (
                      <div className="absolute top-full left-0 mt-1 min-w-[180px] rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg py-1 animate-fade-in">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.href}
                            to={child.href}
                            className={({ isActive }) =>
                              cn(
                                'block px-4 py-2 text-sm transition-colors',
                                isActive
                                  ? 'text-[var(--color-primary)] font-medium'
                                  : 'text-[var(--color-foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-accent)]'
                              )
                            }
                          >
                            {child.label}
                          </NavLink>
                        ))}
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
                <Link to="/contacto/quiero-apoyar">❤️ Donar</Link>
              </Button>
            )}
            {isMobile && <span className="sr-only">La navegación principal está en la barra inferior</span>}
          </div>
        </div>
      </div>

    </header>
  );
}
