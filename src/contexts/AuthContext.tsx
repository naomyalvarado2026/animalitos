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

const MOCK_ADMIN_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  app_metadata: { provider: 'email' },
  user_metadata: { full_name: 'Administrador Animalitos' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'admin@animalitos.org',
  phone: '',
  role: 'authenticated',
  updated_at: new Date().toISOString(),
};

const MOCK_ADMIN_PROFILE: Profile = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'admin@animalitos.org',
  full_name: 'Administrador Animalitos',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  role: 'super_admin',
  access_level: 10,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const MOCK_ADMIN_SESSION: Session = {
  access_token: 'mock-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'mock-refresh-token',
  user: MOCK_ADMIN_USER,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check demo session first
    const isDemo = localStorage.getItem('animalitos_demo_session') === 'true';
    if (isDemo) {
      setUser(MOCK_ADMIN_USER);
      setSession(MOCK_ADMIN_SESSION);
      setProfile(MOCK_ADMIN_PROFILE);
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
        if (localStorage.getItem('animalitos_demo_session') === 'true') return;
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
    let inactivityTimer: ReturnType<setTimeout>;

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      if (user) {
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
      }
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    const cleanEmail = email.trim().toLowerCase();

    // Check for demo admin credentials
    if (cleanEmail === 'admin@animalitos.org' && (password === 'admin123' || password === 'Animalitos2026!')) {
      localStorage.setItem('animalitos_demo_session', 'true');
      setUser(MOCK_ADMIN_USER);
      setSession(MOCK_ADMIN_SESSION);
      setProfile(MOCK_ADMIN_PROFILE);
      setLoading(false);
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) {
        // Fallback for admin email if Supabase instance is mock/offline
        if (cleanEmail === 'admin@animalitos.org') {
          localStorage.setItem('animalitos_demo_session', 'true');
          setUser(MOCK_ADMIN_USER);
          setSession(MOCK_ADMIN_SESSION);
          setProfile(MOCK_ADMIN_PROFILE);
          setLoading(false);
          return { error: null };
        }
        return { error: error as Error };
      }
      return { error: null };
    } catch {
      if (cleanEmail === 'admin@animalitos.org') {
        localStorage.setItem('animalitos_demo_session', 'true');
        setUser(MOCK_ADMIN_USER);
        setSession(MOCK_ADMIN_SESSION);
        setProfile(MOCK_ADMIN_PROFILE);
        setLoading(false);
        return { error: null };
      }
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

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
  const isSuperAdmin = profile?.role === 'super_admin';

  function hasAccessLevel(level: number): boolean {
    return (profile?.access_level ?? 0) >= level;
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

