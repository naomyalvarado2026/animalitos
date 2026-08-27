import { useState } from 'react';
import { Settings, Save, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function SettingsManagement() {
  const [shelterName, setShelterName] = useState('Animalitos');
  const [email, setEmail] = useState('hola@animalitos.org');
  const [phone, setPhone] = useState('+1 (234) 567-890');
  const [address, setAddress] = useState('Tu dirección aquí, Ciudad, País');

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
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
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="sName">Nombre del Refugio</Label>
                <Input id="sName" value={shelterName} onChange={e => setShelterName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sEmail">Email de Contacto</Label>
                <Input id="sEmail" type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sPhone">Teléfono Principal</Label>
                <Input id="sPhone" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sAddress">Dirección Oficial</Label>
                <Input id="sAddress" value={address} onChange={e => setAddress(e.target.value)} />
              </div>
            </div>

            <Button type="submit" variant="warm" className="mt-4">
              <Save className="h-4 w-4 mr-2" /> Guardar Ajustes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
