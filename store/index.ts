import { create } from 'zustand';
import type { Profile } from '@/types';

import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

// ─── Auth Store ────────────────────────────────────────────────────────────
interface AuthState {
  user: Profile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  
  // Helpers
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  signup: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  setSession: (session) =>
    set({
      session,
      isAuthenticated: !!session,
    }),
  setUser: (user) =>
    set({
      user,
    }),
  setLoading: (isLoading) => set({ isLoading }),

  login: async (email, password) => {
    set({ isLoading: true });
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.session) {
      set({ session: data.session, isAuthenticated: true });
    }
    set({ isLoading: false });
    return { error };
  },

  signup: async (email, password, fullName) => {
    set({ isLoading: true });
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    set({ isLoading: false });
    return { error };
  },

  logout: async () => {
    set({ isLoading: true });
    const { error } = await supabase.auth.signOut();
    if (!error) {
      set({ session: null, user: null, isAuthenticated: false });
    }
    set({ isLoading: false });
    return { error };
  },

  resetPassword: async (email) => {
    set({ isLoading: true });
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'budgetwise://reset-password',
    });
    set({ isLoading: false });
    return { error };
  },

  refreshSession: async () => {
    const { data } = await supabase.auth.refreshSession();
    if (data.session) {
      set({ session: data.session, isAuthenticated: true });
    }
  },
}));

// ─── App Store ────────────────────────────────────────────────────────────
interface AppState {
  isOnboarded: boolean;
  selectedCurrency: string;
  colorScheme: 'dark' | 'light';
  setOnboarded: (onboarded: boolean) => void;
  setCurrency: (currency: string) => void;
  setColorScheme: (scheme: 'dark' | 'light') => void;
}

export const useAppStore = create<AppState>((set) => ({
  isOnboarded: false,
  selectedCurrency: 'USD',
  colorScheme: 'dark',
  setOnboarded: (isOnboarded) => set({ isOnboarded }),
  setCurrency: (selectedCurrency) => set({ selectedCurrency }),
  setColorScheme: (colorScheme) => set({ colorScheme }),
}));
