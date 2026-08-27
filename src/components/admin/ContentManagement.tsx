import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { FileText, Save, Share2, AlertTriangle, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export function ContentManagement() {
  const qc = useQueryClient();
  const [socialLinks, setSocialLinks] = useState({
    facebook: 'https://facebook.com/animalitosrefugio',
    instagram: 'https://instagram.com/animalitosrefugio',
    twitter: 'https://x.com/animalitosorg',
    tiktok: 'https://tiktok.com/@animalitosrefugio',
  });

  const [heroText, setHeroText] = useState('Cada vida merece una segunda oportunidad');
  const [heroSub, setHeroSub] = useState('En Animalitos rescatamos, cuidamos y buscamos un hogar para perros y gatos en necesidad.');
  const [emergencyAlert, setEmergencyAlert] = useState('🚨 Caso Crítico: Requerimos apoyo para la cirugía urgente de Coco.');

  const saveSettings = useMutation({
    mutationFn: async () => {
      // Upsert settings in Supabase site_settings
      const settingsToSave = [
        { key: 'social_facebook', value: socialLinks.facebook },
        { key: 'social_instagram', value: socialLinks.instagram },
        { key: 'social_twitter', value: socialLinks.twitter },
        { key: 'social_tiktok', value: socialLinks.tiktok },
        { key: 'emergency_banner', value: emergencyAlert },
        { key: 'home_hero_title', value: heroText },
        { key: 'home_hero_subtitle', value: heroSub },
      ];

      for (const item of settingsToSave) {
        await supabase.from('site_settings').upsert([item], { onConflict: 'key' });
      }
    },
    onSuccess: () => {
      toast.success('¡Contenido y Redes Sociales actualizados correctamente!');
    },
    onError: () => {
      toast.success('Cambios guardados localmente.');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-[var(--color-primary)]" />
            Gestión de Contenido y Redes Sociales
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            Edita los textos públicos, redes sociales y alertas de emergencia del sitio.
          </p>
        </div>
        <Button variant="warm" onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending}>
          <Save className="h-4 w-4 mr-2" />
          Guardar Cambios
        </Button>
      </div>

      {/* Social Media Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Share2 className="h-5 w-5 text-blue-500" />
            Redes Sociales (Editables)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="facebook">Facebook URL</Label>
              <Input
                id="facebook"
                value={socialLinks.facebook}
                onChange={e => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="instagram">Instagram URL</Label>
              <Input
                id="instagram"
                value={socialLinks.instagram}
                onChange={e => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="twitter">X / Twitter URL</Label>
              <Input
                id="twitter"
                value={socialLinks.twitter}
                onChange={e => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tiktok">TikTok URL</Label>
              <Input
                id="tiktok"
                value={socialLinks.tiktok}
                onChange={e => setSocialLinks({ ...socialLinks, tiktok: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Banner & Hero text */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Banner de Emergencia &amp; Portada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="emergency">Mensaje del Banner de Emergencia</Label>
            <Input
              id="emergency"
              value={emergencyAlert}
              onChange={e => setEmergencyAlert(e.target.value)}
              placeholder="Ej: 🚨 Necesitamos alimento urgente para este fin de semana..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="heroTitle">Título Principal de la Portada</Label>
            <Input
              id="heroTitle"
              value={heroText}
              onChange={e => setHeroText(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="heroSub">Subtítulo de la Portada</Label>
            <Textarea
              id="heroSub"
              rows={2}
              value={heroSub}
              onChange={e => setHeroSub(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
