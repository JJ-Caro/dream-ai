// Dream Incubation Store
// Set intentions before sleep to guide dreams

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { logError } from '@/lib/errorLogger';
import type { DreamIncubation } from '@/types/dream';

interface IncubationState {
  incubations: DreamIncubation[];
  activeIncubation: DreamIncubation | null;
  isLoading: boolean;
  
  fetchIncubations: () => Promise<void>;
  createIncubation: (question: string, intention: string) => Promise<DreamIncubation>;
  resolveIncubation: (id: string, notes: string, dreamId?: string) => Promise<void>;
  linkDream: (incubationId: string, dreamId: string) => Promise<void>;
  deleteIncubation: (id: string) => Promise<void>;
  getActiveIncubation: () => DreamIncubation | null;
}

// Incubation templates for common questions
export const INCUBATION_TEMPLATES = [
  {
    category: 'Guidance',
    prompts: [
      'What do I need to know about [situation]?',
      'Show me the next step on my path',
      'What is blocking my progress?',
      'What gift do I need to cultivate?',
    ],
  },
  {
    category: 'Relationships',
    prompts: [
      'What do I need to understand about my relationship with [person]?',
      'How can I heal this conflict?',
      'What is my heart trying to tell me?',
    ],
  },
  {
    category: 'Creativity',
    prompts: [
      'Show me a solution to [problem]',
      'What wants to be created through me?',
      'Reveal the missing piece',
    ],
  },
  {
    category: 'Self-Knowledge',
    prompts: [
      'Show me my shadow',
      'What am I not seeing about myself?',
      'What do I need to integrate?',
      'Who am I becoming?',
    ],
  },
];

export const useIncubationStore = create<IncubationState>((set, get) => ({
  incubations: [],
  activeIncubation: null,
  isLoading: false,
  
  fetchIncubations: async () => {
    if (!supabase) return;
    set({ isLoading: true });
    
    try {
      const { data, error } = await supabase
        .from('dream_incubations')
        .select('*')
        .order('set_at', { ascending: false });
      
      if (error) throw error;
      
      const incubations = data as DreamIncubation[];
      const active = incubations.find(i => i.active) || null;
      
      set({ incubations, activeIncubation: active });
    } catch (error) {
      logError('fetchIncubations', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  createIncubation: async (question, intention) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    // Deactivate any existing active incubation
    const { activeIncubation } = get();
    if (activeIncubation) {
      await supabase
        .from('dream_incubations')
        .update({ active: false })
        .eq('id', activeIncubation.id);
    }
    
    const incubation: Omit<DreamIncubation, 'id'> = {
      user_id: user.id,
      question,
      intention,
      set_at: new Date().toISOString(),
      active: true,
      linked_dream_ids: [],
    };
    
    const { data, error } = await supabase
      .from('dream_incubations')
      .insert(incubation)
      .select()
      .single();
    
    if (error) throw error;
    
    const newIncubation = data as DreamIncubation;
    
    set(state => ({
      incubations: [newIncubation, ...state.incubations.map(i => ({ ...i, active: false }))],
      activeIncubation: newIncubation,
    }));
    
    return newIncubation;
  },
  
  resolveIncubation: async (id, notes, dreamId) => {
    if (!supabase) return;
    
    const updates: Partial<DreamIncubation> = {
      active: false,
      resolved_at: new Date().toISOString(),
      resolution_notes: notes,
    };
    
    if (dreamId) {
      const incubation = get().incubations.find(i => i.id === id);
      if (incubation) {
        updates.linked_dream_ids = [...incubation.linked_dream_ids, dreamId];
      }
    }
    
    const { error } = await supabase
      .from('dream_incubations')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      logError('resolveIncubation', error);
      return;
    }
    
    set(state => ({
      incubations: state.incubations.map(i =>
        i.id === id ? { ...i, ...updates } : i
      ),
      activeIncubation: state.activeIncubation?.id === id ? null : state.activeIncubation,
    }));
  },
  
  linkDream: async (incubationId, dreamId) => {
    if (!supabase) return;
    
    const incubation = get().incubations.find(i => i.id === incubationId);
    if (!incubation) return;
    
    const newLinkedDreams = [...new Set([...incubation.linked_dream_ids, dreamId])];
    
    const { error } = await supabase
      .from('dream_incubations')
      .update({ linked_dream_ids: newLinkedDreams })
      .eq('id', incubationId);
    
    if (error) {
      logError('linkDream', error);
      return;
    }
    
    set(state => ({
      incubations: state.incubations.map(i =>
        i.id === incubationId ? { ...i, linked_dream_ids: newLinkedDreams } : i
      ),
    }));
  },
  
  deleteIncubation: async (id) => {
    if (!supabase) return;
    
    const { error } = await supabase
      .from('dream_incubations')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    set(state => ({
      incubations: state.incubations.filter(i => i.id !== id),
      activeIncubation: state.activeIncubation?.id === id ? null : state.activeIncubation,
    }));
  },
  
  getActiveIncubation: () => get().activeIncubation,
}));
