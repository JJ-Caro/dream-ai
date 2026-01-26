// Server-side API calls via Supabase Edge Functions
// This replaces direct Gemini API calls to protect API keys

import { supabase } from '@/lib/supabase';
import { DREAM_ANALYSIS_PROMPT, CHAT_SYSTEM_PROMPT, DEEP_JUNGIAN_ANALYSIS_PROMPT } from '@/constants/prompts';
import type { GeminiDreamResponse, ChatMessage, Dream, DeepAnalysis } from '@/types/dream';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

/**
 * Analyze dream audio via server-side Edge Function
 * Protects Gemini API key from client extraction
 */
export async function analyzeDreamServer(
  audioBase64: string,
  mimeType: string,
  userContext?: string | null
): Promise<GeminiDreamResponse> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-dream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      audioBase64,
      mimeType,
      userContext,
      prompt: DREAM_ANALYSIS_PROMPT,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze dream');
  }

  return response.json();
}

/**
 * Chat about dreams via server-side Edge Function
 */
export async function chatServer(
  messages: ChatMessage[],
  dreams: Dream[],
  userContext?: string | null
): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  // Build the full prompt (same logic as before)
  const dreamContextText = dreams.map((dream, i) => {
    const figuresSection = dream.figures.length > 0
      ? dream.figures.map(f => {
          let desc = `• ${f.description} (${f.gender}, ${f.emotional_valence})`;
          if (f.relationship) desc += ` - resembles: ${f.relationship}`;
          if (f.archetype_hint) desc += ` [archetype hint: ${f.archetype_hint}]`;
          return desc;
        }).join('\n')
      : 'None noted';

    const symbolsSection = dream.symbols?.length
      ? dream.symbols.map(s => `• ${s.symbol}: ${s.context}`).join('\n')
      : 'None noted';

    const emotionsSection = dream.emotions.length > 0
      ? dream.emotions.map(e => `• ${e.emotion} (intensity ${e.intensity}/5)`).join('\n')
      : 'None noted';

    return `DREAM ${i + 1} (${new Date(dream.recorded_at).toLocaleDateString()})\n${dream.cleaned_narrative}\nFigures: ${figuresSection}\nSymbols: ${symbolsSection}\nEmotions: ${emotionsSection}`;
  }).join('\n\n');

  const conversationHistory = messages.map(m =>
    `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
  ).join('\n\n');

  const userContextSection = userContext?.trim()
    ? `\nPERSONAL CONTEXT:\n${userContext}\n`
    : '';

  const prompt = `${CHAT_SYSTEM_PROMPT}\n${userContextSection}\n${dreamContextText}\n\nCONVERSATION:\n${conversationHistory}`;

  const response = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to chat');
  }

  const result = await response.json();
  return result.response;
}

/**
 * Generate deep analysis via server-side Edge Function (lazy-loaded)
 */
export async function deepAnalysisServer(
  dreamId: string,
  dreamContext: string,
  userContext?: string | null
): Promise<DeepAnalysis> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  let prompt = DEEP_JUNGIAN_ANALYSIS_PROMPT;
  if (userContext?.trim()) {
    prompt = `PERSONAL CONTEXT:\n${userContext}\n\n---\n\nDREAM TO ANALYZE:\n${dreamContext}\n\n---\n\n${DEEP_JUNGIAN_ANALYSIS_PROMPT}`;
  } else {
    prompt = `DREAM TO ANALYZE:\n${dreamContext}\n\n---\n\n${DEEP_JUNGIAN_ANALYSIS_PROMPT}`;
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/deep-analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ dreamId, prompt }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate deep analysis');
  }

  return response.json();
}
