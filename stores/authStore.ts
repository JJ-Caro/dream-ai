import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import * as Linking from 'expo-linking';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  isConfigured: boolean;

  initialize: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<void>;
  linkEmailToAccount: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAnonymous: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: false,
  isInitialized: false,
  isConfigured: isSupabaseConfigured,

  initialize: async () => {
    if (!supabase) {
      set({ isInitialized: true });
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        set({ user: session.user, session, isInitialized: true });
      } else {
        set({ isInitialized: true });
      }

      supabase.auth.onAuthStateChange((_event, session) => {
        set({ user: session?.user ?? null, session });
      });
    } catch (error) {
      set({ isInitialized: true });
    }
  },

  signInAnonymously: async () => {
    if (!supabase) throw new Error('Supabase not configured');
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;

      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          onboarding_completed: false,
        });
      }

      set({ user: data.user, session: data.session });
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signInWithEmail: async (email: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    set({ isLoading: true });
    try {
      // Get the redirect URL for the magic link
      const redirectUrl = Linking.createURL('auth/callback');

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: redirectUrl,
        },
      });
      if (error) throw error;
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    if (!supabase) throw new Error('Supabase not configured');
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, session: null });
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  linkEmailToAccount: async (email: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.updateUser({
        email,
      });
      if (error) throw error;
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  isAnonymous: () => {
    const { user } = get();
    if (!user) return false;
    return user.is_anonymous === true || (!user.email && !user.phone);
  },
}));
