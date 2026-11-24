import { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
  Heart,
  Settings,
  Calendar,
  LogOut,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Menu,
  ShoppingBag,
  BarChart3,
  Package,
  BookHeart,
  BookOpen,
  Workflow,
  Archive,
  UserRound,
  HandHeart,
  Home,
  LifeBuoy,
  FileCheck2,
  ClipboardCheck,
  HeartHandshake,
  Images,
  RefreshCw,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useOnlineStatus } from '@/components/pwa/useOnlineStatus';
import { AccessibleDialog } from '@/components/ui/AccessibleDialog';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { PawIcon } from '@/components/layout/PawBackground';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useMobile } from '@/hooks/useMobile';
import { MotionConfig } from 'motion/react';
import { RouteTransition } from '@/components/ui/RouteTransition';

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  minLevel: number;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, minLevel: 0 },
  { label: 'Rescatados', href: '/admin/animales', icon: Heart, minLevel: 4 },
  { label: 'Adopciones de la comunidad', href: '/admin/adopciones-comunidad', icon: Megaphone, minLevel: 4 },
  { label: 'Interesados comunidad', href: '/admin/solicitudes-comunidad', icon: FileText, minLevel: 4 },
  { label: 'Historias de la manada', href: '/admin/historias-perros', icon: Images, minLevel: 4 },
  { label: 'Solicitudes', href: '/admin/solicitudes', icon: FileText, minLevel: 4 },
  { label: 'Actividades', href: '/admin/actividades', icon: Calendar, minLevel: 4 },
  { label: 'Hogares temporales', href: '/admin/acogidas', icon: Home, minLevel: 4 },
  { label: 'Apoyo comunitario', href: '/admin/apoyo-comunitario', icon: LifeBuoy, minLevel: 4 },
  { label: 'Bienestar y seguimientos', href: '/admin/bienestar', icon: ClipboardCheck, minLevel: 4 },
  { label: 'Seguimiento posadopción', href: '/admin/seguimiento-adopciones', icon: HeartHandshake, minLevel: 4 },
  { label: 'Finanzas', href: '/admin/finanzas', icon: DollarSign, minLevel: 4 },
  { label: 'Donadores', href: '/admin/donadores', icon: Users, minLevel: 4 },
  { label: 'Contenido & Redes', href: '/admin/contenido', icon: FileText, minLevel: 4 },
  { label: 'Usuarios', href: '/admin/usuarios', icon: Users, minLevel: 10 },
  { label: 'Configuración', href: '/admin/configuracion', icon: Settings, minLevel: 7 },
  { label: 'Pedidos', href: '/admin/pedidos', icon: ShoppingBag, minLevel: 4 },
  { label: 'Reportes', href: '/admin/reportes', icon: BarChart3, minLevel: 4 },
  { label: 'Productos', href: '/admin/productos', icon: Package, minLevel: 4 },
  { label: 'Historias', href: '/admin/historias', icon: BookHeart, minLevel: 4 },
  { label: 'Campañas', href: '/admin/campanas', icon: Calendar, minLevel: 4 },
  { label: 'Rendición de campañas', href: '/admin/rendicion-campanas', icon: FileCheck2, minLevel: 7 },
  { label: 'Editorial', href: '/admin/editorial', icon: BookOpen, minLevel: 4 },
  { label: 'Estructura', href: '/admin/estructura', icon: Workflow, minLevel: 4 },
  { label: 'En memoria', href: '/admin/memoria', icon: Archive, minLevel: 4 },
  { label: 'Equipo', href: '/admin/equipo', icon: UserRound, minLevel: 4 },
  { label: 'Impacto donaciones', href: '/admin/impacto-donaciones', icon: HandHeart, minLevel: 4 },
];

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  super_admin: { label: 'Super Admin', color: 'warm' },
  admin: { label: 'Admin', color: 'default' },
  editor: { label: 'Editor', color: 'secondary' },
  viewer: { label: 'Viewer', color: 'outline' },
};

export function AdminLayout() {
  const { profile, signOut, hasAccessLevel } = useAuth();
  const online = useOnlineStatus();
  const queryClient = useQueryClient();
  const [navSearch, setNavSearch] = useState('');
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const isMobile = useMobile(1024);
  const navigate = useNavigate();

  async function handleSyncAdmin() {
    if (!online) {
      toast('Estás sin conexión', { description: 'Conéctate a internet para sincronizar datos con Supabase.' });
      return;
    }
    setSyncing(true);
    try {
      await queryClient.invalidateQueries();
      toast.success('Datos del panel actualizados.');
    } finally {
      setSyncing(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/admin/login');
  }

  const roleMeta = ROLE_LABELS[profile?.role ?? 'viewer'] ?? { label: 'Admin', color: 'warm' };
  const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const visibleItems = NAV_ITEMS.filter(item => hasAccessLevel(item.minLevel) && normalize(item.label).includes(normalize(navSearch)));
  const quickMobileItems = NAV_ITEMS.filter(
    item => ['/admin', '/admin/animales', '/admin/solicitudes', '/admin/finanzas'].includes(item.href) && hasAccessLevel(item.minLevel),
  );
  const sectionTitle = NAV_ITEMS.find(item => item.href === location.pathname)?.label ?? 'Administración';
  const groups = [
    { title: 'Resumen', paths: ['/admin', '/admin/reportes'] },
    { title: 'Rescate y comunidad', paths: ['/admin/animales', '/admin/adopciones-comunidad', '/admin/solicitudes-comunidad', '/admin/solicitudes', '/admin/actividades', '/admin/acogidas', '/admin/apoyo-comunitario', '/admin/bienestar', '/admin/seguimiento-adopciones', '/admin/equipo', '/admin/memoria'] },
    { title: 'Tienda y aportes', paths: ['/admin/productos', '/admin/pedidos', '/admin/finanzas', '/admin/rendicion-campanas', '/admin/donadores', '/admin/impacto-donaciones'] },
    { title: 'Comunicación', paths: ['/admin/historias-perros', '/admin/historias', '/admin/contenido', '/admin/editorial', '/admin/estructura', '/admin/campanas'] },
    { title: 'Administración', paths: ['/admin/usuarios', '/admin/configuracion'] },
  ];

  const renderSidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-2.5 px-4 py-5 border-b border-[var(--color-border)] ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-xl brand-gradient-bg flex items-center justify-center shrink-0">
          <PawIcon size={16} color="white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-heading text-sm font-bold leading-none">Adopta<span className="text-[var(--color-primary)]">ME</span></p>
            <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">Panel Admin</p>
          </div>
        )}
        {isMobile && <button type="button" onClick={() => setMobileOpen(false)} className="ml-auto rounded-lg p-2 text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]" aria-label="Cerrar menú"><X className="h-5 w-5" /></button>}
      </div>

      {!collapsed && <div className="px-3 pt-4"><input aria-label="Buscar sección" placeholder="Buscar herramienta…" value={navSearch} onChange={event => setNavSearch(event.target.value)} className="min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm" /></div>}
      <nav aria-label="Navegación administrativa" className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        {groups.map(group => {
          const groupItems = visibleItems.filter(item => group.paths.includes(item.href));
          if (!groupItems.length) return null;
          return <div key={group.title} className="mb-4">{!collapsed && <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">{group.title}</p>}
        {groupItems.map((item) => (
          <NavLink
            key={item.href}
            aria-label={item.label}
            title={collapsed ? item.label : undefined}
            to={item.href}
            end={item.href === '/admin'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                collapsed ? 'justify-center' : '',
                isActive
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm'
                  : 'text-[var(--color-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--color-primary)]'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-[var(--color-primary-foreground)]' : ''}`} />
                {!collapsed && <span>{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
          </div>;
        })}
        {!visibleItems.length && <p role="status" className="p-3 text-sm text-[var(--color-muted-foreground)]">No hay secciones que coincidan.</p>}
      </nav>

      {/* User */}
      <div className={`px-2 pb-4 border-t border-[var(--color-border)] pt-4 ${collapsed ? 'flex flex-col items-center' : ''}`}>
        {!collapsed && profile && (
          <div className="px-3 pb-3">
            <p className="text-xs text-[var(--color-muted-foreground)] truncate">{profile.email}</p>
            <Badge variant={roleMeta.color as 'warm' | 'default' | 'secondary' | 'outline'} className="mt-1">
              {roleMeta.label}
            </Badge>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 transition-colors',
            collapsed ? 'justify-center' : ''
          )}
          aria-label="Cerrar sesión"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </div>
  );

  return (
    <MotionConfig reducedMotion="user">
    <div className="admin-shell flex h-dvh bg-[var(--color-background)] overflow-hidden">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          className={cn(
            'relative flex flex-col border-r border-[var(--color-border)] bg-[var(--color-card)] transition-all duration-300',
            collapsed ? 'w-[60px]' : 'w-64'
          )}
        >
          {renderSidebar()}
          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center shadow-sm hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors z-10"
          >
            {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </button>
        </aside>
      )}

      {isMobile && <AccessibleDialog open={mobileOpen} onClose={() => setMobileOpen(false)} title="Herramientas del panel"><div className="flex h-[75dvh] max-h-[75dvh] flex-col">{renderSidebar()}</div></AccessibleDialog>}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top header */}
        <header className="h-14 border-b border-[var(--color-border)] bg-[var(--color-card)] flex items-center justify-between gap-2 px-3 sm:px-4 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} aria-label="Abrir menú de herramientas">
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <Link to="/" className="truncate text-xs font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] transition-colors">
              ← Ver sitio público
            </Link>
          </div>
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2 shrink-0">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                online
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
              )}
              title={online ? 'Conectado a Supabase' : 'Sin conexión a internet'}
            >
              {online ? <Wifi className="h-3.5 w-3.5" aria-hidden="true" /> : <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />}
              <span className="hidden sm:inline">{online ? 'En línea' : 'Sin red'}</span>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => void handleSyncAdmin()}
              disabled={syncing}
              aria-label="Sincronizar datos del panel"
              title="Sincronizar datos del panel"
            >
              <RefreshCw className={cn('h-4 w-4', syncing && 'animate-spin')} />
            </Button>
            {!isMobile && profile && (
              <span className="truncate max-w-[180px] text-xs text-[var(--color-muted-foreground)]">
                {profile.full_name ?? profile.email}
              </span>
            )}
            <ThemeToggle />
          </div>
        </header>

        {!online && (
          <div role="status" aria-live="polite" className="border-b border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100 shrink-0">
            <div className="mx-auto flex max-w-[1440px] items-center gap-2">
              <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Sin conexión a internet: puedes revisar pantallas en caché, pero guardar o actualizar registros requiere reconexión.</span>
            </div>
          </div>
        )}

        {/* Content */}
        <main id="admin-content" className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8 lg:pb-8"><div className="mx-auto max-w-[1440px]"><p className="mb-5 text-xs text-[var(--color-muted-foreground)]">Panel / <span className="font-semibold text-[var(--color-foreground)]">{sectionTitle}</span></p>
          <RouteTransition />
        </div></main>
      </div>

      {/* Barra adaptativa móvil/tablet para acceso directo al panel */}
      {isMobile && (
        <nav
          aria-label="Accesos rápidos administrativos"
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-card)]/95 shadow-[0_-8px_24px_rgba(23,2,43,0.1)] backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
        >
          <div
            className="mx-auto grid h-16 max-w-xl"
            style={{ gridTemplateColumns: `repeat(${quickMobileItems.length + 1}, minmax(0, 1fr))` }}
          >
            {quickMobileItems.map((item) => {
              const active = item.href === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-[44px] flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold transition-colors',
                    active ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted-foreground)]'
                  )}
                >
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                  <span className="truncate max-w-full">{item.label}</span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex min-h-[44px] flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)]"
              aria-label="Abrir todas las herramientas administrativas"
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
              <span>Herramientas</span>
            </button>
          </div>
        </nav>
      )}
    </div>
    </MotionConfig>
  );
}
