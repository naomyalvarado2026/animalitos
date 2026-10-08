import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type Session, type User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
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
        setProfile(data as Profile);
        return data as Profile;
      } else {
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
