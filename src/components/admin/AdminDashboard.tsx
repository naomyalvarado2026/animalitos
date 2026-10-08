import { motion } from 'motion/react';
import { AlertTriangle, CalendarClock, ClipboardList, Database, Download, Package, ShoppingBag, DollarSign, Heart, PawPrint, RefreshCw, Stethoscope, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateShort } from '@/lib/utils';

type ActivityItem = {
  id: string;
  description: string;
  amount_usd: number;
  date: string;
  type: 'income' | 'expense';
};

type DashboardData = {
  totalIncome: number | null;
  totalExpense: number | null;
  balance: number | null;
  donorCount: number | null;
  pendingApplications: number | null;
  availableDogs: number | null;
  registeredProfiles: number | null;
  errors: string[];
  updatedAt: string;
};

type ActionCenterData = {
  applications: number | null;
  medicalDogs: number | null;
  volunteers: number | null;
  upcomingActivities: number | null;
};

function responseError(resource: string, error: { message?: string } | null) {
  return error ? `${resource}: ${error.message || 'no fue posible consultar Supabase'}` : null;
}

function sumAmounts(rows: Array<{ amount_usd?: number | null }> | null) {
  return rows?.reduce((sum, row) => sum + Number(row.amount_usd ?? 0), 0) ?? null;
}

function countResult(result: { count: number | null; error: { message?: string } | null }) {
  return result.error ? null : result.count ?? 0;
}

interface StatItem {
  label: string;
  value: string;
  icon: typeof TrendingUp;
  color: string;
  bg: string;
}

export function AdminDashboard() {
  const { profile } = useAuth();
  const { formatAmount } = useCurrency();

  const statsQuery = useQuery<DashboardData>({
    queryKey: ['admin-dashboard-stats'], staleTime: 60_000,
    queryFn: async () => {
      const [incomeRes, expenseRes, donorRes, applicationRes, animalRes, profileRes] = await Promise.all([
        supabase.from('income_records').select('amount_usd'),
        supabase.from('expense_records').select('amount_usd'),
        supabase.from('donors').select('id', { count: 'exact', head: true }),
        supabase.from('adoption_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('animals').select('id, status, species'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ]);

      const errors = [
        responseError('Ingresos', incomeRes.error),
        responseError('Egresos', expenseRes.error),
        responseError('Donadores', donorRes.error),
        responseError('Solicitudes de adopción', applicationRes.error),
        responseError('Perritos', animalRes.error),
        responseError('Perfiles', profileRes.error),
      ].filter((error): error is string => Boolean(error));
      const totalIncome = incomeRes.error ? null : sumAmounts(incomeRes.data);
      const totalExpense = expenseRes.error ? null : sumAmounts(expenseRes.data);
      const availableDogs = animalRes.error ? null : (animalRes.data ?? []).filter((animal) => animal.species === 'dog' && animal.status === 'available').length;

      return {
        totalIncome,
        totalExpense,
        balance: totalIncome !== null && totalExpense !== null ? totalIncome - totalExpense : null,
        donorCount: donorRes.error ? null : donorRes.count ?? 0,
        pendingApplications: applicationRes.error ? null : applicationRes.count ?? 0,
        availableDogs,
        registeredProfiles: profileRes.error ? null : profileRes.count ?? 0,
        errors,
        updatedAt: new Date().toISOString(),
      };
    },
  });

  const activityQuery = useQuery<{ items: ActivityItem[]; error: string | null }>({
    queryKey: ['admin-recent-activity'], staleTime: 60_000,
    queryFn: async () => {
      const [incomeRes, expenseRes] = await Promise.all([
        supabase.from('income_records').select('id, description, amount_usd, date').order('created_at', { ascending: false }).limit(5),
        supabase.from('expense_records').select('id, description, amount_usd, date').order('created_at', { ascending: false }).limit(5),
      ]);
      const errors = [responseError('Ingresos recientes', incomeRes.error), responseError('Egresos recientes', expenseRes.error)].filter((error): error is string => Boolean(error));
      const items = [
        ...(incomeRes.data ?? []).map((row) => ({ ...row, type: 'income' as const })),
        ...(expenseRes.data ?? []).map((row) => ({ ...row, type: 'expense' as const })),
      ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, 8);
      return { items, error: errors.length > 0 ? errors.join(' · ') : null };
    },
  });

  const actionCenterQuery = useQuery<ActionCenterData>({
    queryKey: ['admin-action-center'], staleTime: 60_000,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [applications, medicalDogs, volunteers, upcomingActivities] = await Promise.all([
        supabase.from('adoption_applications').select('id', { count: 'exact', head: true }).in('status', ['pending', 'under_review']),
        supabase.from('animals').select('id', { count: 'exact', head: true }).eq('species', 'dog').eq('status', 'medical_care'),
        supabase.from('volunteer_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('volunteer_activities').select('id', { count: 'exact', head: true }).gte('activity_date', today).neq('status', 'cancelled'),
      ]);
      return {
        applications: countResult(applications),
        medicalDogs: countResult(medicalDogs),
        volunteers: countResult(volunteers),
        upcomingActivities: countResult(upcomingActivities),
      };
    },
  });

  const commerceQuery = useQuery({
    queryKey: ['admin-commerce-summary'], staleTime: 60_000,
    queryFn: async () => {
      const [products, pendingOrders, variants] = await Promise.all([
        supabase.from('products').select('id, is_proposal, is_active, inventory, product_variants(inventory, is_active)'),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('product_variants').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);
      if (products.error || pendingOrders.error || variants.error) throw new Error('No se pudo consultar el resumen de tienda');
      return { proposals: products.data.filter(p => p.is_proposal).length, published: products.data.filter(p => p.is_active && !p.is_proposal && (p.product_variants.length ? p.product_variants.some(v => v.is_active && v.inventory > 0) : p.inventory > 0)).length, pending: pendingOrders.count ?? 0, variants: variants.count ?? 0 };
    },
  });
  const refreshing = statsQuery.isFetching || activityQuery.isFetching || actionCenterQuery.isFetching || commerceQuery.isFetching;
  const refreshAll = () => { void Promise.all([statsQuery.refetch(), activityQuery.refetch(), actionCenterQuery.refetch(), commerceQuery.refetch()]); };

  const stats = statsQuery.data;
  const actions = actionCenterQuery.data;
  const hasErrors = Boolean(stats?.errors.length || activityQuery.data?.error || statsQuery.isError || activityQuery.isError || actionCenterQuery.isError);
  const profileNeedsSync = Boolean(profile && profile.role !== 'viewer' && profile.access_level < (profile.role === 'super_admin' ? 10 : profile.role === 'admin' ? 7 : 4));
  const formatMetric = (value: number | null | undefined, currency = false) => {
    if (value === null || value === undefined) return 'No disponible';
    return currency ? formatAmount(value) : String(value);
  };

  const statItems: StatItem[] = [
    { label: 'Ingresos registrados', value: formatMetric(stats?.totalIncome, true), icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
    { label: 'Egresos registrados', value: formatMetric(stats?.totalExpense, true), icon: TrendingDown, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/20' },
    { label: 'Balance registrado', value: formatMetric(stats?.balance, true), icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20' },
    { label: 'Perritos disponibles', value: formatMetric(stats?.availableDogs), icon: PawPrint, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/20' },
    { label: 'Solicitudes pendientes', value: formatMetric(stats?.pendingApplications), icon: ClipboardList, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20' },
    { label: 'Donadores registrados', value: formatMetric(stats?.donorCount), icon: Heart, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-950/20' },
  ];

  return (
    <div className="space-y-8">
      {profileNeedsSync && <div role="alert" className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"><p className="font-semibold">Tu rol administrativo necesita sincronización</p><p className="mt-1">El perfil figura como <strong>{profile?.role}</strong>, pero tiene nivel {profile?.access_level}. Un Super Admin debe revisar el nivel del perfil desde Usuarios. Referencia técnica: <code>0010_admin_access_levels.sql</code>.</p></div>}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
        <h1 className="font-heading text-2xl font-bold">
          Bienvenido, {profile?.full_name?.split(' ')[0] ?? 'Admin'} 👋
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          Organiza el cuidado, revisa pendientes y coordina el trabajo de tu equipo.
        </p>
        </div>
        <button type="button" onClick={refreshAll} disabled={refreshing} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] px-4 text-sm font-semibold transition-colors hover:bg-[var(--color-muted)] disabled:cursor-wait disabled:opacity-60" aria-label="Actualizar métricas del dashboard">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar datos
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted-foreground)]"><Database className="h-4 w-4" /><span>Fuente: Supabase · {stats?.updatedAt ? `Actualizado ${formatDateShort(stats.updatedAt)}` : 'Aún no actualizado'}</span>{statsQuery.isFetching && <span aria-live="polite">· Consultando…</span>}</div>

      {hasErrors && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Algunas métricas no están disponibles</p><p className="mt-1">No se muestran datos locales ni de demostración. Revisa la conexión, las tablas y las políticas RLS de Supabase.</p><p className="mt-2 break-words text-xs opacity-80">{[...(stats?.errors ?? []), activityQuery.data?.error].filter(Boolean).join(' · ')}</p></div></div>}

      <section aria-labelledby="action-center-title" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 id="action-center-title" className="font-heading text-lg font-bold">Centro operativo</h2>
            <p className="text-sm text-[var(--color-muted-foreground)]">Lo que puede necesitar atención hoy.</p>
          </div>
          {actionCenterQuery.isFetching && <span className="text-xs text-[var(--color-muted-foreground)]" aria-live="polite">Actualizando…</span>}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/admin/solicitudes" className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]">
            <ClipboardList className="h-5 w-5 text-blue-500" />
            <p className="mt-3 text-2xl font-bold">{actions?.applications ?? '—'}</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">Solicitudes por revisar</p>
            <span className="mt-3 block text-xs font-semibold text-[var(--color-primary)] group-hover:underline">Abrir solicitudes →</span>
          </Link>
          <Link to="/admin/animales" className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]">
            <Stethoscope className="h-5 w-5 text-rose-500" />
            <p className="mt-3 text-2xl font-bold">{actions?.medicalDogs ?? '—'}</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">Perritos en tratamiento</p>
            <span className="mt-3 block text-xs font-semibold text-[var(--color-primary)] group-hover:underline">Ver rescatados →</span>
          </Link>
          <Link to="/admin/solicitudes" className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]">
            <Users className="h-5 w-5 text-emerald-500" />
            <p className="mt-3 text-2xl font-bold">{actions?.volunteers ?? '—'}</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">Voluntarios pendientes</p>
            <span className="mt-3 block text-xs font-semibold text-[var(--color-primary)] group-hover:underline">Gestionar postulaciones →</span>
          </Link>
          <Link to="/admin/actividades" className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]">
            <CalendarClock className="h-5 w-5 text-amber-500" />
            <p className="mt-3 text-2xl font-bold">{actions?.upcomingActivities ?? '—'}</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">Actividades próximas</p>
            <span className="mt-3 block text-xs font-semibold text-[var(--color-primary)] group-hover:underline">Ver calendario →</span>
          </Link>
        </div>
      </section>

      {statsQuery.isLoading ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{statItems.map((stat) => <Card key={stat.label}><CardContent className="h-28 animate-pulse bg-[var(--color-muted)]/30" /></Card>)}</div> : statsQuery.error ? <div role="alert" className="rounded-2xl border border-rose-300 bg-rose-50 p-5 text-sm text-rose-950 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100">No fue posible cargar el dashboard. Intenta actualizar nuevamente.</div> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statItems.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.4 }}
          >
            <Card className="hover-card h-full">
              <CardContent className="flex items-start gap-4 pb-4 pt-6">
                <div className={`p-3 rounded-2xl ${stat.bg} shrink-0`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-[var(--color-muted-foreground)] mb-0.5">{stat.label}</p>
                  <p className={`break-words font-heading text-2xl font-bold ${stat.value === 'No disponible' ? 'text-base text-[var(--color-muted-foreground)]' : ''}`}>{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>}

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:p-6" aria-labelledby="commerce-heading"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="commerce-heading" className="font-heading text-lg font-bold">Tienda y merchandising</h2><p className="mt-1 text-sm text-[var(--color-muted-foreground)]">Separa los diseños en preparación de los productos listos para vender.</p></div><Link to="/admin/productos" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-primary-foreground)]"><Package className="h-4 w-4" />Gestionar colección</Link></div>{commerceQuery.isError ? <p role="alert" className="mt-4 text-sm">No pudimos consultar productos y pedidos. Usa Actualizar datos para reintentar.</p> : <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{[{label:'Diseños propuestos',value:commerceQuery.data?.proposals,href:'/admin/productos'}, {label:'Productos con stock',value:commerceQuery.data?.published,href:'/admin/productos'}, {label:'Colores activos',value:commerceQuery.data?.variants,href:'/admin/productos'}, {label:'Pedidos pendientes',value:commerceQuery.data?.pending,href:'/admin/pedidos'}].map(item => <Link key={item.label} to={item.href} className="rounded-xl bg-[var(--color-muted)]/50 p-4 hover:bg-[var(--color-accent)]"><span className="block font-heading text-2xl font-bold">{commerceQuery.isPending ? '…' : item.value ?? '—'}</span><span className="mt-1 block text-xs text-[var(--color-muted-foreground)]">{item.label}</span></Link>)}</div>}<Link to="/admin/pedidos" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--color-primary)]"><ShoppingBag className="h-4 w-4" />Revisar pedidos →</Link></section>

      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-[var(--color-muted-foreground)]">Exporta una instantánea de las métricas visibles, sin datos personales.</p><button disabled={!stats || statsQuery.isFetching} type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 text-sm disabled:opacity-50" onClick={() => { const lines = [['Métrica', 'Valor'], ...statItems.map(item => [item.label, item.value]), ['Actualizado', stats?.updatedAt ?? '']]; const csv = '\uFEFF' + lines.map(row => row.map(value => '"' + value.replaceAll('"', '""') + '"').join(';')).join('\r\n'); const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'adoptame-resumen.csv'; anchor.click(); URL.revokeObjectURL(url); }}><Download className="h-4 w-4" />Exportar resumen CSV</button></div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actividad financiera reciente</CardTitle>
        </CardHeader>
        <CardContent>
          {activityQuery.isLoading ? <div className="h-24 animate-pulse rounded-xl bg-[var(--color-muted)]/30" aria-label="Cargando actividad" /> : activityQuery.data?.error ? <p role="alert" className="py-8 text-center text-sm text-rose-600 dark:text-rose-400">No fue posible consultar la actividad financiera. Revisa el aviso anterior.</p> : activityQuery.data?.items.length === 0 ? (
            <p className="text-sm text-center text-[var(--color-muted-foreground)] py-8">
              No hay actividad financiera registrada en Supabase.
            </p>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {activityQuery.data?.items.map((item) => (
                <div key={`${item.type}-${item.id}`} className="flex items-center justify-between py-3 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      item.type === 'income'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30'
                        : 'bg-rose-100 dark:bg-rose-900/30'
                    }`}>
                      {item.type === 'income'
                        ? <TrendingUp className="h-4 w-4 text-emerald-500" />
                        : <TrendingDown className="h-4 w-4 text-rose-500" />
                      }
                    </div>
                    <p className="text-sm truncate">{item.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-semibold text-sm ${
                      item.type === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {item.type === 'income' ? '+' : '-'}{formatAmount(item.amount_usd)}
                    </p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">{formatDateShort(item.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <p className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]"><Users className="h-4 w-4" />Perfiles registrados: {formatMetric(stats?.registeredProfiles)} · Esta cifra no se usa como “usuarios activos” sin datos de actividad verificables.</p>
    </div>
  );
}
