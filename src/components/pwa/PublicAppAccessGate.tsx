import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { PawPrint, WifiOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { assetUrl } from '@/lib/assets';
import { Button } from '@/components/ui/button';

function isAppLaunch() {
  if (typeof window === 'undefined') return false;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return isStandalone || new URLSearchParams(window.location.search).get('app') === '1';
}

function GoogleMark() {
  return <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.88c-.58 2.96-2.25 5.48-4.73 7.18l7.3 5.67c4.26-3.93 7.53-9.7 7.53-17.32Z"/><path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.79l-7.3-5.67c-2.03 1.36-4.63 2.16-8.61 2.16-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>;
}

function AppSignIn() {
  const { loading, signInWithGoogle } = useAuth();
  const [online, setOnline] = useState(() => navigator.onLine);
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  });

  async function handleGoogleSignIn() {
    setPending(true);
    setErrorMessage('');
    const result = await signInWithGoogle();
    if (result.error) {
      setErrorMessage(result.error.message);
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#17022b] px-5 py-10 text-white" id="main-content">
      <section aria-labelledby="app-signin-title" className="w-full max-w-md rounded-[2rem] border border-white/15 bg-white/[0.07] p-6 shadow-2xl shadow-black/20 backdrop-blur sm:p-9">
        <div className="mb-8 flex justify-center">
          <img src={assetUrl('/brand/logo-negative.webp')} alt="AdoptaME" className="h-auto w-40" width={156} height={37} />
        </div>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ff8069] text-[#17022b]">
          <PawPrint aria-hidden="true" className="h-9 w-9" />
        </div>
        <h1 id="app-signin-title" className="mt-6 text-center font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">Una historia feliz empieza contigo</h1>
        <p className="mt-3 text-center leading-relaxed text-white/75">Inicia sesión con Google para abrir AdoptaME. Este acceso abre la experiencia pública y no asigna roles del refugio.</p>
        <Button type="button" size="lg" variant="warm" className="mt-7 min-h-12 w-full bg-white text-[#17022b] hover:bg-white/90" onClick={() => void handleGoogleSignIn()} disabled={!online || pending || loading}>
          <GoogleMark />
          {pending ? 'Conectando con Google…' : 'Continuar con Google'}
        </Button>
        {!online && <p role="status" className="mt-4 flex items-start gap-2 rounded-xl border border-[#ff8069]/35 bg-[#ff8069]/10 p-3 text-sm text-white/90"><WifiOff aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#ff8069]" />Necesitas conexión a internet para iniciar sesión por primera vez. Cuando vuelvas a conectarte, inténtalo de nuevo.</p>}
        {errorMessage && <p role="alert" className="mt-4 rounded-xl border border-red-300/30 bg-red-400/10 p-3 text-sm text-white">{errorMessage}</p>}
        <p className="mt-6 text-center text-xs leading-relaxed text-white/55">Después del primer acceso, podrás volver a abrir la app sin conexión para consultar los perfiles y recursos guardados. Los formularios y solicitudes necesitan internet.</p>
      </section>
    </main>
  );
}

export function PublicAppAccessGate() {
  const { loading, user } = useAuth();
  if (!isAppLaunch() || user) return <Outlet />;
  if (loading) {
    return <main className="flex min-h-dvh items-center justify-center bg-[#17022b] text-white" aria-live="polite"><div className="text-center"><PawPrint aria-hidden="true" className="mx-auto h-10 w-10 animate-pulse text-[#ff8069]" /><p className="mt-4 text-sm text-white/75">Preparando tu acceso…</p></div></main>;
  }
  return <AppSignIn />;
}
