import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { analyzeDreamAudio } from '@/lib/gemini';
import { deleteAudioFile } from '@/lib/audio';
import { addPendingDream, removePendingDream, getPendingDreams } from '@/lib/storage';
import type { Dream, DreamInsert } from '@/types/dream';

interface DreamsState {
  dreams: Dream[];
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;

  fetchDreams: () => Promise<void>;
  processDream: (audioUri: string, durationSeconds: number) => Promise<Dream>;
  deleteDream: (id: string) => Promise<void>;
  syncPendingDreams: () => Promise<void>;
}

export const useDreamsStore = create<DreamsState>((set, get) => ({
  dreams: [],
  isLoading: false,
  isProcessing: false,
  error: null,

  fetchDreams: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('dreams')
        .select('*')
        .order('recorded_at', { ascending: false });

      if (error) throw error;
      set({ dreams: data as Dream[] });
    } catch (error) {
      console.error('Failed to fetch dreams:', error);
      set({ error: 'Failed to load dreams' });
    } finally {
      set({ isLoading: false });
    }
  },

  processDream: async (audioUri: string, durationSeconds: number) => {
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

      // Send to Gemini for analysis
      const analysis = await analyzeDreamAudio(audioUri);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Calculate word count
      const wordCount = analysis.raw_transcript.split(/\s+/).filter(Boolean).length;

      // Prepare dream data
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
      console.error('Failed to process dream:', error);
      set({ error: 'Failed to process dream. It will be synced when online.' });
      throw error;
    } finally {
      set({ isProcessing: false });
    }
  },

  deleteDream: async (id: string) => {
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
      console.error('Failed to delete dream:', error);
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
        console.error('Failed to sync pending dream:', dream.id, error);
      }
    }
  },
}));
