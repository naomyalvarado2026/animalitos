import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { FileText, Save, Share2, AlertTriangle, ArrowDown, ArrowUp, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ResilientImage } from '@/components/ui/ResilientImage';
import { DEFAULT_FAQS, FAQ_CATEGORIES, resolveFaqItems, validateFaqItems, type FaqItem, type FaqCategory } from '@/lib/faq';

export function ContentManagement() {
  const queryClient = useQueryClient();
  const [socialLinks, setSocialLinks] = useState({
    facebook: '',
    instagram: '',
    twitter: '',
    tiktok: '',
  });

  const [heroText, setHeroText] = useState('Cada vida merece una segunda oportunidad');
  const [heroSub, setHeroSub] = useState('En AdoptaME rescatamos, cuidamos y buscamos un hogar para perros en necesidad.');
  const [emergencyAlert, setEmergencyAlert] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [pageCopy, setPageCopy] = useState({
    resources_intro: '',
    process_intro: '',
    volunteer_intro: '',
    sanctuary_intro: '',
    donations_intro: '',
    about_intro: '',
    about_mission: '',
    about_vision: '',
  });
  const [faqItems, setFaqItems] = useState<FaqItem[]>(DEFAULT_FAQS);

  const updateFaq = (index: number, patch: Partial<FaqItem>) => setFaqItems((items) => items.map((item, current) => current === index ? { ...item, ...patch } : item));
  const moveFaq = (index: number, direction: -1 | 1) => setFaqItems((items) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return items;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });

  const settingsQuery = useQuery({
    queryKey: ['admin-site-content-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('key, value');
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((item) => [item.key, item.value]));
    },
  });

  useEffect(() => {
    const settings = settingsQuery.data;
    if (!settings) return;
    setSocialLinks({
      facebook: settings.social_facebook ?? '',
      instagram: settings.social_instagram ?? '',
      twitter: settings.social_twitter ?? '',
      tiktok: settings.social_tiktok ?? '',
    });
    setHeroText(settings.home_hero_title ?? '');
    setHeroSub(settings.home_hero_subtitle ?? '');
    setEmergencyAlert(settings.emergency_banner ?? '');
    setHeroImageUrl(settings.home_hero_image ?? '');
    setPageCopy({
      resources_intro: settings.resources_intro ?? '',
      process_intro: settings.process_intro ?? '',
      volunteer_intro: settings.volunteer_intro ?? '',
      sanctuary_intro: settings.sanctuary_intro ?? '',
      donations_intro: settings.donations_intro ?? '',
      about_intro: settings.about_intro ?? '',
      about_mission: settings.about_mission ?? '',
      about_vision: settings.about_vision ?? '',
    });
    setFaqItems(resolveFaqItems(settings.faq_items));
  }, [settingsQuery.data]);

  const saveSettings = useMutation({
    mutationFn: async () => {
      const cleanFaqItems = validateFaqItems(faqItems);
      // Upsert settings in Supabase site_settings
      const settingsToSave = [
        { key: 'social_facebook', value: socialLinks.facebook },
        { key: 'social_instagram', value: socialLinks.instagram },
        { key: 'social_twitter', value: socialLinks.twitter },
        { key: 'social_tiktok', value: socialLinks.tiktok },
        { key: 'emergency_banner', value: emergencyAlert },
        { key: 'home_hero_title', value: heroText },
        { key: 'home_hero_subtitle', value: heroSub },
        { key: 'home_hero_image', value: heroImageUrl },
        { key: 'resources_intro', value: pageCopy.resources_intro },
        { key: 'process_intro', value: pageCopy.process_intro },
        { key: 'volunteer_intro', value: pageCopy.volunteer_intro },
        { key: 'sanctuary_intro', value: pageCopy.sanctuary_intro },
        { key: 'donations_intro', value: pageCopy.donations_intro },
        { key: 'about_intro', value: pageCopy.about_intro },
        { key: 'about_mission', value: pageCopy.about_mission },
        { key: 'about_vision', value: pageCopy.about_vision },
        { key: 'faq_items', value: JSON.stringify(cleanFaqItems) },
      ];

      const { error } = await supabase.from('site_settings').upsert(settingsToSave, { onConflict: 'key' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-settings'] });
      toast.success('Contenido y redes actualizados correctamente.');
      void settingsQuery.refetch();
    },
    onError: (error: Error) => toast.error(error.message || 'No pudimos guardar los cambios. Verifica la conexión con Supabase.'),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-[var(--color-primary)]" />
            Gestión de Contenido y Redes Sociales
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            Edita los textos públicos, redes sociales y alertas de emergencia del sitio.
          </p>
        </div>
        <Button variant="warm" className="w-full sm:w-auto" onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending || settingsQuery.isPending || settingsQuery.isError}>
          <Save className="h-4 w-4 mr-2" />
          Guardar Cambios
        </Button>
      </div>

      {settingsQuery.isLoading && <p className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]" role="status">Cargando la configuración actual…</p>}
      {settingsQuery.error && <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100">No pudimos cargar la configuración actual. Revisa las políticas de Supabase antes de editar.</div>}

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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Preguntas frecuentes</CardTitle><Button type="button" variant="outline" size="sm" onClick={() => setFaqItems([...faqItems, { category: 'adoption', question: '', answer: '' }])}>Añadir pregunta</Button></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[var(--color-muted)] p-4"><p className="max-w-xl text-sm text-[var(--color-muted-foreground)]">Una respuesta, varios lugares: el centro de ayuda, el buscador y las páginas de su categoría. Las tres primeras de cada categoría aparecen en el bloque contextual.</p><Link to="/faq" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-primary)]">Ver ayuda pública <ExternalLink className="h-4 w-4" /></Link></div>
          {faqItems.map((faq, index) => (
            <div key={index} className="space-y-4 rounded-2xl border border-[var(--color-border)] p-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="min-w-48 flex-1 space-y-1.5"><Label htmlFor={`faq-category-${index}`}>Dónde aparece la pregunta {index + 1}</Label><select id={`faq-category-${index}`} value={faq.category} onChange={(event) => updateFaq(index, { category: event.target.value as FaqCategory })} className="h-11 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-sm">{Object.entries(FAQ_CATEGORIES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
                <div className="flex gap-1"><Button type="button" variant="outline" size="icon" aria-label={`Subir pregunta ${index + 1}`} disabled={index === 0} onClick={() => moveFaq(index, -1)}><ArrowUp className="h-4 w-4" /></Button><Button type="button" variant="outline" size="icon" aria-label={`Bajar pregunta ${index + 1}`} disabled={index === faqItems.length - 1} onClick={() => moveFaq(index, 1)}><ArrowDown className="h-4 w-4" /></Button><Button type="button" variant="ghost" onClick={() => setFaqItems((items) => items.filter((_, current) => current !== index))} aria-label={`Quitar pregunta ${index + 1}`}>Quitar</Button></div>
              </div>
              <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor={`faq-question-${index}`}>Pregunta</Label><Input id={`faq-question-${index}`} value={faq.question} onChange={(event) => updateFaq(index, { question: event.target.value })} /></div><div className="space-y-2"><Label htmlFor={`faq-answer-${index}`}>Respuesta</Label><Textarea id={`faq-answer-${index}`} rows={3} value={faq.answer} onChange={(event) => updateFaq(index, { answer: event.target.value })} /></div></div>
            </div>
          ))}
          {!faqItems.length && <p className="rounded-xl border border-dashed border-[var(--color-border)] p-5 text-sm">No hay preguntas. Al guardar, los bloques contextuales se ocultarán hasta que publiques nuevas respuestas.</p>}
          <p className="text-xs text-[var(--color-muted-foreground)]">Las preguntas se publican al guardar. No se aceptan filas vacías ni duplicadas. Evita datos personales o promesas que no estén confirmadas.</p>
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
            <Label htmlFor="heroImage">Imagen principal de la Portada</Label>
            <Input id="heroImage" value={heroImageUrl} onChange={e => setHeroImageUrl(e.target.value)} placeholder="URL o ruta pública de la imagen" />
            {heroImageUrl.trim() && <ResilientImage src={heroImageUrl.trim()} alt="Previsualización de la portada" className="mt-3 h-36 w-full max-w-sm rounded-2xl object-cover" />}
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

      <Card>
        <CardHeader><CardTitle className="text-base">Introducciones de páginas</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {([
            ['resources_intro', 'Recursos educativos'],
            ['process_intro', 'Proceso de adopción'],
            ['volunteer_intro', 'Voluntariado / Ayudar'],
            ['sanctuary_intro', 'Santuario'],
            ['donations_intro', 'Donaciones'],
            ['about_intro', 'Introducción de Nosotros'],
            ['about_mission', 'Misión'],
            ['about_vision', 'Visión'],
          ] as const).map(([key, label]) => <div key={key} className="space-y-1.5"><Label htmlFor={key}>{label}</Label><Textarea id={key} rows={3} value={pageCopy[key]} onChange={(event) => setPageCopy({ ...pageCopy, [key]: event.target.value })} placeholder="Escribe una introducción breve y clara…" /></div>)}
          <p className="text-xs text-[var(--color-muted-foreground)] md:col-span-2">Los cambios se reflejan en las páginas públicas después de guardar.</p>
        </CardContent>
      </Card>
    </div>
  );
}
