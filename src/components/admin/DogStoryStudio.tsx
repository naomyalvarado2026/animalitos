import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, HandHeart, Image, Plus, RotateCcw, Save, Share2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ResilientImage } from '@/components/ui/ResilientImage';
import { DogSocialCardPreview } from '@/components/public/DogSocialCardPreview';
import { REFUGE_DOG_PROFILES } from '@/data/refugeDogProfiles';
import type { DogEditorialProfile, DogStoryMilestone } from '@/data/dogEditorialProfiles';
import {
  getAllDogEditorial,
  getSponsorshipIntents,
  resetDogEditorial,
  saveDogEditorial,
} from '@/lib/dogEditorialStore';
import { assetUrl } from '@/lib/assets';

const APPEARANCES = [
  ['home', 'Inicio'],
  ['adoption', 'Adoptar'],
  ['donations', 'Donaciones'],
  ['volunteer', 'Voluntariado'],
  ['store', 'Tienda'],
] as const;

function cloneProfile(profile: DogEditorialProfile): DogEditorialProfile {
  return { ...profile, gallery_urls: [...profile.gallery_urls], appearances: [...profile.appearances], timeline: profile.timeline.map((item) => ({ ...item })) };
}

export function DogStoryStudio() {
  const [profiles, setProfiles] = useState(() => getAllDogEditorial());
  const [selectedSlug, setSelectedSlug] = useState(profiles[0]?.slug ?? 'blanquita');
  const selected = profiles.find((item) => item.slug === selectedSlug) ?? profiles[0];
  const [draft, setDraft] = useState<DogEditorialProfile>(() => cloneProfile(selected));
  const intents = useMemo(() => getSponsorshipIntents(), []);
  const animal = REFUGE_DOG_PROFILES.find((item) => item.adoption_slug === selectedSlug) ?? REFUGE_DOG_PROFILES[0];

  useEffect(() => {
    if (selected) setDraft(cloneProfile(selected));
  }, [selectedSlug]);

  function update<K extends keyof DogEditorialProfile>(key: K, value: DogEditorialProfile[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateMilestone(index: number, patch: Partial<DogStoryMilestone>) {
    update('timeline', draft.timeline.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  function addMilestone() {
    update('timeline', [...draft.timeline, { id: `${draft.slug}-${Date.now()}`, eyebrow: 'Nuevo capítulo', title: 'Título del momento', description: 'Describe este momento de su historia con hechos verificados.' }]);
  }

  function save() {
    const normalized = {
      ...draft,
      voice_line: draft.voice_line.trim(),
      social_caption: draft.social_caption.trim(),
      sponsor_focus: draft.sponsor_focus.trim(),
      cover_image_url: draft.cover_image_url.trim(),
      gallery_urls: draft.gallery_urls.map((url) => url.trim()).filter(Boolean),
    };
    saveDogEditorial(normalized);
    setProfiles(getAllDogEditorial());
    setDraft(cloneProfile(normalized));
    toast.success(`Historia de ${animal.name} guardada en este dispositivo.`);
  }

  function restore() {
    resetDogEditorial(draft.slug);
    const refreshed = getAllDogEditorial();
    setProfiles(refreshed);
    setDraft(cloneProfile(refreshed.find((item) => item.slug === draft.slug) ?? refreshed[0]));
    toast.success('Se restauró la versión editorial original.');
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2"><Badge variant="warm">Nuevo estudio editorial</Badge><Badge variant="outline">Guardado local · listo para Supabase</Badge></div>
          <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Historias de la manada</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">Edita la voz, la cronología, los encuadres y las apariciones públicas desde una sola fuente. Los cambios se reflejan de inmediato en este navegador.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={restore}><RotateCcw className="h-4 w-4" /> Restaurar</Button>
          <Button variant="warm" onClick={save}><Save className="h-4 w-4" /> Guardar historia</Button>
        </div>
      </div>

      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {profiles.map((profile) => {
          const dog = REFUGE_DOG_PROFILES.find((item) => item.adoption_slug === profile.slug);
          return <button key={profile.slug} type="button" onClick={() => setSelectedSlug(profile.slug)} className={`group min-w-28 snap-start overflow-hidden rounded-2xl border text-left transition ${profile.slug === selectedSlug ? 'border-[#f0644a] ring-2 ring-[#f0644a]/20' : 'border-[var(--color-border)] hover:border-[#f0644a]/50'}`}><ResilientImage src={assetUrl(profile.cover_image_url)} alt={dog?.name ?? profile.slug} className="aspect-[4/3] w-full object-cover" style={{ objectPosition: `${profile.focal_x}% ${profile.focal_y}%` }} /><span className="block bg-[var(--color-card)] px-3 py-2 text-sm font-bold">{dog?.name ?? profile.slug}</span></button>;
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Share2 className="h-5 w-5 text-[#f0644a]" /> Voz y mensaje</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2"><Label htmlFor="voice-line">Voz de {animal.name}</Label><Textarea id="voice-line" rows={3} value={draft.voice_line} onChange={(event) => update('voice_line', event.target.value)} /><p className="text-xs text-[var(--color-muted-foreground)]">Usa hechos reales y una voz respetuosa. El “ME” conecta naturalmente con AdoptaME.</p></div>
              <div className="space-y-2"><Label htmlFor="social-caption">Texto para redes</Label><Textarea id="social-caption" rows={4} value={draft.social_caption} onChange={(event) => update('social_caption', event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="sponsor-focus">En qué ayuda su apadrinamiento</Label><Textarea id="sponsor-focus" rows={3} value={draft.sponsor_focus} onChange={(event) => update('sponsor_focus', event.target.value)} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Capítulos de su historia</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {draft.timeline.map((milestone, index) => <div key={milestone.id} className="rounded-2xl border border-[var(--color-border)] p-4"><div className="mb-3 flex items-center justify-between"><Badge variant="outline">Capítulo {index + 1}</Badge><Button type="button" variant="ghost" size="icon" aria-label={`Eliminar capítulo ${index + 1}`} onClick={() => update('timeline', draft.timeline.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4 text-[var(--color-destructive)]" /></Button></div><div className="grid gap-3 sm:grid-cols-2"><Input aria-label="Etiqueta del capítulo" value={milestone.eyebrow} onChange={(event) => updateMilestone(index, { eyebrow: event.target.value })} /><Input aria-label="Título del capítulo" value={milestone.title} onChange={(event) => updateMilestone(index, { title: event.target.value })} /></div><Textarea aria-label="Descripción del capítulo" className="mt-3" rows={3} value={milestone.description} onChange={(event) => updateMilestone(index, { description: event.target.value })} /></div>)}
              <Button type="button" variant="outline" onClick={addMilestone}><Plus className="h-4 w-4" /> Añadir capítulo</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Image className="h-5 w-5 text-[#f0644a]" /> Biblioteca visual</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2"><Label htmlFor="cover-image">Imagen principal</Label><Input id="cover-image" value={draft.cover_image_url} onChange={(event) => update('cover_image_url', event.target.value)} /></div>
              <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="focal-x">Foco horizontal · {draft.focal_x}%</Label><input id="focal-x" className="w-full accent-[#f0644a]" type="range" min="0" max="100" value={draft.focal_x} onChange={(event) => update('focal_x', Number(event.target.value))} /></div><div className="space-y-2"><Label htmlFor="focal-y">Foco vertical · {draft.focal_y}%</Label><input id="focal-y" className="w-full accent-[#f0644a]" type="range" min="0" max="100" value={draft.focal_y} onChange={(event) => update('focal_y', Number(event.target.value))} /></div></div>
              <div className="space-y-2"><Label htmlFor="gallery-images">Galería · una URL por línea</Label><Textarea id="gallery-images" rows={5} value={draft.gallery_urls.join('\n')} onChange={(event) => update('gallery_urls', event.target.value.split('\n'))} /></div>
              <div><Label>Apariciones sugeridas</Label><div className="mt-3 flex flex-wrap gap-2">{APPEARANCES.map(([value, label]) => { const active = draft.appearances.includes(value); return <button key={value} type="button" onClick={() => update('appearances', active ? draft.appearances.filter((item) => item !== value) : [...draft.appearances, value])} className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${active ? 'border-[#f0644a] bg-[#f0644a] text-white' : 'border-[var(--color-border)] hover:border-[#f0644a]'}`}>{label}</button>; })}</div></div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <Card className="overflow-hidden">
            <div className="relative aspect-[4/3] overflow-hidden bg-[#ddd3c6]"><ResilientImage src={assetUrl(draft.cover_image_url)} alt={`Vista previa de ${animal.name}`} className="h-full w-full object-cover" style={{ objectPosition: `${draft.focal_x}% ${draft.focal_y}%` }} /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" /><div className="absolute inset-x-5 bottom-5 text-white"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#ffcf5a]">AdoptaME presenta</p><h2 className="mt-1 font-heading text-4xl font-extrabold">{animal.name}</h2><p className="mt-2 line-clamp-2 text-sm text-white/80">{draft.voice_line}</p></div></div>
            <CardContent className="flex flex-wrap gap-2 pt-5"><Button asChild variant="warm"><Link to={`/adopta/${draft.slug}`} target="_blank">Ver perfil <ExternalLink className="h-4 w-4" /></Link></Button><Button asChild variant="outline"><Link to={`/apadrina/${draft.slug}`} target="_blank"><HandHeart className="h-4 w-4" /> Ver apadrinamiento</Link></Button></CardContent>
          </Card>
          <DogSocialCardPreview animal={animal} editorial={draft} compact />
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><HandHeart className="h-5 w-5 text-[#f0644a]" /> Interés en apadrinar</CardTitle></CardHeader><CardContent><p className="text-3xl font-heading font-extrabold">{intents.length}</p><p className="mt-1 text-sm text-[var(--color-muted-foreground)]">formularios iniciados y guardados localmente</p>{intents.slice(0, 3).map((intent) => <div key={intent.id} className="mt-3 rounded-xl bg-[var(--color-accent)] p-3 text-xs"><p className="font-bold">{intent.supporter_name} · {intent.dog_slug}</p><p className="mt-1 text-[var(--color-muted-foreground)]">{intent.frequency === 'monthly' ? 'Mensual' : 'Una vez'}{intent.amount_usd ? ` · $${intent.amount_usd} USD` : ''}</p></div>)}</CardContent></Card>
        </div>
      </div>
    </div>
  );
}
