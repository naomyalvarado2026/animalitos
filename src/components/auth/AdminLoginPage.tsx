import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PawIcon } from '@/components/layout/PawBackground';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});
type FormData = z.infer<typeof schema>;

export function AdminLoginPage() {
  const { user, loading, signIn, signInDemo } = useAuth();
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // If already logged in, redirect
  if (!loading && user) {
    return <Navigate to="/admin" replace />;
  }

  async function onSubmit(data: FormData) {
    setAuthError(null);
    setIsSigningIn(true);
    const { error } = await signIn(data.email, data.password);
    if (error) {
      setAuthError('Credenciales incorrectas. Verifica tu email y contraseña.');
    } else {
      navigate('/admin', { replace: true });
    }
    setIsSigningIn(false);
  }

  function handleDemoLogin() {
    signInDemo();
    navigate('/admin', { replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-4 relative">
      {/* Subtle paw background */}
      <div className="absolute inset-0 paw-pattern opacity-30 pointer-events-none" />

      {/* Theme toggle top-right */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl brand-gradient-bg shadow-lg mb-4">
            <PawIcon size={32} color="white" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-[var(--color-foreground)]">
            Panel Administrativo
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            AdoptaME — Acceso restringido
          </p>
        </div>

        {/* Card */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between gap-2 mb-6 pb-4 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-[var(--color-muted-foreground)]" />
              <span className="text-sm text-[var(--color-muted-foreground)]">Credenciales requeridas</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="naomyalvarado.2026@gmail.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-[var(--color-destructive)]">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password')}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-[var(--color-destructive)]">{errors.password.message}</p>}
            </div>

            {authError && (
              <div className="bg-[var(--color-destructive)]/10 border border-[var(--color-destructive)]/30 rounded-lg px-4 py-3">
                <p className="text-sm text-[var(--color-destructive)]">{authError}</p>
              </div>
            )}

            <Button
              variant="warm"
              size="lg"
              type="submit"
              disabled={isSigningIn}
              className="w-full mt-2"
            >
              {isSigningIn ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-border)]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[var(--color-card)] px-2 text-[var(--color-muted-foreground)]">O también</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="lg"
            type="button"
            onClick={handleDemoLogin}
            className="w-full border-dashed border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium gap-2"
          >
            <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
            Ingreso Rápido Directo (Super Admin)
          </Button>
        </div>

        <p className="text-center text-xs text-[var(--color-muted-foreground)] mt-6">
          Esta página no está enlazada públicamente.
          <br />Si llegaste aquí por error, regresa al{' '}
          <a href="#/" className="text-[var(--color-primary)] hover:underline">sitio principal</a>.
        </p>
      </div>
    </div>
  );
}
