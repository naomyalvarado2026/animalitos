import { Download, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ResilientImage } from '@/components/ui/ResilientImage';
import { assetUrl } from '@/lib/assets';
import { downloadDogSocialCard } from '@/lib/dogSocialCard';
import type { DogEditorialProfile } from '@/data/dogEditorialProfiles';

export function DogSocialCardPreview({ animal, editorial, compact = false }: { animal: { name: string; main_image_url: string }; editorial: DogEditorialProfile; compact?: boolean }) {
  const download = async () => {
    try {
      await downloadDogSocialCard(animal, editorial);
      toast.success('Tarjeta social descargada en formato 1080 × 1350.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo generar la tarjeta.');
    }
  };

  return (
    <div className={`grid gap-5 ${compact ? '' : 'lg:grid-cols-[.78fr_1.22fr] lg:items-center'}`}>
      <div className="mx-auto w-full max-w-sm overflow-hidden rounded-[1.75rem] bg-[#171717] shadow-2xl">
        <div className="relative aspect-[4/3] overflow-hidden">
          <ResilientImage src={assetUrl(editorial.cover_image_url)} alt={`Vista previa social de ${animal.name}`} className="h-full w-full object-cover" style={{ objectPosition: `${editorial.focal_x}% ${editorial.focal_y}%` }} />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#171717] to-transparent" />
          <p className="absolute bottom-4 left-5 font-heading text-4xl font-extrabold text-white">{animal.name}</p>
        </div>
        <div className="p-5 text-white"><p className="font-heading text-lg font-extrabold">Adopta<span className="text-[#f0644a]">ME</span></p><p className="mt-3 line-clamp-4 text-sm leading-relaxed text-white/75">{editorial.voice_line}</p></div>
      </div>
      <div>
        <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.16em] text-[#f0644a]"><Share2 className="h-4 w-4" /> Comparte su oportunidad</p>
        <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-[-.04em]">Una historia puede viajar mucho más lejos.</h2>
        <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted-foreground)]">Descarga una tarjeta vertical lista para Instagram, Facebook o WhatsApp. La imagen conserva el nombre, la voz de {animal.name} y la identidad AdoptaME.</p>
        <Button type="button" variant="warm" className="mt-5" onClick={download}><Download className="h-4 w-4" /> Descargar tarjeta social</Button>
      </div>
    </div>
  );
}
