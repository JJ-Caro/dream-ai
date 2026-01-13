import { create } from 'zustand';
import { startRecording, stopRecording, getRecordingStatus } from '@/lib/audio';

interface RecordingState {
  isRecording: boolean;
  duration: number;
  audioUri: string | null;
  error: string | null;

  start: () => Promise<void>;
  stop: () => Promise<string | null>;
  reset: () => void;
  updateDuration: () => Promise<void>;
}

export const useRecordingStore = create<RecordingState>((set, get) => ({
  isRecording: false,
  duration: 0,
  audioUri: null,
  error: null,

  start: async () => {
    set({ error: null });
    try {
      await startRecording();
      set({ isRecording: true, duration: 0 });
    } catch (error) {
      console.error('Failed to start recording:', error);
      set({ error: 'Failed to start recording. Please check permissions.' });
      throw error;
    }
  },

  stop: async () => {
    try {
      const uri = await stopRecording();
      set({ isRecording: false, audioUri: uri });
      return uri;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      set({ isRecording: false, error: 'Failed to stop recording.' });
      throw error;
    }
  },

  reset: () => {
    set({ isRecording: false, duration: 0, audioUri: null, error: null });
  },

  updateDuration: async () => {
    if (!get().isRecording) return;

    try {
      const status = await getRecordingStatus();
      if (status?.isRecording) {
        set({ duration: Math.floor(status.durationMillis / 1000) });
      }
    } catch (error) {
      console.error('Failed to update duration:', error);
    }
  },
}));
