import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from './useOnlineStatus';

export function OfflineStatusNotice() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div role="status" aria-live="polite" className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
      <div className="mx-auto flex max-w-7xl items-start gap-2.5">
        <WifiOff aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
        <p><strong>Estás sin conexión.</strong> Puedes consultar perfiles y recursos guardados, que podrían estar desactualizados. Formularios, solicitudes, donaciones y pedidos necesitan internet.</p>
      </div>
    </div>
  );
}
