import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Heart, Plus, Star, Trash2, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Donor, DonorType } from '@/types';

export function DonorManagement() {
  const { formatAmount } = useCurrency();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('100');
  const [type, setType] = useState<DonorType>('individual');
  const [message, setMessage] = useState('');
  const [isFeatured, setIsFeatured] = useState(true);

  const { data: donors = [], isLoading } = useQuery({
    queryKey: ['admin-donors'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('donors').select('*').order('total_donated_usd', { ascending: false });
        if (error) throw error;
        return (data ?? []) as Donor[];
      } catch (error) {
        throw error instanceof Error ? error : new Error('No se pudieron cargar los donadores.');
      }
    },
  });

  const addDonor = useMutation({
    mutationFn: async () => {
      const parsedAmount = Number.parseFloat(amount);
      if (!name.trim() || !Number.isFinite(parsedAmount) || parsedAmount < 0) {
        throw new Error('Completa un nombre y un monto válido.');
      }
      const payload = {
        name: name.trim(),
        type,
        total_donated_usd: parsedAmount,
        message: message.trim() || null,
        is_featured: isFeatured,
        is_anonymous: false,
      };
      const { error } = await supabase.from('donors').insert([payload]);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-donors'] });
      qc.invalidateQueries({ queryKey: ['top-donors-public'] });
      toast.success('Donador registrado con éxito.');
      setShowForm(false);
      setName('');
      setMessage('');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'No se pudo agregar el donador en Supabase.'),
  });

  const deleteDonor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('donors').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-donors'] });
      qc.invalidateQueries({ queryKey: ['top-donors-public'] });
      toast.success('Donador eliminado.');
    },
    onError: () => toast.error('No se pudo eliminar el donador en Supabase.'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Heart className="h-6 w-6 text-rose-500" />
            Gestión de Donadores
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            Administra la lista de donadores destacados y sus aportes.
          </p>
        </div>
        <Button variant="warm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Donador
        </Button>
      </div>

      {showForm && (
        <Card className="border-rose-200 dark:border-rose-900">
          <CardHeader>
            <CardTitle className="text-base">Nuevo Donador Destacado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="dname">Nombre / Organización</Label>
                <Input id="dname" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Familia Pérez" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="damount">Total Donado (USD)</Label>
                <Input id="damount" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dtype">Tipo</Label>
                <select id="dtype" value={type} onChange={e => setType(e.target.value as DonorType)} className="flex h-9 w-full rounded-lg border border-[var(--color-input)] bg-transparent px-3 py-1 text-sm">
                  <option value="individual">Persona Individual</option>
                  <option value="company">Empresa</option>
                  <option value="organization">Organización / ONG</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dmsg">Mensaje (opcional)</Label>
                <Input id="dmsg" value={message} onChange={e => setMessage(e.target.value)} placeholder="Ej: Con todo nuestro amor..." />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button variant="warm" onClick={() => addDonor.mutate()} disabled={addDonor.isPending}>Guardar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{donors.length} Donante(s)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-[var(--color-muted-foreground)]">Cargando...</div>
          ) : donors.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-muted-foreground)]">Sin donadores registrados.</div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {donors.map(d => (
                <div key={d.id} className="flex items-center justify-between py-3 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center font-bold text-rose-500 shrink-0">
                      {d.name[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-bold text-sm">{d.name}</h3>
                        {d.is_featured && <Badge variant="warm" className="text-xs">Destacado</Badge>}
                      </div>
                      <p className="text-xs text-[var(--color-muted-foreground)]">{d.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatAmount(d.total_donated_usd)}</span>
                    <Button size="icon" variant="ghost" className="text-[var(--color-destructive)]" onClick={() => { if (confirm('¿Eliminar donador?')) deleteDonor.mutate(d.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
