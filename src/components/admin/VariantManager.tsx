import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { AccessibleDialog } from '@/components/ui/AccessibleDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Variant = { id: string; label: string; color_hex: string | null; image_url: string | null; inventory: number; price_delta_cents: number; is_active: boolean; sku: string | null };
const empty = { label: '', color_hex: '#3c096c', image_url: '', inventory: '0', delta: '0', is_active: true, sku: '' };
export function VariantManager({ productId, name, onClose }: { productId: string; name: string; onClose: () => void }) {
 const client = useQueryClient();
 const [editing, setEditing] = useState<string | null>(null);
 const [form, setForm] = useState(empty);
 const query = useQuery({ queryKey: ['admin-variants', productId], queryFn: async () => { const {data,error}=await supabase.from('product_variants').select('*').eq('product_id',productId).order('label'); if(error)throw error; return data as Variant[]; } });
 const save = useMutation({ mutationFn: async () => {
   const inventory=Number(form.inventory), delta=Number(form.delta);
   if (!form.label.trim() || !Number.isInteger(inventory) || inventory<0 || !Number.isFinite(delta) || !/^#[0-9a-f]{6}$/i.test(form.color_hex)) throw new Error('Revisa nombre, color, existencias y precio.');
   const body={ product_id:productId,label:form.label.trim(),color_hex:form.color_hex,image_url:form.image_url.trim()||null,inventory,price_delta_cents:Math.round(delta*100),is_active:form.is_active,sku:form.sku.trim()||null };
   const result=editing ? await supabase.from('product_variants').update(body).eq('id',editing).eq('product_id',productId) : await supabase.from('product_variants').insert(body);
   if(result.error)throw result.error;
 }, onSuccess:()=>{ void client.invalidateQueries({queryKey:['admin-variants',productId]});void client.invalidateQueries({queryKey:['admin-products']});void client.invalidateQueries({queryKey:['public-store-products']});void client.invalidateQueries({queryKey:['admin-commerce-summary']});setEditing(null);setForm(empty);toast.success('Variante guardada'); },onError:(error:Error)=>toast.error(error.message) });
 return <AccessibleDialog open onClose={()=>{if(!save.isPending)onClose();}} title={`Variantes · ${name}`}><div className="space-y-5 p-5"><p className="text-sm text-[var(--color-muted-foreground)]">Crea una opción por combinación, por ejemplo “Morado · M”. Cada variante tiene su propio stock. Ocultarla conserva los pedidos anteriores.</p>
 {query.isPending && <p role="status">Cargando variantes…</p>}{query.isError && <p role="alert">No se pudieron consultar las variantes. <button onClick={()=>void query.refetch()} className="underline">Reintentar</button></p>}
 <div className="space-y-2">{query.data?.map(v=><button key={v.id} type="button" onClick={()=>{setEditing(v.id);setForm({label:v.label,color_hex:v.color_hex||'#3c096c',image_url:v.image_url||'',inventory:String(v.inventory),delta:String(v.price_delta_cents/100),is_active:v.is_active,sku:v.sku||''});}} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] p-3 text-left text-sm"><span className="flex items-center gap-2"><span className="h-4 w-4 rounded-full" style={{background:v.color_hex||'#3c096c'}} />{v.label}</span><span>{v.inventory} unidades · {v.is_active?'Visible':'Oculta'}</span></button>)}</div>
 <form onSubmit={event=>{event.preventDefault();save.mutate();}} className="space-y-4 rounded-xl border border-[var(--color-border)] p-4"><h3 className="font-semibold">{editing?'Editar variante':'Nueva variante'}</h3><div className="grid gap-4 sm:grid-cols-2">{([{key:'label',label:'Color y talla',type:'text'},{key:'sku',label:'Código SKU (opcional)',type:'text'},{key:'color_hex',label:'Color hexadecimal',type:'text'},{key:'image_url',label:'Imagen: URL o ruta',type:'text'},{key:'inventory',label:'Existencias',type:'number'},{key:'delta',label:'Diferencia de precio en USD',type:'number'}] as const).map(field=><div key={field.key}><Label htmlFor={`variant-${field.key}`}>{field.label}</Label><Input id={`variant-${field.key}`} type={field.type} step={field.key==='delta'?'0.01':undefined} min={field.key==='inventory'?0:undefined} required={field.key==='label'} value={form[field.key]} onChange={event=>setForm({...form,[field.key]:event.target.value})} /></div>)}</div><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={event=>setForm({...form,is_active:event.target.checked})} />Mostrar variante en la tienda</label><div className="flex gap-2"><Button disabled={save.isPending||query.isPending||query.isError} type="submit">{save.isPending?'Guardando…':'Guardar variante'}</Button><Button variant="outline" type="button" onClick={()=>{setEditing(null);setForm(empty);}}>Nueva variante</Button></div></form></div></AccessibleDialog>;
}
