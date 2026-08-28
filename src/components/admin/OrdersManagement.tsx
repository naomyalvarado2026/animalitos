import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ChevronDown, ChevronUp, ClipboardList, Loader2, RefreshCw, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type OrderStatus = 'pending' | 'confirmed' | 'paid' | 'shipped' | 'completed' | 'cancelled';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: Record<string, unknown> | null;
  status: OrderStatus;
  currency: string;
  total_cents: number;
  payment_reference: string | null;
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_name_snapshot: string;
  variant_label_snapshot: string | null;
  unit_price_cents: number;
  quantity: number;
}

interface OrderWithItems extends Order {
  items: OrderItem[];
}

const STATUS_OPTIONS: Array<{ value: 'all' | OrderStatus; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'confirmed', label: 'Confirmados' },
  { value: 'paid', label: 'Pagados' },
  { value: 'shipped', label: 'Enviados' },
  { value: 'completed', label: 'Completados' },
  { value: 'cancelled', label: 'Cancelados' },
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  paid: 'Pagado',
  shipped: 'Enviado',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

function formatUsd(cents?: number | null) {
  const val = typeof cents === 'number' && !isNaN(cents) ? cents : 0;
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val / 100);
  } catch {
    return `$${(val / 100).toFixed(2)} USD`;
  }
}

function formatDate(value?: string | null) {
  if (!value) return '';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
  } catch {
    return String(value);
  }
}

function statusVariant(status: OrderStatus) {
  if (status === 'completed' || status === 'paid') return 'success' as const;
  if (status === 'cancelled') return 'secondary' as const;
  if (status === 'shipped' || status === 'confirmed') return 'default' as const;
  return 'warning' as const;
}

function readableAddress(address: Record<string, unknown> | null) {
  if (!address) return 'No registrada';
  return Object.values(address).filter(value => typeof value === 'string' && value.trim()).join(', ') || 'No registrada';
}

export function OrdersManagement() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const ordersQuery = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async (): Promise<OrderWithItems[]> => {
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, customer_email, customer_phone, shipping_address, status, currency, total_cents, payment_reference, created_at, updated_at')
        .order('created_at', { ascending: false });
      if (ordersError) throw new Error(`No se pudieron cargar los pedidos: ${ordersError.message}`);

      const orderRows = (orders ?? []) as Order[];
      if (orderRows.length === 0) return [];

      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('id, order_id, product_name_snapshot, variant_label_snapshot, unit_price_cents, quantity')
        .in('order_id', orderRows.map(order => order.id));
      if (itemsError) throw new Error(`No se pudieron cargar los artículos de los pedidos: ${itemsError.message}`);

      const itemsByOrder = new Map<string, OrderItem[]>();
      for (const item of (items ?? []) as OrderItem[]) {
        const current = itemsByOrder.get(item.order_id) ?? [];
        current.push(item);
        itemsByOrder.set(item.order_id, current);
      }
      return orderRows.map(order => ({ ...order, items: itemsByOrder.get(order.id) ?? [] }));
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw new Error(`No se pudo actualizar el pedido: ${error.message}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Estado del pedido actualizado.');
    },
    onError: error => toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el pedido.'),
  });

  const filteredOrders = useMemo(() => {
    const orders = ordersQuery.data ?? [];
    return statusFilter === 'all' ? orders : orders.filter(order => order.status === statusFilter);
  }, [ordersQuery.data, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold">
            <ClipboardList className="h-6 w-6 text-[var(--color-primary)]" />
            Pedidos de tienda
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">Gestiona pedidos de merchandising en dólares estadounidenses.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => ordersQuery.refetch()} disabled={ordersQuery.isFetching}>
          <RefreshCw className={ordersQuery.isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Actualizar
        </Button>
      </div>

      {ordersQuery.error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">No se pudieron cargar los pedidos.</p>
            <p className="mt-1 break-words">{ordersQuery.error instanceof Error ? ordersQuery.error.message : 'Supabase devolvió un error inesperado.'}</p>
            <p className="mt-2 text-xs">Si las tablas no existen, ejecuta las migraciones de merchandising antes de usar este módulo.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => ordersQuery.refetch()}>Reintentar</Button>
        </div>
      )}

      {ordersQuery.isLoading && (
        <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]" role="status">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando pedidos…
        </div>
      )}

      {!ordersQuery.error && !ordersQuery.isLoading && (
        <Card>
          <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">{filteredOrders.length} pedido(s)</CardTitle>
            <div className="flex max-w-full gap-1.5 overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-1" aria-label="Filtrar pedidos por estado">
              {STATUS_OPTIONS.map(option => (
                <button key={option.value} type="button" aria-pressed={statusFilter === option.value} onClick={() => setStatusFilter(option.value)} className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs transition-colors ${statusFilter === option.value ? 'bg-[var(--color-card)] font-bold text-[var(--color-foreground)] shadow-sm' : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'}`}>
                  {option.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="py-10 text-center text-sm text-[var(--color-muted-foreground)]">
                <ClipboardList className="mx-auto mb-3 h-8 w-8 opacity-50" />
                {statusFilter === 'all' ? 'Todavía no hay pedidos registrados.' : 'No hay pedidos con este estado.'}
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {filteredOrders.map(order => {
                  const expanded = expandedId === order.id;
                  return (
                    <div key={order.id} className="py-4 first:pt-0 last:pb-0">
                      <button type="button" className="flex w-full items-start justify-between gap-4 text-left" onClick={() => setExpandedId(expanded ? null : order.id)} aria-expanded={expanded}>
                        <div className="min-w-0">
                          <p className="truncate font-heading font-bold">{order.order_number}</p>
                          <p className="mt-1 truncate text-sm">{order.customer_name} · {order.customer_email}</p>
                          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{formatDate(order.created_at)} · {order.items.length} artículo(s)</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <div className="text-right"><Badge variant={statusVariant(order.status)}>{STATUS_LABELS[order.status]}</Badge><p className="mt-1 font-semibold">{formatUsd(order.total_cents)}</p></div>
                          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </button>

                      {expanded && (
                        <div className="mt-4 space-y-4 rounded-xl bg-[var(--color-background)] p-4 text-sm">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <p><span className="font-semibold">Teléfono:</span> {order.customer_phone || 'No registrado'}</p>
                            <p><span className="font-semibold">Referencia de pago:</span> {order.payment_reference || 'No registrada'}</p>
                            <p className="sm:col-span-2"><span className="font-semibold">Dirección:</span> {readableAddress(order.shipping_address)}</p>
                          </div>
                          <div className="space-y-2 border-t border-[var(--color-border)] pt-3">
                            <p className="font-semibold">Artículos</p>
                            {order.items.length === 0 ? <p className="text-xs text-[var(--color-muted-foreground)]">No hay artículos asociados.</p> : order.items.map(item => <div key={item.id} className="flex justify-between gap-3 text-xs"><span>{item.quantity} × {item.product_name_snapshot}{item.variant_label_snapshot ? ` (${item.variant_label_snapshot})` : ''}</span><span className="shrink-0 font-medium">{formatUsd(item.unit_price_cents * item.quantity)}</span></div>)}
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-3">
                            <label className="flex items-center gap-2 text-xs font-semibold" htmlFor={`status-${order.id}`}>Cambiar estado
                              <select id={`status-${order.id}`} value={order.status} disabled={updateStatus.isPending} onChange={event => updateStatus.mutate({ id: order.id, status: event.target.value as OrderStatus })} className="h-9 rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-2 text-xs font-normal">
                                {STATUS_OPTIONS.filter(option => option.value !== 'all').map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                              </select>
                            </label>
                            {updateStatus.isPending && <span className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)]"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando…</span>}
                            {!updateStatus.isPending && <Save className="h-4 w-4 text-[var(--color-muted-foreground)]" aria-hidden="true" />}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
