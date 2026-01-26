// Synchronicity Tracker Store
// Track meaningful coincidences between dreams and waking life

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { logError } from '@/lib/errorLogger';
import type { Synchronicity } from '@/types/dream';

interface SynchronicityState {
  synchronicities: Synchronicity[];
  isLoading: boolean;
  
  fetchSynchronicities: () => Promise<void>;
  addSynchronicity: (sync: Omit<Synchronicity, 'id' | 'user_id' | 'created_at'>) => Promise<Synchronicity>;
  updateSynchronicity: (id: string, updates: Partial<Synchronicity>) => Promise<void>;
  deleteSynchronicity: (id: string) => Promise<void>;
  getSynchronicitiesForDream: (dreamId: string) => Synchronicity[];
}

export const useSynchronicityStore = create<SynchronicityState>((set, get) => ({
  synchronicities: [],
  isLoading: false,
  
  fetchSynchronicities: async () => {
    if (!supabase) return;
    set({ isLoading: true });
    
    try {
      const { data, error } = await supabase
        .from('synchronicities')
        .select('*')
        .order('occurred_at', { ascending: false });
      
      if (error) throw error;
      set({ synchronicities: data as Synchronicity[] });
    } catch (error) {
      logError('fetchSynchronicities', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  addSynchronicity: async (syncData) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('synchronicities')
      .insert({
        ...syncData,
        user_id: user.id,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    const newSync = data as Synchronicity;
    set(state => ({ synchronicities: [newSync, ...state.synchronicities] }));
    return newSync;
  },
  
  updateSynchronicity: async (id, updates) => {
    if (!supabase) return;
    
    const { error } = await supabase
      .from('synchronicities')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      logError('updateSynchronicity', error);
      return;
    }
    
    set(state => ({
      synchronicities: state.synchronicities.map(s =>
        s.id === id ? { ...s, ...updates } : s
      ),
    }));
  },
  
  deleteSynchronicity: async (id) => {
    if (!supabase) return;
    
    const { error } = await supabase
      .from('synchronicities')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    set(state => ({ synchronicities: state.synchronicities.filter(s => s.id !== id) }));
  },
  
  getSynchronicitiesForDream: (dreamId) => {
    return get().synchronicities.filter(s => s.dream_id === dreamId);
  },
}));
