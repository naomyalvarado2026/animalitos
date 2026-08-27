import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Heart, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Impact = { amountUSD: number; impact: string };
const DEFAULT: Impact[] = [{ amountUSD: 10, impact: '' }];
export function DonationImpactManagement() {
  const [items, setItems] = useState<Impact[]>(DEFAULT);
  const query = useQuery({ queryKey: ['admin-donation-impact'], queryFn: async () => { const { data, error } = await supabase.from('site_settings').select('value').eq('key', 'donation_impact').maybeSingle(); if (error) throw error; return data?.value ?? '[]'; } });
  useEffect(() => { if (query.data) { try { const parsed = JSON.parse(query.data); if (Array.isArray(parsed) && parsed.length) setItems(parsed); } catch { /* conservar formulario */ } } }, [query.data]);
  const save = useMutation({ mutationFn: async () => { const clean = items.map((item) => ({ amountUSD: Number(item.amountUSD), impact: item.impact.trim() })).filter((item) => Number.isFinite(item.amountUSD) && item.amountUSD > 0 && item.impact); if (!clean.length) throw new Error('Añade al menos un impacto validado.'); const { error } = await supabase.from('site_settings').upsert({ key: 'donation_impact', value: JSON.stringify(clean) }, { onConflict: 'key' }); if (error) throw error; }, onSuccess: () => toast.success('Impactos de donación actualizados.'), onError: (error: Error) => toast.error(error.message || 'No se pudo guardar.') });
  return <section className="space-y-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="flex items-center gap-2 font-heading text-2xl font-bold"><Heart className="h-6 w-6 text-[var(--color-primary)]" />Impacto de donaciones</h1><p className="mt-1 text-sm text-[var(--color-muted-foreground)]">Edita solo equivalencias respaldadas por costos reales y vigentes.</p></div><Button variant="outline" onClick={() => setItems([...items, { amountUSD: 0, impact: '' }])}><Plus className="mr-2 h-4 w-4" />Añadir impacto</Button></div>{query.error && <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">No se pudo cargar la configuración desde Supabase.</div>}<Card><CardHeader><CardTitle className="text-base">Equivalencias publicadas</CardTitle></CardHeader><CardContent className="space-y-4">{items.map((item, index) => <div key={index} className="grid gap-3 rounded-xl border border-[var(--color-border)] p-4 md:grid-cols-[180px_1fr_auto]"><div><Label htmlFor={`impact-amount-${index}`}>Monto en USD</Label><Input id={`impact-amount-${index}`} type="number" min="1" step="1" value={item.amountUSD || ''} onChange={(event) => setItems(items.map((current, currentIndex) => currentIndex === index ? { ...current, amountUSD: Number(event.target.value) } : current))} /></div><div><Label htmlFor={`impact-text-${index}`}>Qué ayuda a cubrir</Label><Textarea id={`impact-text-${index}`} rows={2} value={item.impact} onChange={(event) => setItems(items.map((current, currentIndex) => currentIndex === index ? { ...current, impact: event.target.value } : current))} /></div><Button variant="ghost" size="icon" onClick={() => setItems(items.filter((_, currentIndex) => currentIndex !== index))} disabled={items.length === 1} aria-label="Eliminar impacto"><Trash2 className="h-4 w-4" /></Button></div>)}</CardContent></Card><Button variant="warm" onClick={() => save.mutate()} disabled={save.isPending}><Save className="mr-2 h-4 w-4" />{save.isPending ? 'Guardando…' : 'Guardar impactos'}</Button></section>;
}
