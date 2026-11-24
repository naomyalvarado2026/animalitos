import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type Session, type User } from '@supabase/supabase-js';
import { supabase, isGoogleSignInEnabled } from '@/lib/supabase';
import type { Profile } from '@/types';
import { isNativeAndroidApp } from '@/lib/androidApp';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  authError: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  hasAccessLevel: (level: number) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(() =>
    new URLSearchParams(window.location.search).has('error')
      ? 'No se completó el acceso con Google. Inténtalo de nuevo.' : null,
  );

  useEffect(() => {
    localStorage.removeItem('animalitos_demo_session');

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setLoading(true);
          setTimeout(() => { void fetchProfile(session.user.id); }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Keep activity tracking separate: session objects can change on every auth event.
  useEffect(() => {
    if (!user?.id) return;
    let inactivityTimer: ReturnType<typeof setTimeout>;
    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => { void signOut(); }, 30 * 60 * 1000);
    };
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetInactivityTimer));
    resetInactivityTimer();
    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
    };
  }, [user?.id]);

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        if (localStorage.getItem('adoptame_google_pending') === '1') {
          localStorage.removeItem('adoptame_google_pending');
          if (!data.is_active) {
            await signOut();
            setAuthError('Esta cuenta no tiene acceso activo al equipo. Contacta al administrador.');
            return null;
          }
        }
        setProfile(data as Profile);
        return data as Profile;
      } else {
        if (localStorage.getItem('adoptame_google_pending') === '1') {
          localStorage.removeItem('adoptame_google_pending');
          await signOut();
          setAuthError('Esta cuenta no tiene un perfil autorizado. Contacta al administrador.');
        }
        setProfile(null);
        return null;
      }
    } catch {
      setProfile(null);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    setAuthError(null);
    const cleanEmail = email.trim().toLowerCase();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) {
        return { error: error as Error };
      }
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        const loadedProfile = await fetchProfile(data.session.user.id);
        if (!loadedProfile?.is_active) {
          await signOut();
          return { error: new Error('La cuenta no tiene un perfil activo autorizado.') };
        }
      }
      return { error: null };
    } catch {
      return { error: new Error('Error al conectar con el servidor de autenticación') };
    }
  }

  async function signInWithGoogle() {
    setAuthError(null);
    try {
      if (!await isGoogleSignInEnabled()) {
        throw new Error('El acceso con Google aún no está habilitado. El administrador debe activar Google en la configuración de autenticación.');
      }
      localStorage.setItem('adoptame_google_pending', '1');
      const redirectTo = isNativeAndroidApp()
        ? 'adoptame://auth/callback'
        : new URL(`${import.meta.env.BASE_URL}admin/login`, window.location.origin).href;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } },
      });
      if (error) throw error;
      if (!data.url) throw new Error('No se pudo abrir el acceso con Google.');
      // Android intercepts this external navigation and opens the system browser.
      window.location.assign(data.url);
      return { error: null };
    } catch (error) {
      localStorage.removeItem('adoptame_google_pending');
      return { error: error instanceof Error ? error : new Error('No se pudo conectar con Google. Inténtalo de nuevo.') };
    }
  }

  async function signOut() {
    localStorage.removeItem('animalitos_demo_session');
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore offline signout error
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  }

  const isAdmin = !!profile?.is_active && (profile.role === 'admin' || profile.role === 'super_admin');
  const isSuperAdmin = !!profile?.is_active && profile.role === 'super_admin';

  function hasAccessLevel(level: number): boolean {
    if (!user || !profile?.is_active) return false;
    if (isSuperAdmin) return true;
    const roleMinimums: Record<Profile['role'], number> = {
      viewer: 1,
      editor: 4,
      admin: 7,
      super_admin: 10,
    };
    return Math.max(profile?.access_level ?? 0, profile ? roleMinimums[profile.role] : 0) >= level;
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      signIn,
      signInWithGoogle,
      authError,
      signOut,
      isAdmin,
      isSuperAdmin,
      hasAccessLevel,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
