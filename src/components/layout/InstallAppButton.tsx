import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { AccessibleDialog } from '@/components/ui/AccessibleDialog';
import { Button } from '@/components/ui/button';

type InstallChoice = { outcome: 'accepted' | 'dismissed'; platform?: string };
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<InstallChoice> };

export function InstallAppButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPrompt | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const installed = window.matchMedia('(display-mode: standalone)').matches
      || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    if (installed) setVisible(false);
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPrompt);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setPromptEvent(null);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function handleInstall() {
    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      setPromptEvent(null);
      if (choice.outcome === 'accepted') {
        setVisible(false);
        return;
      }
    }
    setHelpOpen(true);
  }

  if (!visible) return null;
  return <>
    <Button type="button" size="sm" variant="outline" aria-label="Instalar AdoptaME en este dispositivo" onClick={() => void handleInstall()} className="px-2.5 sm:px-3">
      <Download className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Instalar</span>
    </Button>
    <AccessibleDialog open={helpOpen} onClose={() => setHelpOpen(false)} title="Instala AdoptaME">
      <div className="space-y-4 px-5 py-5 text-sm leading-relaxed sm:px-7">
        <p>Agrega AdoptaME a tu pantalla de inicio para abrirlo como una app.</p>
        <div className="rounded-2xl bg-[var(--color-background)] p-4">
          <p className="font-bold">En iPhone o iPad</p>
          <p className="mt-1">Abre esta página en Safari, toca Compartir, elige “Añadir a pantalla de inicio” y activa “Abrir como app”.</p>
        </div>
        <div className="rounded-2xl bg-[var(--color-background)] p-4">
          <p className="font-bold">En Android</p>
          <p className="mt-1">En Chrome, abre el menú ⋮ y toca “Instalar app” o “Añadir a pantalla de inicio”.</p>
        </div>
        <Button type="button" variant="warm" onClick={() => setHelpOpen(false)} data-dialog-autofocus>Cerrar</Button>
      </div>
    </AccessibleDialog>
  </>;
}
