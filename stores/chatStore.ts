import { create } from 'zustand';
import { chatAboutDreams } from '@/lib/gemini';
import type { ChatMessage, Dream } from '@/types/dream';

interface ChatState {
  messages: ChatMessage[];
  dreamContext: Dream | Dream[] | null;
  isLoading: boolean;
  error: string | null;

  setDreamContext: (dream: Dream | Dream[]) => void;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  dreamContext: null,
  isLoading: false,
  error: null,

  setDreamContext: (dream) => {
    set({ dreamContext: dream, messages: [], error: null });
  },

  sendMessage: async (content: string) => {
    const { dreamContext, messages } = get();
    if (!dreamContext) {
      set({ error: 'No dream selected for chat' });
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    set(state => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      // Get AI response
      const response = await chatAboutDreams(
        [...messages, userMessage],
        dreamContext
      );

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };

      set(state => ({
        messages: [...state.messages, assistantMessage],
      }));
    } catch (error) {
      console.error('Failed to send message:', error);
      set({ error: 'Failed to get response. Please try again.' });
    } finally {
      set({ isLoading: false });
    }
  },

  clearChat: () => {
    set({ messages: [], dreamContext: null, error: null });
  },
}));
