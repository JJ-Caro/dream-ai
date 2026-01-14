import { proModel } from '@/lib/gemini';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { DEEP_JUNGIAN_ANALYSIS_PROMPT } from '@/constants/prompts';
import type { DeepAnalysis, Dream } from '@/types/dream';

/**
 * Generate deep Jungian analysis for a dream using Gemini 3 Pro with Deep Think.
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
  try {
    // Build the dream context for analysis
    const dreamContext = buildDreamContext(dreamNarrative, symbols, themes, figures, emotions);

    // Build prompt with user context if available
    let prompt = DEEP_JUNGIAN_ANALYSIS_PROMPT;

    if (userContext && userContext.trim()) {
      prompt = `PERSONAL CONTEXT ABOUT THE DREAMER (use this for personal associations):
${userContext}

---

DREAM TO ANALYZE:
${dreamContext}

---

${DEEP_JUNGIAN_ANALYSIS_PROMPT}`;
    } else {
      prompt = `DREAM TO ANALYZE:
${dreamContext}

---

${DEEP_JUNGIAN_ANALYSIS_PROMPT}`;
    }

    // Call Gemini 3 Pro with Deep Think enabled
    const result = await proModel.generateContent(prompt);
    const text = result.response.text();

    // Parse JSON response
    let jsonStr = text.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    const deepAnalysis = JSON.parse(jsonStr) as DeepAnalysis;

    // Add timestamp
    deepAnalysis.generated_at = new Date().toISOString();

    // Save to database
    if (!supabase) return null;
    const { error } = await supabase
      .from('dreams')
      .update({ deep_analysis: deepAnalysis })
      .eq('id', dreamId);

    if (error) {
      return null;
    }

    return deepAnalysis;

  } catch (error) {
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
  ).catch(() => {
  });
}
