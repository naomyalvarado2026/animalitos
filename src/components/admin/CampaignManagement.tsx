import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useCampaigns, campaignPeriod, type Campaign } from '@/lib/campaigns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
export function CampaignManagement() {
  const query = useCampaigns(true); const qc = useQueryClient(); const [editing, setEditing] = useState<Campaign | null>(null);
  const save = useMutation({ mutationFn: async (c: Campaign) => {
    if (!c.title.trim() || !c.description.trim() || c.ends_on < c.starts_on) throw new Error('Completa el título, descripción y un período válido.');
    if (!c.image_url.startsWith('/') && !/^https:\/\//.test(c.image_url)) throw new Error('Usa una ruta local o una imagen HTTPS.');
    const { error } = await supabase.from('seasonal_campaigns').update({ title:c.title.trim(), description:c.description.trim(), starts_on:c.starts_on, ends_on:c.ends_on, image_url:c.image_url, actions:c.actions.filter(Boolean), is_active:c.is_active }).eq('id', c.id);
    if (error) throw error;
  }, onSuccess: () => { qc.invalidateQueries({ queryKey:['seasonal-campaigns'] }); setEditing(null); toast.success('Campaña actualizada en la página pública.'); }, onError: (e: Error) => toast.error(e.message) });
  return <div className="space-y-6"><h1 className="font-heading text-2xl font-bold">Campañas por temporada</h1><p className="text-sm text-[var(--color-muted-foreground)]">Edita las propuestas, sus fechas y visibilidad. Publicar una campaña muestra su contenido; la logística se confirma con el equipo.</p>
    {query.isLoading && <p role="status">Cargando campañas…</p>}{query.error && <div role="alert">No se pudieron cargar. <Button onClick={() => query.refetch()}>Reintentar</Button></div>}
    {editing && <form className="space-y-4 rounded-2xl border p-5" onSubmit={e => { e.preventDefault(); save.mutate(editing); }}><h2 className="font-bold">Editar {editing.season}</h2>
      <Label htmlFor="campaign-title">Título</Label><Input id="campaign-title" required value={editing.title} onChange={e => setEditing({...editing,title:e.target.value})}/>
      <Label htmlFor="campaign-description">Descripción</Label><textarea id="campaign-description" required className="min-h-28 w-full rounded-xl border bg-transparent p-3" value={editing.description} onChange={e => setEditing({...editing,description:e.target.value})}/>
      <div className="grid gap-4 sm:grid-cols-2">{(['starts_on','ends_on'] as const).map(key => <div key={key}><Label htmlFor={key}>{key === 'starts_on' ? 'Inicio' : 'Fin'}</Label><Input id={key} type="date" required value={editing[key]} onChange={e => setEditing({...editing,[key]:e.target.value})}/></div>)}</div>
      <Label htmlFor="campaign-image">Imagen</Label><Input id="campaign-image" value={editing.image_url} onChange={e => setEditing({...editing,image_url:e.target.value})}/>
      <Label htmlFor="campaign-actions">Acciones (una por línea)</Label><textarea id="campaign-actions" className="min-h-28 w-full rounded-xl border bg-transparent p-3" value={editing.actions.join('\n')} onChange={e => setEditing({...editing,actions:e.target.value.split('\n')})}/>
      <label className="flex gap-2"><input type="checkbox" checked={editing.is_active} onChange={e => setEditing({...editing,is_active:e.target.checked})}/> Visible en la web</label><div className="flex gap-3"><Button disabled={save.isPending} type="submit">{save.isPending ? 'Guardando…' : 'Guardar campaña'}</Button><Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button></div>
    </form>}
    <div className="grid gap-4 md:grid-cols-2">{query.data?.map(c => <article key={c.id} className="space-y-3 rounded-2xl border bg-[var(--color-card)] p-5"><p className="text-xs font-semibold">{c.season} · {c.is_active ? 'Visible' : 'Oculta'} · Propuesta</p><h2 className="font-heading text-xl font-bold">{c.title}</h2><p className="text-sm">{campaignPeriod(c)}</p><p className="text-sm text-[var(--color-muted-foreground)]">{c.description}</p><Button variant="outline" onClick={() => setEditing({...c})}>Editar {c.season}</Button></article>)}</div>
  </div>;
}
