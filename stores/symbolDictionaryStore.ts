// Personal Symbol Dictionary Store
// Learns the user's personal symbol meanings over time

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { logError } from '@/lib/errorLogger';
import type { PersonalSymbol, Dream } from '@/types/dream';

interface SymbolDictionaryState {
  symbols: PersonalSymbol[];
  isLoading: boolean;
  
  fetchSymbols: () => Promise<void>;
  addSymbol: (symbol: Omit<PersonalSymbol, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateSymbol: (id: string, updates: Partial<PersonalSymbol>) => Promise<void>;
  deleteSymbol: (id: string) => Promise<void>;
  
  // Learn from dreams - auto-suggest personal meanings
  learnFromDream: (dream: Dream) => Promise<void>;
  getSymbolMeaning: (symbol: string) => PersonalSymbol | undefined;
  getSuggestedMeanings: (symbol: string) => string[];
}

export const useSymbolDictionaryStore = create<SymbolDictionaryState>((set, get) => ({
  symbols: [],
  isLoading: false,
  
  fetchSymbols: async () => {
    if (!supabase) return;
    set({ isLoading: true });
    
    try {
      const { data, error } = await supabase
        .from('personal_symbols')
        .select('*')
        .order('occurrences', { ascending: false });
      
      if (error) throw error;
      set({ symbols: data as PersonalSymbol[] });
    } catch (error) {
      logError('fetchSymbols', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  addSymbol: async (symbolData) => {
    if (!supabase) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('personal_symbols')
        .insert({
          ...symbolData,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      set(state => ({ symbols: [...state.symbols, data as PersonalSymbol] }));
    } catch (error) {
      logError('addSymbol', error);
      throw error;
    }
  },
  
  updateSymbol: async (id, updates) => {
    if (!supabase) return;
    
    try {
      const { error } = await supabase
        .from('personal_symbols')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      
      set(state => ({
        symbols: state.symbols.map(s => 
          s.id === id ? { ...s, ...updates } : s
        ),
      }));
    } catch (error) {
      logError('updateSymbol', error);
      throw error;
    }
  },
  
  deleteSymbol: async (id) => {
    if (!supabase) return;
    
    try {
      const { error } = await supabase
        .from('personal_symbols')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      set(state => ({ symbols: state.symbols.filter(s => s.id !== id) }));
    } catch (error) {
      logError('deleteSymbol', error);
      throw error;
    }
  },
  
  learnFromDream: async (dream) => {
    const { symbols } = get();
    
    // Extract symbols from dream and update dictionary
    for (const dreamSymbol of dream.symbols || []) {
      const existing = symbols.find(
        s => s.symbol.toLowerCase() === dreamSymbol.symbol.toLowerCase()
      );
      
      if (existing) {
        // Update occurrence count and emotions
        const newEmotions = [
          ...new Set([
            ...existing.associated_emotions,
            ...dream.emotions.map(e => e.emotion),
          ]),
        ].slice(0, 10);
        
        await get().updateSymbol(existing.id, {
          occurrences: existing.occurrences + 1,
          associated_emotions: newEmotions,
        });
      }
      // New symbols are suggested but not auto-added - user decides
    }
  },
  
  getSymbolMeaning: (symbol) => {
    const { symbols } = get();
    return symbols.find(s => 
      s.symbol.toLowerCase() === symbol.toLowerCase()
    );
  },
  
  getSuggestedMeanings: (symbol) => {
    const personal = get().getSymbolMeaning(symbol);
    const suggestions: string[] = [];
    
    if (personal) {
      suggestions.push(`For you: ${personal.personal_meaning}`);
    }
    
    // Common Jungian symbol meanings
    const commonMeanings: Record<string, string[]> = {
      water: ['The unconscious', 'Emotions', 'The feminine', 'Purification'],
      fire: ['Transformation', 'Passion', 'Destruction/Creation', 'Spirit'],
      house: ['The psyche/self', 'Different rooms = different aspects', 'Security'],
      car: ['Life direction', 'Control (or lack of)', 'Personal drive'],
      flying: ['Transcendence', 'Freedom', 'Rising above', 'Inflation'],
      falling: ['Loss of control', 'Anxiety', 'Letting go', 'Coming down to earth'],
      teeth: ['Power/confidence', 'Appearance', 'Communication', 'Aging'],
      snake: ['Transformation', 'Healing', 'Hidden fears', 'Kundalini'],
      death: ['Transformation', 'Ending of old self', 'Rebirth', 'Change'],
      baby: ['New beginning', 'Vulnerability', 'Potential', 'Inner child'],
      chase: ['Avoidance', 'Shadow pursuit', 'Unresolved issues'],
    };
    
    const key = symbol.toLowerCase();
    if (commonMeanings[key]) {
      suggestions.push(...commonMeanings[key]);
    }
    
    return suggestions;
  },
}));
