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
  signInDemo: () => void;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  hasAccessLevel: (level: number) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_PROFILE: Profile = {
  id: '1e630e69-80db-4599-89f4-d97c9323b9c4',
  role: 'super_admin',
  full_name: 'Naomy Alvarado',
  email: 'naomyalvarado.2026@gmail.com',
  phone: null,
  access_level: 10,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const DEMO_USER = {
  id: '1e630e69-80db-4599-89f4-d97c9323b9c4',
  email: 'naomyalvarado.2026@gmail.com',
  app_metadata: {},
  user_metadata: { full_name: 'Naomy Alvarado' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as unknown as User;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if demo session is stored
    if (localStorage.getItem('animalitos_demo_session') === 'true') {
      setUser(DEMO_USER);
      setProfile(DEMO_PROFILE);
      setLoading(false);
      return;
    }

    // Get initial Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch(() => {
      setLoading(false);
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (localStorage.getItem('animalitos_demo_session') === 'true') {
          return;
        }
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Auto-logout after 30 minutes of inactivity for logged in users
    let inactivityTimer: ReturnType<typeof setTimeout>;

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      if (user && localStorage.getItem('animalitos_demo_session') !== 'true') {
        inactivityTimer = setTimeout(() => {
          signOut();
        }, 30 * 60 * 1000); // 30 mins
      }
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetInactivityTimer));
    resetInactivityTimer();

    return () => {
      subscription.unsubscribe();
      clearTimeout(inactivityTimer);
      events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
    };
  }, [user]);

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data as Profile);
      } else {
        // Fallback default admin profile if user exists in auth
        setProfile(DEMO_PROFILE);
      }
    } catch {
      setProfile(DEMO_PROFILE);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    const cleanEmail = email.trim().toLowerCase();

    // Check for demo bypass shorthand
    if (cleanEmail === 'admin@animalitos.org' && (password === 'admin123' || password === 'admin')) {
      signInDemo();
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) {
        return { error: error as Error };
      }
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        await fetchProfile(data.session.user.id);
      }
      return { error: null };
    } catch {
      return { error: new Error('Error al conectar con el servidor de autenticación') };
    }
  }

  function signInDemo() {
    localStorage.setItem('animalitos_demo_session', 'true');
    setUser(DEMO_USER);
    setProfile(DEMO_PROFILE);
    setLoading(false);
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

  const isAdmin = (profile?.role === 'admin' || profile?.role === 'super_admin') || (user?.id === DEMO_USER.id);
  const isSuperAdmin = profile?.role === 'super_admin' || user?.id === DEMO_USER.id;

  function hasAccessLevel(level: number): boolean {
    if (user?.id === DEMO_USER.id || isSuperAdmin) return true;
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
      signInDemo,
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
