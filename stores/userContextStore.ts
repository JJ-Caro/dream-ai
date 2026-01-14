import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface UserContextState {
  userContext: string | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  fetchUserContext: () => Promise<void>;
  saveUserContext: (context: string) => Promise<void>;
  hasContext: () => boolean;
}

export const useUserContextStore = create<UserContextState>((set, get) => ({
  userContext: null,
  isLoading: false,
  isSaving: false,
  error: null,

  fetchUserContext: async () => {
    if (!supabase) {
      set({ isLoading: false, error: 'Database not configured' });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('user_context')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      set({ userContext: data?.user_context || null });
    } catch (error) {
      set({ error: 'Failed to load your context' });
    } finally {
      set({ isLoading: false });
    }
  },

  saveUserContext: async (context: string) => {
    if (!supabase) throw new Error('Database not configured');
    set({ isSaving: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          user_context: context,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      set({ userContext: context });
    } catch (error) {
      set({ error: 'Failed to save your context' });
      throw error;
    } finally {
      set({ isSaving: false });
    }
  },

  hasContext: () => {
    const { userContext } = get();
    return userContext !== null && userContext.trim().length > 0;
  },
}));
