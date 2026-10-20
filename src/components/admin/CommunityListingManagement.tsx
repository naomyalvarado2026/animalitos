import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, CheckCircle2, Edit2, Heart, ImagePlus, Megaphone, Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ResilientImage } from '@/components/ui/ResilientImage';

type ListingStatus = 'draft' | 'published' | 'adopted' | 'archived';
type Species = 'dog' | 'cat';
type Gender = 'female' | 'male' | 'unknown';
type Size = 'small' | 'medium' | 'large' | 'unknown';
type Vaccination = 'unknown' | 'up_to_date' | 'pending';

interface ListingContact {
  listing_id: string;
  contact_name: string;
  whatsapp_number: string;
  share_whatsapp: boolean;
}

interface CommunityListing {
  id: string;
  name: string;
  slug: string;
  species: Species;
  breed: string | null;
  age_label: string;
  gender: Gender;
  size: Size;
  city: string;
  province: string;
  description: string;
  main_image_url: string;
  gallery_urls: string[];
  vaccination_status: Vaccination;
  sterilized: boolean | null;
  is_special_needs: boolean;
  special_notes: string | null;
  status: ListingStatus;
  expires_at: string;
  created_at: string;
  updated_at: string;
  contact?: ListingContact;
}

interface ListingForm {
  name: string;
  species: Species;
  breed: string;
  age_label: string;
  gender: Gender;
  size: Size;
  city: string;
  province: string;
  description: string;
  main_image_url: string;
  gallery_urls: string[];
  vaccination_status: Vaccination;
  sterilized: 'yes' | 'no' | 'unknown';
  is_special_needs: boolean;
  special_notes: string;
  contact_name: string;
  whatsapp_number: string;
  share_whatsapp: boolean;
}

const EMPTY_FORM: ListingForm = {
  name: '',
  species: 'dog',
  breed: '',
  age_label: 'Edad por confirmar',
  gender: 'unknown',
  size: 'unknown',
  city: 'Milagro',
  province: 'Guayas',
  description: '',
  main_image_url: '',
  gallery_urls: [],
  vaccination_status: 'unknown',
  sterilized: 'unknown',
  is_special_needs: false,
  special_notes: '',
  contact_name: '',
  whatsapp_number: '',
  share_whatsapp: false,
};

function slugify(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function toWhatsappDigits(value: string) {
  const digits = value.replace(/[^0-9]/g, '');
  if (digits.startsWith('593')) return digits;
  if (digits.startsWith('0')) return '593' + digits.slice(1);
  if (digits.length === 9 && digits.startsWith('9')) return '593' + digits;
  return digits;
}

function toListingForm(item: CommunityListing): ListingForm {
  return {
    name: item.name,
    species: item.species,
    breed: item.breed ?? '',
    age_label: item.age_label,
    gender: item.gender,
    size: item.size,
    city: item.city,
    province: item.province,
    description: item.description,
    main_image_url: item.main_image_url,
    gallery_urls: item.gallery_urls ?? [item.main_image_url],
    vaccination_status: item.vaccination_status,
    sterilized: item.sterilized === true ? 'yes' : item.sterilized === false ? 'no' : 'unknown',
    is_special_needs: item.is_special_needs,
    special_notes: item.special_notes ?? '',
    contact_name: item.contact?.contact_name ?? '',
    whatsapp_number: item.contact?.whatsapp_number ?? '',
    share_whatsapp: item.contact?.share_whatsapp ?? false,
  };
}

async function preparePhoto(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) throw new Error('Selecciona archivos de imagen.');
  if (typeof createImageBitmap !== 'function') return file;
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
  canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
  const context = canvas.getContext('2d');
  if (!context) return file;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82));
  if (!blob) return file;
  return new File([blob], 'animal.webp', { type: 'image/webp' });
}

function statusLabel(status: ListingStatus) {
  return status === 'published' ? 'Publicado' : status === 'adopted' ? 'Adoptado' : status === 'archived' ? 'Archivado' : 'Borrador';
}

export function CommunityListingManagement() {
  const qc = useQueryClient();
  const { hasAccessLevel } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ListingForm>(EMPTY_FORM);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: listings = [], isLoading, isError } = useQuery({
    queryKey: ['admin-community-listings'],
    queryFn: async () => {
      const [listingsResult, contactsResult] = await Promise.all([
        supabase.from('community_adoption_listings').select('*').order('created_at', { ascending: false }),
        supabase.from('community_adoption_listing_contacts').select('*'),
      ]);
      if (listingsResult.error) throw listingsResult.error;
      if (contactsResult.error) throw contactsResult.error;
      const contacts = new Map(((contactsResult.data ?? []) as ListingContact[]).map((contact) => [contact.listing_id, contact]));
      return ((listingsResult.data ?? []) as CommunityListing[]).map((item) => ({ ...item, contact: contacts.get(item.id) }));
    },
  });

  useEffect(() => {
    if (!photoFiles.length) {
      setPhotoPreviews([]);
      return;
    }
    const urls = photoFiles.map((file) => URL.createObjectURL(file));
    setPhotoPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [photoFiles]);

  const filteredListings = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return listings;
    return listings.filter((item) => [item.name, item.breed, item.city, item.contact?.contact_name].some((value) => (value ?? '').toLowerCase().includes(needle)));
  }, [listings, search]);

  function update<K extends keyof ListingForm>(key: K, value: ListingForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setPhotoFiles([]);
  }

  function startEdit(item: CommunityListing) {
    setEditingId(item.id);
    setForm(toListingForm(item));
    setPhotoFiles([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function uploadSelectedPhotos() {
    const urls: string[] = [];
    for (const photo of photoFiles) {
      const prepared = await preparePhoto(photo);
      const extension = prepared.type === 'image/webp' ? 'webp' : prepared.type === 'image/png' ? 'png' : 'jpg';
      const path = 'community-listings/' + crypto.randomUUID() + '.' + extension;
      const { error } = await supabase.storage.from('community-animal-photos').upload(path, prepared, {
        cacheControl: '31536000',
        contentType: prepared.type,
        upsert: false,
      });
      if (error) throw error;
      urls.push(supabase.storage.from('community-animal-photos').getPublicUrl(path).data.publicUrl);
    }
    return urls;
  }

  async function persistListing(item: CommunityListing, status: ListingStatus, contact: ListingContact) {
    const expiresAt = status === 'published'
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : item.expires_at;
    const listingPayload = {
      id: item.id,
      name: item.name,
      slug: item.slug,
      species: item.species,
      breed: item.breed,
      age_label: item.age_label,
      gender: item.gender,
      size: item.size,
      city: item.city,
      province: item.province,
      description: item.description,
      main_image_url: item.main_image_url,
      gallery_urls: item.gallery_urls,
      vaccination_status: item.vaccination_status,
      sterilized: item.sterilized,
      is_special_needs: item.is_special_needs,
      special_notes: item.special_notes,
      status,
      expires_at: expiresAt,
    };
    const contactPayload = {
      contact_name: contact.contact_name,
      whatsapp_number: toWhatsappDigits(contact.whatsapp_number),
      share_whatsapp: contact.share_whatsapp,
    };
    const { error } = await supabase.rpc('save_community_adoption_listing', { p_listing: listingPayload, p_contact: contactPayload });
    if (error) throw error;
  }

  async function saveForm(targetStatus: ListingStatus) {
    if (!hasAccessLevel(4)) {
      toast.error('No tienes permiso para administrar publicaciones.');
      return;
    }
    if (!form.name.trim() || !form.description.trim() || !form.city.trim() || !form.contact_name.trim()) {
      toast.error('Completa nombre, descripción, ciudad y persona de contacto.');
      return;
    }
    const uploadedDigits = toWhatsappDigits(form.whatsapp_number);
    if (uploadedDigits.length < 9 || uploadedDigits.length > 15) {
      toast.error('Revisa el número de WhatsApp de contacto.');
      return;
    }
    if (targetStatus === 'published' && !form.share_whatsapp) {
      toast.error('Para publicar, confirma que autorizaron mostrar el WhatsApp de contacto.');
      return;
    }
    if (!photoFiles.length && !form.main_image_url) {
      toast.error('Agrega al menos una foto del animalito.');
      return;
    }

    setSaving(true);
    try {
      const newPhotoUrls = await uploadSelectedPhotos();
      const gallery = photoFiles.length ? newPhotoUrls : form.gallery_urls;
      const id = editingId ?? crypto.randomUUID();
      const image = gallery[0] ?? form.main_image_url;
      const listing: CommunityListing = {
        id,
        name: form.name.trim(),
        slug: editingId ? (listings.find((item) => item.id === editingId)?.slug ?? slugify(form.name) + '-' + id.slice(0, 8)) : slugify(form.name) + '-' + id.slice(0, 8),
        species: form.species,
        breed: form.breed.trim() || null,
        age_label: form.age_label.trim() || 'Edad por confirmar',
        gender: form.gender,
        size: form.size,
        city: form.city.trim(),
        province: form.province.trim() || 'Guayas',
        description: form.description.trim(),
        main_image_url: image,
        gallery_urls: gallery,
        vaccination_status: form.vaccination_status,
        sterilized: form.sterilized === 'unknown' ? null : form.sterilized === 'yes',
        is_special_needs: form.is_special_needs,
        special_notes: form.special_notes.trim() || null,
        status: targetStatus,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: editingId ? (listings.find((item) => item.id === editingId)?.created_at ?? new Date().toISOString()) : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await persistListing(listing, targetStatus, {
        listing_id: id,
        contact_name: form.contact_name.trim(),
        whatsapp_number: form.whatsapp_number.trim(),
        share_whatsapp: form.share_whatsapp,
      });
      toast.success(targetStatus === 'published' ? 'La publicación ya está visible durante 30 días.' : 'Borrador guardado.');
      resetForm();
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin-community-listings'] }),
        qc.invalidateQueries({ queryKey: ['community-listings'] }),
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar la publicación.');
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(item: CommunityListing, status: ListingStatus) {
    if (status === 'published' && !item.contact?.share_whatsapp) {
      toast.error('Falta la autorización para mostrar el WhatsApp de contacto.');
      return;
    }
    if (status === 'adopted' && !window.confirm('¿Marcar a ' + item.name + ' como adoptado? Dejará de mostrarse en la página pública.')) return;
    try {
      await persistListing(item, status, item.contact ?? { listing_id: item.id, contact_name: '', whatsapp_number: '', share_whatsapp: false });
      toast.success(status === 'adopted' ? '¡Qué buena noticia! La publicación dejó de estar visible.' : status === 'published' ? 'Publicación renovada por 30 días.' : 'Estado actualizado.');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin-community-listings'] }),
        qc.invalidateQueries({ queryKey: ['community-listings'] }),
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el estado.');
    }
  }

  if (!hasAccessLevel(4)) {
    return <Card><CardContent className="p-8 text-center"><h1 className="font-heading text-xl font-bold">Acceso restringido</h1><p className="mt-2 text-sm text-[var(--color-muted-foreground)]">Necesitas permisos de administración para revisar estas publicaciones.</p></CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--color-primary)]">Rescate y comunidad</p>
          <h1 className="mt-1 flex items-center gap-2 font-heading text-2xl font-bold"><Megaphone className="h-6 w-6 text-[var(--color-primary)]" /> Adopciones de la comunidad</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted-foreground)]">Carga desde el celular las fotos que recibes por WhatsApp. Las publicaciones empiezan como borrador y vencen a los 30 días para evitar anuncios desactualizados.</p>
        </div>
        <Button variant="warm" onClick={() => { resetForm(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><Plus className="mr-2 h-4 w-4" />Nueva publicación</Button>
      </header>

      <Card>
        <CardHeader><CardTitle className="text-base">{editingId ? 'Editar publicación' : 'Nueva publicación'}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={(event) => { event.preventDefault(); void saveForm('draft'); }} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="community-name">Nombre o identificación</Label>
              <Input id="community-name" value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Ej. Gatita carey rescatada" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="community-species">Especie</Label>
              <select id="community-species" value={form.species} onChange={(event) => update('species', event.target.value as Species)} className="h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 text-sm">
                <option value="dog">Perro</option><option value="cat">Gato</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="community-breed">Raza (si se conoce)</Label>
              <Input id="community-breed" value={form.breed} onChange={(event) => update('breed', event.target.value)} placeholder="Mestizo, siamés..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="community-age">Edad</Label>
              <Input id="community-age" value={form.age_label} onChange={(event) => update('age_label', event.target.value)} placeholder="3 meses, aprox." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="community-gender">Sexo</Label>
              <select id="community-gender" value={form.gender} onChange={(event) => update('gender', event.target.value as Gender)} className="h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 text-sm">
                <option value="unknown">Por confirmar</option><option value="female">Hembra</option><option value="male">Macho</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="community-size">Tamaño</Label>
              <select id="community-size" value={form.size} onChange={(event) => update('size', event.target.value as Size)} className="h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 text-sm">
                <option value="unknown">Por confirmar</option><option value="small">Pequeño</option><option value="medium">Mediano</option><option value="large">Grande</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="community-city">Ciudad</Label>
              <Input id="community-city" value={form.city} onChange={(event) => update('city', event.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="community-province">Provincia</Label>
              <Input id="community-province" value={form.province} onChange={(event) => update('province', event.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="community-description">Descripción y necesidades confirmadas</Label>
              <Textarea id="community-description" value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Cuenta cómo es, dónde se encuentra y qué hogar necesita." rows={4} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="community-vaccination">Vacunas</Label>
              <select id="community-vaccination" value={form.vaccination_status} onChange={(event) => update('vaccination_status', event.target.value as Vaccination)} className="h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 text-sm">
                <option value="unknown">Por confirmar</option><option value="up_to_date">Al día</option><option value="pending">Pendientes</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="community-sterilized">Esterilización</Label>
              <select id="community-sterilized" value={form.sterilized} onChange={(event) => update('sterilized', event.target.value as ListingForm['sterilized'])} className="h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 text-sm">
                <option value="unknown">Por confirmar</option><option value="yes">Sí</option><option value="no">No</option>
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="community-photos">Fotos del animalito (hasta 5)</Label>
              <input id="community-photos" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" multiple onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                if (files.length > 5) { toast.error('Puedes subir hasta 5 fotos.'); event.target.value = ''; return; }
                if (files.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) { toast.error('Usa fotos JPG, PNG o WebP.'); event.target.value = ''; return; }
                if (files.some((file) => file.size > 12 * 1024 * 1024)) { toast.error('Cada foto debe pesar menos de 12 MB.'); event.target.value = ''; return; }
                setPhotoFiles(files);
                event.target.value = '';
              }} className="block min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--color-accent)] file:px-3 file:py-2 file:text-sm file:font-semibold" />
              <p className="text-xs text-[var(--color-muted-foreground)]">Las imágenes se reducen antes de subirlas. Si eliges fotos nuevas al editar, reemplazarán la galería actual.</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Antes de publicar, usa fotos centradas en el animal y verifica que no aparezcan capturas de WhatsApp, teléfonos, direcciones ni rostros sin permiso.</p>
              {(photoPreviews.length ? photoPreviews : form.gallery_urls).length > 0 && <div className="grid grid-cols-3 gap-2 pt-2 sm:grid-cols-5">{(photoPreviews.length ? photoPreviews : form.gallery_urls).map((url, index) => <ResilientImage key={url + index} src={url} alt={'Vista previa ' + (index + 1)} className="aspect-square w-full rounded-xl object-cover" />)}</div>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="community-contact-name">Persona de contacto</Label>
              <Input id="community-contact-name" value={form.contact_name} onChange={(event) => update('contact_name', event.target.value)} placeholder="Nombre de quien ofrece al animal" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="community-whatsapp">WhatsApp de contacto</Label>
              <Input id="community-whatsapp" inputMode="tel" value={form.whatsapp_number} onChange={(event) => update('whatsapp_number', event.target.value)} placeholder="09... o +593..." required />
              <p className="text-xs text-[var(--color-muted-foreground)]">El número queda privado hasta que marques la autorización de publicación.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="community-special-needs">Cuidados especiales</Label>
              <label className="flex min-h-10 items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 text-sm">
                <input id="community-special-needs" type="checkbox" checked={form.is_special_needs} onChange={(event) => update('is_special_needs', event.target.checked)} />
                Requiere cuidados adicionales
              </label>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="community-special-notes">Detalle de cuidados</Label>
              <Input id="community-special-notes" value={form.special_notes} onChange={(event) => update('special_notes', event.target.value)} placeholder="Solo datos confirmados" />
            </div>

            <div className="sm:col-span-2 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/25 dark:text-amber-100">
              <label className="flex items-start gap-3">
                <input type="checkbox" checked={form.share_whatsapp} onChange={(event) => update('share_whatsapp', event.target.checked)} className="mt-1" />
                <span><strong>Autorización para publicar el contacto.</strong> La persona confirmó que podemos mostrar este WhatsApp en el anuncio para que las familias interesadas le escriban directamente. Es obligatorio para publicar; el número no aparece en borradores.</span>
              </label>
            </div>

            <div className="sm:col-span-2 flex flex-wrap justify-end gap-2 border-t border-[var(--color-border)] pt-4">
              {editingId && <Button type="button" variant="ghost" onClick={resetForm}><X className="mr-2 h-4 w-4" />Cancelar edición</Button>}
              <Button type="submit" disabled={saving}><ImagePlus className="mr-2 h-4 w-4" />{saving ? 'Guardando…' : 'Guardar borrador'}</Button>
              <Button type="button" variant="warm" disabled={saving} onClick={() => void saveForm('published')}><Megaphone className="mr-2 h-4 w-4" />{saving ? 'Guardando…' : 'Publicar por 30 días'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">{listings.length} publicación(es)</CardTitle>
          <div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar nombre, ciudad o contacto" className="pl-9" /></div>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">Cargando publicaciones…</p>
            : isError ? <p role="alert" className="py-8 text-center text-sm text-[var(--color-destructive)]">No se pudieron cargar los anuncios. Verifica que esté aplicada la migración de adopciones comunitarias.</p>
              : filteredListings.length === 0 ? <div className="py-8 text-center"><Heart className="mx-auto h-8 w-8 text-[var(--color-muted-foreground)]" /><p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{search ? 'No hay coincidencias.' : 'Aquí aparecerán los borradores y anuncios recibidos por WhatsApp.'}</p></div>
                : <div className="divide-y divide-[var(--color-border)]">{filteredListings.map((item) => {
                  const expired = item.status === 'published' && new Date(item.expires_at).getTime() <= Date.now();
                  return <div key={item.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                    <ResilientImage src={item.main_image_url} alt={item.name} className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><h3 className="font-heading font-bold">{item.name}</h3><Badge variant={item.status === 'published' ? 'success' : item.status === 'adopted' ? 'warm' : 'outline'}>{expired ? 'Vencido' : statusLabel(item.status)}</Badge><Badge variant="secondary">{item.species === 'cat' ? 'Gato' : 'Perro'}</Badge></div>
                      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{item.city}, {item.province} · {item.age_label} · Contacto: {item.contact?.contact_name ?? 'sin registrar'}</p>
                      <p className="mt-1 break-all text-xs text-[var(--color-muted-foreground)]">{item.contact?.whatsapp_number ?? ''}{item.contact?.share_whatsapp ? ' · WhatsApp público autorizado' : ' · WhatsApp privado'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEdit(item)}><Edit2 className="mr-1.5 h-3.5 w-3.5" />Editar</Button>
                      {item.status !== 'published' && item.status !== 'adopted' && item.status !== 'archived' && <Button size="sm" variant="warm" onClick={() => void changeStatus(item, 'published')}><Megaphone className="mr-1.5 h-3.5 w-3.5" />Publicar</Button>}
                      {item.status === 'published' && <Button size="sm" variant="outline" onClick={() => void changeStatus(item, 'adopted')}><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Adoptado</Button>}
                      {item.status !== 'archived' && item.status !== 'adopted' && <Button size="sm" variant="ghost" onClick={() => void changeStatus(item, 'archived')}><Archive className="mr-1.5 h-3.5 w-3.5" />Archivar</Button>}
                    </div>
                  </div>;
                })}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
