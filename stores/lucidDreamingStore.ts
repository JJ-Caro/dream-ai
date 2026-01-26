// Lucid Dreaming Tools Store
// Reality checks, dream signs, and lucid practice tracking

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logError } from '@/lib/errorLogger';
import * as Notifications from 'expo-notifications';
import type { RealityCheck, DreamSign, Dream } from '@/types/dream';

const REALITY_CHECKS_KEY = 'lucid_reality_checks';

interface LucidDreamingState {
  realityChecks: RealityCheck[];
  dreamSigns: DreamSign[];
  lucidDreamCount: number;
  isLoading: boolean;
  
  // Reality Checks (local storage - no account needed)
  loadRealityChecks: () => Promise<void>;
  addRealityCheck: (check: Omit<RealityCheck, 'id'>) => Promise<void>;
  updateRealityCheck: (id: string, updates: Partial<RealityCheck>) => Promise<void>;
  deleteRealityCheck: (id: string) => Promise<void>;
  scheduleRealityCheckReminders: () => Promise<void>;
  
  // Dream Signs (requires account)
  fetchDreamSigns: () => Promise<void>;
  addDreamSign: (sign: Omit<DreamSign, 'id' | 'user_id'>) => Promise<void>;
  updateDreamSign: (id: string, updates: Partial<DreamSign>) => Promise<void>;
  deleteDreamSign: (id: string) => Promise<void>;
  
  // Auto-detect dream signs from dreams
  detectDreamSigns: (dreams: Dream[]) => Promise<DreamSign[]>;
}

// Default reality check techniques
export const DEFAULT_REALITY_CHECKS: Omit<RealityCheck, 'id'>[] = [
  {
    type: 'hands',
    reminder_times: ['10:00', '14:00', '18:00', '22:00'],
    enabled: true,
  },
  {
    type: 'text',
    reminder_times: ['11:00', '15:00', '19:00'],
    enabled: false,
  },
  {
    type: 'breathing',
    reminder_times: ['09:00', '13:00', '17:00', '21:00'],
    enabled: false,
  },
];

export const REALITY_CHECK_DESCRIPTIONS: Record<RealityCheck['type'], { title: string; instruction: string }> = {
  hands: {
    title: 'Hand Check',
    instruction: 'Look at your hands. Count your fingers. In dreams, hands often look distorted or have the wrong number of fingers.',
  },
  time: {
    title: 'Time Check',
    instruction: 'Look at a clock, look away, then look back. In dreams, time often changes dramatically or looks nonsensical.',
  },
  text: {
    title: 'Text Check',
    instruction: 'Read some text, look away, read it again. In dreams, text often changes or is unreadable.',
  },
  breathing: {
    title: 'Nose Pinch',
    instruction: 'Pinch your nose and try to breathe. In dreams, you can often still breathe through a pinched nose.',
  },
  mirror: {
    title: 'Mirror Check',
    instruction: 'Look at yourself in a mirror. In dreams, reflections are often distorted or wrong.',
  },
  light_switch: {
    title: 'Light Switch',
    instruction: 'Try a light switch. In dreams, lights often don\'t respond correctly to switches.',
  },
  custom: {
    title: 'Custom Check',
    instruction: 'Your personal reality check technique.',
  },
};

export const useLucidDreamingStore = create<LucidDreamingState>((set, get) => ({
  realityChecks: [],
  dreamSigns: [],
  lucidDreamCount: 0,
  isLoading: false,
  
  loadRealityChecks: async () => {
    try {
      const stored = await AsyncStorage.getItem(REALITY_CHECKS_KEY);
      if (stored) {
        set({ realityChecks: JSON.parse(stored) });
      } else {
        // Initialize with defaults
        const defaults = DEFAULT_REALITY_CHECKS.map((check, i) => ({
          ...check,
          id: `rc_${i}_${Date.now()}`,
        }));
        await AsyncStorage.setItem(REALITY_CHECKS_KEY, JSON.stringify(defaults));
        set({ realityChecks: defaults });
      }
    } catch (error) {
      logError('loadRealityChecks', error);
    }
  },
  
  addRealityCheck: async (check) => {
    const newCheck: RealityCheck = {
      ...check,
      id: `rc_${Date.now()}`,
    };
    
    const updated = [...get().realityChecks, newCheck];
    await AsyncStorage.setItem(REALITY_CHECKS_KEY, JSON.stringify(updated));
    set({ realityChecks: updated });
    
    if (check.enabled) {
      await get().scheduleRealityCheckReminders();
    }
  },
  
  updateRealityCheck: async (id, updates) => {
    const updated = get().realityChecks.map(rc =>
      rc.id === id ? { ...rc, ...updates } : rc
    );
    await AsyncStorage.setItem(REALITY_CHECKS_KEY, JSON.stringify(updated));
    set({ realityChecks: updated });
    
    await get().scheduleRealityCheckReminders();
  },
  
  deleteRealityCheck: async (id) => {
    const updated = get().realityChecks.filter(rc => rc.id !== id);
    await AsyncStorage.setItem(REALITY_CHECKS_KEY, JSON.stringify(updated));
    set({ realityChecks: updated });
    
    await get().scheduleRealityCheckReminders();
  },
  
  scheduleRealityCheckReminders: async () => {
    // Cancel existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    const { realityChecks } = get();
    const enabledChecks = realityChecks.filter(rc => rc.enabled);
    
    for (const check of enabledChecks) {
      const desc = REALITY_CHECK_DESCRIPTIONS[check.type];
      
      for (const time of check.reminder_times) {
        const [hours, minutes] = time.split(':').map(Number);
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `🌙 ${desc.title}`,
            body: 'Am I dreaming? Do a reality check now!',
            data: { type: 'reality_check', checkType: check.type },
          },
          trigger: {
            hour: hours,
            minute: minutes,
            repeats: true,
          },
        });
      }
    }
  },
  
  fetchDreamSigns: async () => {
    if (!supabase) return;
    set({ isLoading: true });
    
    try {
      const { data, error } = await supabase
        .from('dream_signs')
        .select('*')
        .order('occurrences', { ascending: false });
      
      if (error) throw error;
      set({ dreamSigns: data as DreamSign[] });
    } catch (error) {
      logError('fetchDreamSigns', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  addDreamSign: async (sign) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('dream_signs')
      .insert({ ...sign, user_id: user.id })
      .select()
      .single();
    
    if (error) throw error;
    set(state => ({ dreamSigns: [...state.dreamSigns, data as DreamSign] }));
  },
  
  updateDreamSign: async (id, updates) => {
    if (!supabase) return;
    
    const { error } = await supabase
      .from('dream_signs')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      logError('updateDreamSign', error);
      return;
    }
    
    set(state => ({
      dreamSigns: state.dreamSigns.map(ds =>
        ds.id === id ? { ...ds, ...updates } : ds
      ),
    }));
  },
  
  deleteDreamSign: async (id) => {
    if (!supabase) return;
    
    const { error } = await supabase
      .from('dream_signs')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    set(state => ({ dreamSigns: state.dreamSigns.filter(ds => ds.id !== id) }));
  },
  
  detectDreamSigns: async (dreams) => {
    // Analyze dreams to find recurring elements
    const elementCounts: Record<string, { count: number; category: DreamSign['category']; dreams: string[] }> = {};
    
    for (const dream of dreams) {
      // Count recurring figures
      dream.figures?.forEach(f => {
        const key = f.description.toLowerCase();
        if (!elementCounts[key]) {
          elementCounts[key] = { count: 0, category: 'character', dreams: [] };
        }
        elementCounts[key].count++;
        elementCounts[key].dreams.push(dream.id);
      });
      
      // Count recurring locations
      dream.locations?.forEach(l => {
        const key = l.description.toLowerCase();
        if (!elementCounts[key]) {
          elementCounts[key] = { count: 0, category: 'location', dreams: [] };
        }
        elementCounts[key].count++;
        elementCounts[key].dreams.push(dream.id);
      });
      
      // Count recurring actions
      dream.actions?.forEach(a => {
        const key = a.description.toLowerCase();
        if (!elementCounts[key]) {
          elementCounts[key] = { count: 0, category: 'action', dreams: [] };
        }
        elementCounts[key].count++;
        elementCounts[key].dreams.push(dream.id);
      });
      
      // Count recurring symbols/objects
      dream.symbols?.forEach(s => {
        const key = s.symbol.toLowerCase();
        if (!elementCounts[key]) {
          elementCounts[key] = { count: 0, category: 'object', dreams: [] };
        }
        elementCounts[key].count++;
        elementCounts[key].dreams.push(dream.id);
      });
    }
    
    // Return elements that appear 3+ times as potential dream signs
    const potentialSigns: DreamSign[] = Object.entries(elementCounts)
      .filter(([_, data]) => data.count >= 3)
      .map(([description, data]) => ({
        id: `potential_${Date.now()}_${Math.random()}`,
        user_id: '',
        description,
        category: data.category,
        occurrences: data.count,
        first_seen: dreams[dreams.length - 1]?.recorded_at || new Date().toISOString(),
        dreams: [...new Set(data.dreams)],
      }));
    
    return potentialSigns;
  },
}));
