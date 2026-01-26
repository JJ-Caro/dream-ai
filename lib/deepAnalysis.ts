import { supabase } from '@/lib/supabase';
import { DEEP_JUNGIAN_ANALYSIS_PROMPT } from '@/constants/prompts';
import { logError } from '@/lib/errorLogger';
import type { DeepAnalysis, Dream } from '@/types/dream';

// Sanitize input to prevent injection and limit size
function sanitizeInput(text: string, maxLength = 10000): string {
  return text
    .slice(0, maxLength)
    .replace(/[<>]/g, '')
    .trim();
}

/**
 * Generate deep Jungian analysis for a dream using Gemini Pro via Edge Function.
 * This runs in the background after the initial dream save.
 */
export async function generateDeepAnalysis(
  dreamId: string,
  dreamNarrative: string,
  symbols: Dream['symbols'],
  themes: string[],
  figures: Dream['figures'],
  emotions: Dream['emotions'],
  userContext?: string | null
): Promise<DeepAnalysis | null> {
  if (!supabase) {
    logError('generateDeepAnalysis', new Error('Supabase not configured'));
    return null;
  }

  try {
    // Build the dream context for analysis
    const dreamContext = buildDreamContext(dreamNarrative, symbols, themes, figures, emotions);

    // Build prompt with user context if available
    let prompt: string;

    if (userContext && userContext.trim()) {
      prompt = `PERSONAL CONTEXT ABOUT THE DREAMER (use this for personal associations):
${sanitizeInput(userContext, 2000)}

---

DREAM TO ANALYZE:
${sanitizeInput(dreamContext, 8000)}

---

${DEEP_JUNGIAN_ANALYSIS_PROMPT}`;
    } else {
      prompt = `DREAM TO ANALYZE:
${sanitizeInput(dreamContext, 8000)}

---

${DEEP_JUNGIAN_ANALYSIS_PROMPT}`;
    }

    // Call Edge Function instead of direct Gemini API
    const { data, error } = await supabase.functions.invoke('deep-analysis', {
      body: {
        dreamId,
        prompt,
      },
    });

    if (error) {
      logError('generateDeepAnalysis', error);
      return null;
    }

    // Edge function already saves to database, just return the result
    return data as DeepAnalysis;

  } catch (error) {
    logError('generateDeepAnalysis', error);
    return null;
  }
}

/**
 * Build a structured context string from dream elements
 */
function buildDreamContext(
  narrative: string,
  symbols: Dream['symbols'],
  themes: string[],
  figures: Dream['figures'],
  emotions: Dream['emotions']
): string {
  let context = `DREAM NARRATIVE:\n${narrative}\n\n`;

  if (symbols && symbols.length > 0) {
    context += `KEY SYMBOLS:\n`;
    symbols.forEach(s => {
      context += `- ${s.symbol}: ${s.context}\n`;
    });
    context += '\n';
  }

  if (themes && themes.length > 0) {
    context += `THEMES: ${themes.join(', ')}\n\n`;
  }

  if (figures && figures.length > 0) {
    context += `FIGURES:\n`;
    figures.forEach(f => {
      context += `- ${f.description} (${f.gender}, ${f.emotional_valence})`;
      if (f.relationship) context += ` - resembles: ${f.relationship}`;
      if (f.archetype_hint) context += ` - archetype hint: ${f.archetype_hint}`;
      context += '\n';
    });
    context += '\n';
  }

  if (emotions && emotions.length > 0) {
    context += `EMOTIONS:\n`;
    emotions.forEach(e => {
      context += `- ${e.emotion} (intensity ${e.intensity}/5) - ${e.moment}\n`;
    });
  }

  return context;
}

/**
 * Check if a dream needs deep analysis and trigger it if so.
 * Called after dream save completes.
 */
export async function triggerDeepAnalysisIfNeeded(
  dream: Dream,
  userContext?: string | null
): Promise<void> {
  // Only generate if dream doesn't already have deep analysis
  if (dream.deep_analysis) {
    return;
  }

  // Generate in background (non-blocking)
  generateDeepAnalysis(
    dream.id,
    dream.cleaned_narrative,
    dream.symbols,
    dream.themes,
    dream.figures,
    dream.emotions,
    userContext
  ).catch((error) => {
    logError('triggerDeepAnalysisIfNeeded', error);
  });
}
