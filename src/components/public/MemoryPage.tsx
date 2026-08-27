import { Heart, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { assetUrl } from '@/lib/assets';
import { ResilientImage } from '@/components/ui/ResilientImage';

export function MemoryPage() {
  const memorialQuery = useQuery({ queryKey: ['public-memory-memorials'], queryFn: async () => { const { data, error } = await supabase.from('memory_memorials').select('id, animal_name, tribute, image_url, rescue_date, passing_date').eq('is_published', true).order('passing_date', { ascending: false }); if (error) throw error; return data ?? []; }, staleTime: 60_000 });
  return (
    <div className="pt-16">
      <section className="bg-[#171717] text-[#fffdf9] py-20 sm:py-28"><div className="max-w-4xl mx-auto px-5 sm:px-8 text-center"><Sparkles className="h-9 w-9 text-[#ff8069] mx-auto" /><p className="text-[#ff8069] uppercase tracking-[.16em] text-sm font-bold mt-6">En memoria de</p><h1 className="font-heading text-5xl sm:text-7xl font-extrabold tracking-[-.06em] mt-3">Las huellas que siguen con nosotros.</h1><p className="text-white/70 text-lg leading-relaxed mt-6 max-w-2xl mx-auto">Un espacio para honrar a los perritos que pasaron por AdoptaME y dejaron una historia en nuestra manada.</p></div></section>
      <section className="py-24 max-w-5xl mx-auto px-5 sm:px-8">{memorialQuery.data?.length ? <div className="grid gap-7 md:grid-cols-2">{memorialQuery.data.map((item) => <article key={item.id} className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)]">{item.image_url ? <ResilientImage src={assetUrl(item.image_url)} alt={`Homenaje a ${item.animal_name}`} className="h-64 w-full object-cover" /> : <div className="flex h-40 items-center justify-center bg-[#ede5da]"><Heart className="h-12 w-12 text-[#f0644a]" /></div>}<div className="p-7"><p className="text-xs font-bold uppercase tracking-[.15em] text-[#f0644a]">{item.passing_date}</p><h2 className="mt-2 font-heading text-3xl font-extrabold">{item.animal_name}</h2><p className="mt-4 leading-relaxed text-[var(--color-muted-foreground)]">{item.tribute}</p></div></article>)}</div> : <div className="mx-auto max-w-3xl text-center"><Heart className="h-10 w-10 text-[#f0644a] fill-current mx-auto" /><h2 className="font-heading text-3xl font-extrabold mt-5">Un espacio para recordar.</h2><p className="text-[var(--color-muted-foreground)] leading-relaxed mt-4">Los homenajes aparecerán aquí con autorización y respeto cuando el equipo los publique.</p></div>}</section>
    </div>
  );
}
