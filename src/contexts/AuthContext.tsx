'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { AppUser, UserRole } from '@/lib/types';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  profileComplete: boolean;
  role: UserRole;
  /** Sends the visitor to the sign-in page. */
  signIn: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<void>;
  /** Re-reads role/onboarding state, e.g. after onboarding is saved. */
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  profileComplete: false,
  role: 'PATIENT',
  signIn: () => {},
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  refreshProfile: async () => {},
  logout: async () => {},
});

function toAppUser(u: User): AppUser {
  const meta = u.user_metadata ?? {};
  return {
    uid: u.id,
    email: u.email ?? null,
    displayName: meta.full_name ?? meta.name ?? (u.email ? u.email.split('@')[0] : null),
    photoURL: meta.avatar_url ?? meta.picture ?? null,
  };
}

/** Where the OAuth / magic-link round trip lands. */
function callbackUrl() {
  return `${window.location.origin}/auth/callback`;
}

/** Where a signed-in user belongs, given their profile state. */
export function homeFor(role: UserRole, profileComplete: boolean) {
  if (role !== 'PATIENT') return '/admin';
  return profileComplete ? '/dashboard' : '/onboarding';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [role, setRole] = useState<UserRole>('PATIENT');
  const router = useRouter();

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await getSupabase()
        .from('profiles')
        .select('role, age')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      setRole(data?.role ?? 'PATIENT');
      setProfileComplete(data?.age != null);
    } catch (e) {
      console.error('Error fetching profile:', e);
      setRole('PATIENT');
      setProfileComplete(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const supabase = getSupabase();
    let active = true;

    const apply = async (sbUser: User | null) => {
      if (!active) return;
      if (sbUser) {
        setUser(toAppUser(sbUser));
        await loadProfile(sbUser.id);
      } else {
        setUser(null);
        setRole('PATIENT');
        setProfileComplete(false);
      }
      if (active) setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => apply(data.session?.user ?? null));

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // INITIAL_SESSION is covered by getSession above; token refreshes don't
      // change who the user is.
      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') return;
      // Defer out of the callback: awaiting Supabase calls inside it can deadlock.
      setTimeout(() => apply(session?.user ?? null), 0);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = () => router.push('/login');

  const signInWithGoogle = async () => {
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl() },
    });
    if (error) throw error;
  };

  const signInWithEmail = async (email: string) => {
    const { error } = await getSupabase().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: callbackUrl() },
    });
    if (error) throw error;
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user.uid);
  };

  const logout = async () => {
    if (isSupabaseConfigured) await getSupabase().auth.signOut();
    router.push('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        profileComplete,
        role,
        signIn,
        signInWithGoogle,
        signInWithEmail,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
