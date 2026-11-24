import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, ShieldCheck, Sparkles, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { PawBackground } from '@/components/layout/PawBackground';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useOnlineStatus } from '@/components/pwa/useOnlineStatus';
import { assetUrl } from '@/lib/assets';
import {
  APP_GUEST_SESSION_KEY,
  isAppLaunchContext,
  shouldShowStartupAuthGate,
} from '@/lib/appSession';

function readGuestDismissed(): boolean {
  try {
    return sessionStorage.getItem(APP_GUEST_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function AppStartupAuthGate() {
  const { user, profile, loading, signIn } = useAuth();
  const online = useOnlineStatus();
  const location = useLocation();
  const navigate = useNavigate();

  const [guestDismissed, setGuestDismissed] = useState<boolean>(() => readGuestDismissed());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const standalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone));

  const isApp = isAppLaunchContext({
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    search: location.search,
    standalone,
  });

  const visible = shouldShowStartupAuthGate({
    isApp,
    isAuthenticated: Boolean(user && profile?.is_active),
    isLoadingAuth: loading,
    guestDismissed,
    pathname: location.pathname,
  });

  if (!visible) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!online) {
      setErrorMessage('Necesitas conexión a internet para iniciar sesión. Mientras tanto puedes continuar en modo sin conexión.');
      return;
    }

    if (!email.trim() || !password) {
      setErrorMessage('Ingresa tu correo electrónico y contraseña.');
      return;
    }

    setErrorMessage(null);
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);

    if (error) {
      setErrorMessage('No pudimos validar esas credenciales. Verifica tu correo y contraseña.');
      return;
    }

    toast.success('¡Sesión iniciada!', {
      description: 'Ya tienes acceso completo al panel administrativo y herramientas del refugio.',
    });
    navigate('/admin', { replace: true });
  }

  function handleContinueAsGuest() {
    try {
      sessionStorage.setItem(APP_GUEST_SESSION_KEY, '1');
    } catch {
      // Continúa aunque sessionStorage esté restringido.
    }
    setGuestDismissed(true);
    toast('Modo invitado activo', {
      description: 'Puedes navegar incluso sin conexión. Cuando tengas red podrás entrar al panel Admin.',
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="startup-auth-title"
      className="public-shell fixed inset-0 z-[90] overflow-y-auto bg-[var(--color-background)] text-[var(--color-foreground)]"
    >
      <div className="relative flex min-h-full items-center justify-center px-4 py-8 sm:px-6">
        <PawBackground className="opacity-45" />

        <div className="relative z-10 w-full max-w-md space-y-5">
          {/* Encabezado de marca */}
          <div className="text-center">
            <img
              src={assetUrl('/pwa-icon-512.png')}
              alt="AdoptaME"
              width={68}
              height={68}
              className="mx-auto h-17 w-17 rounded-2xl shadow-lg"
            />
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-accent)] px-3 py-1 text-xs font-bold text-[var(--color-accent-foreground)]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              App AdoptaME
            </span>
            <h1
              id="startup-auth-title"
              className="mt-3 font-heading text-2xl font-extrabold tracking-tight sm:text-3xl"
            >
              Inicia sesión para la experiencia completa
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              Accede al panel administrativo, gestión de rescates, pedidos y herramientas sincronizadas del equipo.
            </p>
          </div>

          {/* Formulario de acceso */}
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-xl sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-2 border-b border-[var(--color-border)] pb-3.5">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                Cuenta del equipo / Admin
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  online
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                }`}
              >
                {online ? 'En línea' : 'Sin conexión'}
              </span>
            </div>

            {!online && (
              <div
                role="status"
                className="mb-4 flex items-start gap-2.5 rounded-2xl border border-amber-300 bg-amber-50 p-3.5 text-xs leading-relaxed text-amber-950 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-100"
              >
                <WifiOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  Ahora mismo estás sin conexión. Puedes explorar toda la app en modo invitado y luego iniciar sesión cuando regrese internet.
                </span>
              </div>
            )}

            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="startup-email">Correo electrónico</Label>
                <Input
                  id="startup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="equipo@adoptame.org"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="startup-password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="startup-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-xl border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/10 px-3.5 py-2.5 text-xs font-medium text-[var(--color-destructive)]"
                >
                  {errorMessage}
                </div>
              )}

              <Button
                type="submit"
                variant="warm"
                size="lg"
                disabled={!online || submitting}
                className="w-full"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                {submitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
              </Button>
            </form>
          </div>

          {/* Opción sin sesión con aviso honesto */}
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)]/95 p-5 shadow-md">
            <p className="text-xs leading-relaxed text-[var(--color-muted-foreground)]">
              <strong className="text-[var(--color-foreground)]">¿Solo quieres explorar?</strong>{' '}
              Puedes continuar sin iniciar sesión y usar la app incluso sin conexión para ver perritos,
              tienda y guías, pero <strong className="text-[var(--color-foreground)]">la experiencia no será la misma</strong>:
              no tendrás acceso al panel Admin ni a las herramientas sincronizadas del equipo.
            </p>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleContinueAsGuest}
              className="mt-3.5 w-full"
            >
              Continuar sin iniciar sesión
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
