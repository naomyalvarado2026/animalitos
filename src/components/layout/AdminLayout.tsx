import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
  Heart,
  Settings,
  Calendar,
  LogOut,
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
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { PawIcon } from '@/components/layout/PawBackground';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useMobile } from '@/hooks/useMobile';
import { Outlet } from 'react-router-dom';

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  minLevel: number;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, minLevel: 0 },
  { label: 'Rescatados', href: '/admin/animales', icon: Heart, minLevel: 4 },
  { label: 'Solicitudes', href: '/admin/solicitudes', icon: FileText, minLevel: 4 },
  { label: 'Actividades', href: '/admin/actividades', icon: Calendar, minLevel: 4 },
  { label: 'Finanzas', href: '/admin/finanzas', icon: DollarSign, minLevel: 4 },
  { label: 'Donadores', href: '/admin/donadores', icon: Users, minLevel: 4 },
  { label: 'Contenido & Redes', href: '/admin/contenido', icon: FileText, minLevel: 4 },
  { label: 'Usuarios', href: '/admin/usuarios', icon: Users, minLevel: 10 },
  { label: 'Configuración', href: '/admin/configuracion', icon: Settings, minLevel: 7 },
  { label: 'Pedidos', href: '/admin/pedidos', icon: ShoppingBag, minLevel: 4 },
  { label: 'Reportes', href: '/admin/reportes', icon: BarChart3, minLevel: 4 },
  { label: 'Productos', href: '/admin/productos', icon: Package, minLevel: 4 },
  { label: 'Historias', href: '/admin/historias', icon: BookHeart, minLevel: 4 },
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
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMobile();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/admin/login');
  }

  const roleMeta = ROLE_LABELS[profile?.role ?? 'viewer'];
  const visibleItems = NAV_ITEMS.filter(item => hasAccessLevel(item.minLevel));

  const SidebarContent = () => (
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
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {visibleItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/admin'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                collapsed ? 'justify-center' : '',
                isActive
                  ? 'brand-gradient-bg text-white shadow-sm'
                  : 'text-[var(--color-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--color-primary)]'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : ''}`} />
                {!collapsed && <span>{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
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
    <div className="flex h-screen bg-[var(--color-background)] overflow-hidden">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          className={cn(
            'relative flex flex-col border-r border-[var(--color-border)] bg-[var(--color-card)] transition-all duration-300',
            collapsed ? 'w-[60px]' : 'w-56'
          )}
        >
          <SidebarContent />
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

      {/* Mobile drawer overlay */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar */}
      {isMobile && (
        <aside
          className={cn(
            'fixed left-0 top-0 bottom-0 w-64 z-50 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-card)] transition-transform duration-300',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <SidebarContent />
        </aside>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top header */}
        <header className="h-14 border-b border-[var(--color-border)] bg-[var(--color-card)] flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} aria-label="Abrir menú">
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <Link to="/" className="text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] transition-colors">
              ← Ver sitio público
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {!isMobile && profile && (
              <span className="text-xs text-[var(--color-muted-foreground)]">
                {profile.full_name ?? profile.email}
              </span>
            )}
            <ThemeToggle />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
