import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { isNativeAndroidApp } from '@/lib/androidApp';

function isAppExperience() {
  const standalone = window.matchMedia('(display-mode: standalone)').matches
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return standalone || isNativeAndroidApp() || new URLSearchParams(window.location.search).get('app') === '1';
}

export function PwaAccountBar() {
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  if (!user || !isAppExperience()) return null;

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
  }

  return (
    <div className="border-b border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2.5 text-[var(--color-foreground)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <p className="min-w-0 truncate text-xs text-[var(--color-muted-foreground)]">Hay una sesión iniciada en este dispositivo.</p>
        <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={() => void handleSignOut()} disabled={signingOut}>
          <LogOut aria-hidden="true" className="h-4 w-4" />
          {signingOut ? 'Cerrando…' : 'Cerrar sesión'}
        </Button>
      </div>
    </div>
  );
}

