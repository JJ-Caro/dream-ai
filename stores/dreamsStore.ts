import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { analyzeDreamAudio } from '@/lib/gemini';
import { deleteAudioFile } from '@/lib/audio';
import { addPendingDream, removePendingDream, getPendingDreams } from '@/lib/storage';
import { useUserContextStore } from '@/stores/userContextStore';
import { logError, logWarning } from '@/lib/errorLogger';
import type { Dream, DreamInsert, DeepAnalysis } from '@/types/dream';

interface DreamsState {
  dreams: Dream[];
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;

  fetchDreams: () => Promise<void>;
  processDream: (audioUri: string, durationSeconds: number) => Promise<Dream>;
  deleteDream: (id: string) => Promise<void>;
  syncPendingDreams: () => Promise<void>;
  updateDreamDeepAnalysis: (dreamId: string, deepAnalysis: DeepAnalysis) => void;
}

export const useDreamsStore = create<DreamsState>((set, get) => ({
  dreams: [],
  isLoading: false,
  isProcessing: false,
  error: null,

  fetchDreams: async () => {
    if (!supabase) {
      set({ isLoading: false, error: 'Supabase not configured' });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('dreams')
        .select('*')
        .order('recorded_at', { ascending: false });

      if (error) throw error;
      set({ dreams: data as Dream[] });
    } catch (error) {
      logError('fetchDreams', error);
      set({ error: 'Failed to load dreams' });
    } finally {
      set({ isLoading: false });
    }
  },

  processDream: async (audioUri: string, durationSeconds: number) => {
    if (!supabase) throw new Error('Supabase not configured');
    set({ isProcessing: true, error: null });

    const recordedAt = new Date().toISOString();
    const pendingId = `pending_${Date.now()}`;

    try {
      // Add to pending queue first (offline support)
      await addPendingDream({
        id: pendingId,
        audioUri,
        recordedAt,
        durationSeconds,
      });

      // Get user context for personalized analysis
      const userContext = useUserContextStore.getState().userContext;

      // Send to Gemini for analysis (with user context if available)
      const analysis = await analyzeDreamAudio(audioUri, userContext);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Calculate word count
      const wordCount = analysis.raw_transcript.split(/\s+/).filter(Boolean).length;

      // Prepare dream data with quick archetype from Flash model
      const dreamData: DreamInsert = {
        user_id: user.id,
        recorded_at: recordedAt,
        raw_transcript: analysis.raw_transcript,
        cleaned_narrative: analysis.cleaned_narrative,
        figures: analysis.figures,
        locations: analysis.locations,
        objects: analysis.objects,
        actions: analysis.actions,
        emotions: analysis.emotions,
        themes: analysis.themes,
        symbols: analysis.symbols,
        overall_emotional_tone: analysis.overall_emotional_tone,
        quick_archetype: analysis.quick_archetype,
        duration_seconds: durationSeconds,
        word_count: wordCount,
      };

      // Save to Supabase
      const { data, error } = await supabase
        .from('dreams')
        .insert(dreamData)
        .select()
        .single();

      if (error) throw error;

      // Remove from pending queue
      await removePendingDream(pendingId);

      // Delete audio file (privacy)
      await deleteAudioFile(audioUri);

      // Update local state
      const newDream = data as Dream;
      set(state => ({
        dreams: [newDream, ...state.dreams],
      }));

      return newDream;
    } catch (error) {
      logError('processDream', error);
      set({ error: 'Failed to process dream. It will be synced when online.' });
      throw error;
    } finally {
      set({ isProcessing: false });
    }
  },

  deleteDream: async (id: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    try {
      const { error } = await supabase
        .from('dreams')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        dreams: state.dreams.filter(d => d.id !== id),
      }));
    } catch (error) {
      throw error;
    }
  },

  syncPendingDreams: async () => {
    const pending = await getPendingDreams();
    if (pending.length === 0) return;

    for (const dream of pending) {
      try {
        await get().processDream(dream.audioUri, dream.durationSeconds);
      } catch (error) {
        logError('syncPendingDreams', error);
        logWarning('syncPendingDreams', `Failed to sync pending dream: ${dream.id}`);
      }
    }
  },

  updateDreamDeepAnalysis: (dreamId: string, deepAnalysis: DeepAnalysis) => {
    set(state => ({
      dreams: state.dreams.map(dream =>
        dream.id === dreamId
          ? { ...dream, deep_analysis: deepAnalysis }
          : dream
      ),
    }));
  },
}));
