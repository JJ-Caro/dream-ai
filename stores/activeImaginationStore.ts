// Active Imagination Store
// Jung's technique for dialoguing with dream figures

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { logError } from '@/lib/errorLogger';
import type { ActiveImaginationSession } from '@/types/dream';

interface ActiveImaginationState {
  sessions: ActiveImaginationSession[];
  currentSession: ActiveImaginationSession | null;
  isLoading: boolean;
  
  fetchSessions: () => Promise<void>;
  startSession: (dreamId: string | undefined, figureName: string, figureDescription: string) => Promise<ActiveImaginationSession>;
  addMessage: (sessionId: string, speaker: 'self' | 'figure', message: string) => Promise<void>;
  addInsight: (sessionId: string, insight: string) => Promise<void>;
  endSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  setCurrentSession: (session: ActiveImaginationSession | null) => void;
}

export const useActiveImaginationStore = create<ActiveImaginationState>((set, get) => ({
  sessions: [],
  currentSession: null,
  isLoading: false,
  
  fetchSessions: async () => {
    if (!supabase) return;
    set({ isLoading: true });
    
    try {
      const { data, error } = await supabase
        .from('active_imagination_sessions')
        .select('*')
        .order('started_at', { ascending: false });
      
      if (error) throw error;
      set({ sessions: data as ActiveImaginationSession[] });
    } catch (error) {
      logError('fetchActiveImaginationSessions', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  startSession: async (dreamId, figureName, figureDescription) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const session: Omit<ActiveImaginationSession, 'id'> = {
      user_id: user.id,
      dream_id: dreamId,
      figure_name: figureName,
      figure_description: figureDescription,
      dialogue: [],
      insights: [],
      started_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('active_imagination_sessions')
      .insert(session)
      .select()
      .single();
    
    if (error) throw error;
    
    const newSession = data as ActiveImaginationSession;
    set(state => ({
      sessions: [newSession, ...state.sessions],
      currentSession: newSession,
    }));
    
    return newSession;
  },
  
  addMessage: async (sessionId, speaker, message) => {
    if (!supabase) return;
    
    const { currentSession, sessions } = get();
    const session = currentSession?.id === sessionId ? currentSession : sessions.find(s => s.id === sessionId);
    if (!session) return;
    
    const newDialogue = [
      ...session.dialogue,
      { speaker, message, timestamp: new Date().toISOString() },
    ];
    
    const { error } = await supabase
      .from('active_imagination_sessions')
      .update({ dialogue: newDialogue })
      .eq('id', sessionId);
    
    if (error) {
      logError('addMessage', error);
      return;
    }
    
    set(state => ({
      sessions: state.sessions.map(s =>
        s.id === sessionId ? { ...s, dialogue: newDialogue } : s
      ),
      currentSession: state.currentSession?.id === sessionId
        ? { ...state.currentSession, dialogue: newDialogue }
        : state.currentSession,
    }));
  },
  
  addInsight: async (sessionId, insight) => {
    if (!supabase) return;
    
    const { currentSession, sessions } = get();
    const session = currentSession?.id === sessionId ? currentSession : sessions.find(s => s.id === sessionId);
    if (!session) return;
    
    const newInsights = [...session.insights, insight];
    
    const { error } = await supabase
      .from('active_imagination_sessions')
      .update({ insights: newInsights })
      .eq('id', sessionId);
    
    if (error) {
      logError('addInsight', error);
      return;
    }
    
    set(state => ({
      sessions: state.sessions.map(s =>
        s.id === sessionId ? { ...s, insights: newInsights } : s
      ),
      currentSession: state.currentSession?.id === sessionId
        ? { ...state.currentSession, insights: newInsights }
        : state.currentSession,
    }));
  },
  
  endSession: async (sessionId) => {
    if (!supabase) return;
    
    const endedAt = new Date().toISOString();
    
    const { error } = await supabase
      .from('active_imagination_sessions')
      .update({ ended_at: endedAt })
      .eq('id', sessionId);
    
    if (error) {
      logError('endSession', error);
      return;
    }
    
    set(state => ({
      sessions: state.sessions.map(s =>
        s.id === sessionId ? { ...s, ended_at: endedAt } : s
      ),
      currentSession: null,
    }));
  },
  
  deleteSession: async (sessionId) => {
    if (!supabase) return;
    
    const { error } = await supabase
      .from('active_imagination_sessions')
      .delete()
      .eq('id', sessionId);
    
    if (error) throw error;
    
    set(state => ({
      sessions: state.sessions.filter(s => s.id !== sessionId),
      currentSession: state.currentSession?.id === sessionId ? null : state.currentSession,
    }));
  },
  
  setCurrentSession: (session) => set({ currentSession: session }),
}));
