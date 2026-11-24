import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isNativeAndroidApp } from '@/lib/androidApp';

export function InstallAppButton() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    if (standalone || isNativeAndroidApp()) {
      setHidden(true);
    }

    const onInstalled = () => setHidden(true);
    window.addEventListener('appinstalled', onInstalled);
    return () => window.removeEventListener('appinstalled', onInstalled);
  }, []);

  if (hidden) return null;

  return (
    <Button size="sm" variant="outline" asChild className="px-2.5 sm:px-3">
      <Link to="/app" aria-label="Descargar app Android de AdoptaME">
        <Smartphone className="h-4 w-4 sm:mr-1.5" aria-hidden="true" />
        <span className="hidden sm:inline">App Android</span>
      </Link>
    </Button>
  );
}
