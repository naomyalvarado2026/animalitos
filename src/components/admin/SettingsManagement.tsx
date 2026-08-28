import { useState, useEffect } from 'react';
import { Settings, Save, Shield, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

export function SettingsManagement() {
  const [shelterName, setShelterName] = useState('AdoptaME');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['admin-site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('key, value').in('key', ['shelter_name', 'shelter_email', 'shelter_phone', 'shelter_address']);
      if (error) throw error;
      return Object.fromEntries((data ?? []).map(item => [item.key, item.value]));
    },
  });

  useEffect(() => {
    if (settingsData) {
      if (settingsData.shelter_name) setShelterName(settingsData.shelter_name);
      if (settingsData.shelter_email) setEmail(settingsData.shelter_email);
      if (settingsData.shelter_phone) setPhone(settingsData.shelter_phone);
      if (settingsData.shelter_address) setAddress(settingsData.shelter_address);
    }
  }, [settingsData]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('site_settings').upsert([
      { key: 'shelter_name', value: shelterName.trim() },
      { key: 'shelter_email', value: email.trim() },
      { key: 'shelter_phone', value: phone.trim() },
      { key: 'shelter_address', value: address.trim() },
    ], { onConflict: 'key' });
    setSaving(false);
    if (error) {
      toast.error('No se pudo guardar. Verifica la conexión con Supabase.');
      return;
    }
    toast.success('Configuración guardada correctamente.');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-[var(--color-primary)]" />
            Configuración General
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            Parámetros globales de la organización y el sitio web.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos de la Organización</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] py-6">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando configuración...
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="sName">Nombre del Refugio</Label>
                  <Input id="sName" value={shelterName} onChange={e => setShelterName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sEmail">Email de Contacto</Label>
                  <Input id="sEmail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contacto@adoptame.org" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sPhone">Teléfono Principal</Label>
                  <Input id="sPhone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+57 300 123 4567" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sAddress">Dirección Oficial</Label>
                  <Input id="sAddress" value={address} onChange={e => setAddress(e.target.value)} placeholder="Av. Principal #123" />
                </div>
              </div>

              <Button type="submit" variant="warm" className="mt-4" disabled={saving}>
                <Save className="h-4 w-4 mr-2" /> {saving ? 'Guardando…' : 'Guardar Ajustes'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
