import { GoogleGenerativeAI } from '@google/generative-ai';
import { File } from 'expo-file-system';
import { DREAM_ANALYSIS_PROMPT, CHAT_SYSTEM_PROMPT, WEEKLY_REPORT_PROMPT } from '@/constants/prompts';
import type { GeminiDreamResponse, ChatMessage, Dream, JungianArchetype } from '@/types/dream';

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY!);

// Use Gemini 2.5 Flash for quick audio analysis
const flashModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Use Gemini 2.5 Pro for deep analysis (supports thinking mode)
const proModel = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

export { proModel };

export async function analyzeDreamAudio(audioUri: string, userContext?: string | null): Promise<GeminiDreamResponse> {
  // Read audio file as base64 using new File API
  const file = new File(audioUri);
  const audioBase64 = await file.base64();

  // Determine mime type based on file extension
  const mimeType = audioUri.endsWith('.m4a') ? 'audio/mp4' : 'audio/mpeg';

  // Build prompt with optional user context
  let prompt = DREAM_ANALYSIS_PROMPT;
  if (userContext && userContext.trim()) {
    prompt = `CONTEXT ABOUT THE DREAMER (use this to better understand their dreams):
${userContext}

---

${DREAM_ANALYSIS_PROMPT}`;
  }

  const result = await flashModel.generateContent([
    {
      inlineData: {
        mimeType,
        data: audioBase64,
      },
    },
    { text: prompt },
  ]);

  const response = result.response;
  const text = response.text();

  // Parse JSON response - handle potential markdown code blocks
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

  try {
    return JSON.parse(jsonStr) as GeminiDreamResponse;
  } catch (error) {
    throw new Error('Failed to parse dream analysis response');
  }
}

export async function transcribeAudio(audioUri: string): Promise<string> {
  // Read audio file as base64
  const file = new File(audioUri);
  const audioBase64 = await file.base64();

  const mimeType = audioUri.endsWith('.m4a') ? 'audio/mp4' : 'audio/mpeg';

  const result = await flashModel.generateContent([
    {
      inlineData: {
        mimeType,
        data: audioBase64,
      },
    },
    { text: 'Transcribe this audio exactly. Return only the transcription text, nothing else.' },
  ]);

  return result.response.text().trim();
}

export async function chatAboutDreams(
  messages: ChatMessage[],
  dreamContext: Dream | Dream[],
  userContext?: string | null
): Promise<string> {
  const dreams = Array.isArray(dreamContext) ? dreamContext : [dreamContext];

  // Build rich context from dreams including all extracted data
  const dreamContextText = dreams.map((dream, i) => {
    // Build figures section with archetype hints
    const figuresSection = dream.figures.length > 0
      ? dream.figures.map(f => {
          let figureDesc = `• ${f.description} (${f.gender}, ${f.emotional_valence})`;
          if (f.relationship) figureDesc += ` - resembles: ${f.relationship}`;
          if (f.archetype_hint) figureDesc += ` [archetype hint: ${f.archetype_hint}]`;
          return figureDesc;
        }).join('\n')
      : 'None noted';

    // Build locations section
    const locationsSection = dream.locations.length > 0
      ? dream.locations.map(l => `• ${l.description} (${l.familiarity}, atmosphere: ${l.atmosphere})`).join('\n')
      : 'None noted';

    // Build symbols section with possible meanings
    const symbolsSection = dream.symbols && dream.symbols.length > 0
      ? dream.symbols.map(s => `• ${s.symbol}: ${s.context}${s.possible_meanings?.length ? ` [possible meanings: ${s.possible_meanings.join(', ')}]` : ''}`).join('\n')
      : 'None noted';

    // Build emotions section
    const emotionsSection = dream.emotions.length > 0
      ? dream.emotions.map(e => `• ${e.emotion} (intensity ${e.intensity}/5) - ${e.moment}`).join('\n')
      : 'None noted';

    // Quick archetype section
    const quickArchetypeSection = dream.quick_archetype
      ? `${dream.quick_archetype.likely_archetype.toUpperCase()} (${Math.round(dream.quick_archetype.confidence * 100)}% confidence)\nReason: ${dream.quick_archetype.brief_reason}`
      : 'Not yet analyzed';

    // Deep analysis section if available
    let deepAnalysisSection = '';
    if (dream.deep_analysis) {
      const da = dream.deep_analysis;
      deepAnalysisSection = `

DEEP JUNGIAN ANALYSIS (use this for your responses):
• Primary Archetype: ${da.primary_archetype?.type?.toUpperCase() || 'Unknown'} (${Math.round((da.primary_archetype?.confidence || 0) * 100)}% confidence)
• Evidence: ${da.primary_archetype?.evidence?.join('; ') || 'Not available'}
• Psychological Meaning: ${da.primary_archetype?.psychological_meaning || 'Not available'}
• Compensatory Dynamic: ${da.compensatory_dynamic || 'Not analyzed'}
• Synthesis Interpretation: ${da.synthesis || 'Not available'}
• Symbol Amplifications:
${da.amplifications?.map(a => `  - ${a.symbol}: ${a.mythological}`).join('\n') || '  None available'}
• Reflection Questions: ${da.questions_for_reflection?.join(' | ') || 'None generated'}`;
    }

    return `═══════════════════════════════════════
DREAM ${i + 1} (${new Date(dream.recorded_at).toLocaleDateString()})
═══════════════════════════════════════

NARRATIVE:
${dream.cleaned_narrative}

FIGURES:
${figuresSection}

LOCATIONS:
${locationsSection}

SYMBOLS:
${symbolsSection}

EMOTIONS:
${emotionsSection}

THEMES: ${dream.themes.join(', ') || 'None noted'}
OVERALL EMOTIONAL TONE: ${dream.overall_emotional_tone}

INITIAL ARCHETYPE ASSESSMENT:
${quickArchetypeSection}${deepAnalysisSection}`;
  }).join('\n\n');

  // Build conversation history
  const conversationHistory = messages.map(m =>
    `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
  ).join('\n\n');

  // Build prompt with optional user context
  const userContextSection = userContext && userContext.trim()
    ? `
═══════════════════════════════════════
PERSONAL CONTEXT ABOUT THE DREAMER
═══════════════════════════════════════
${userContext}

`
    : '';

  const prompt = `${CHAT_SYSTEM_PROMPT}
${userContextSection}
${dreamContextText}

═══════════════════════════════════════
CONVERSATION
═══════════════════════════════════════
${conversationHistory}

Respond to the user's last message. Provide substantive Jungian analysis when asked about meaning. Reference specific dream elements (figures, symbols, emotions, archetypes) in your interpretation. Be insightful and give real value.`;

  const result = await flashModel.generateContent(prompt);
  return result.response.text();
}

// Weekly Report Types
export interface WeeklyReportAIResponse {
  emotional_journey: {
    dominant_emotions: string[];
    trend: 'ascending' | 'descending' | 'stable' | 'fluctuating';
    narrative: string;
  };
  ai_insight: string;
}

export async function generateWeeklyReportInsight(
  dreams: Dream[]
): Promise<WeeklyReportAIResponse> {
  // Build context from dreams
  const dreamsContext = dreams.map((dream, i) => {
    const jungianInfo = dream.jungian_analysis
      ? `Primary Archetype: ${dream.jungian_analysis.primary_archetype} (confidence: ${dream.jungian_analysis.confidence})
Interpretation: ${dream.jungian_analysis.interpretation}
Secondary Archetypes: ${dream.jungian_analysis.secondary_archetypes.join(', ') || 'None'}
Shadow elements: ${dream.jungian_analysis.shadow_elements.join(', ') || 'None'}`
      : 'Jungian analysis: Not available';

    return `Dream ${i + 1} (${new Date(dream.recorded_at).toLocaleDateString()}):
Narrative: ${dream.cleaned_narrative.slice(0, 300)}${dream.cleaned_narrative.length > 300 ? '...' : ''}
Emotions: ${dream.emotions.map(e => `${e.emotion} (${e.intensity}/5)`).join(', ')}
Themes: ${dream.themes.join(', ')}
${jungianInfo}
Overall Tone: ${dream.overall_emotional_tone}
`;
  }).join('\n---\n');

  const prompt = `${WEEKLY_REPORT_PROMPT}

Dreams from this week (${dreams.length} total):
${dreamsContext}`;

  const result = await flashModel.generateContent(prompt);
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

  try {
    return JSON.parse(jsonStr) as WeeklyReportAIResponse;
  } catch (error) {
    // Return fallback response
    return {
      emotional_journey: {
        dominant_emotions: [],
        trend: 'stable',
        narrative: 'Unable to generate emotional journey summary.',
      },
      ai_insight: 'Unable to generate weekly insight.',
    };
  }
}

// Normalize old archetype values to new format
function normalizeArchetype(archetype: string): JungianArchetype {
  // Handle old format ('anima', 'animus') -> new format ('anima_animus')
  if (archetype === 'anima' || archetype === 'animus') {
    return 'anima_animus';
  }
  // Validate it's a known archetype
  const validArchetypes: JungianArchetype[] = ['shadow', 'anima_animus', 'self', 'persona', 'hero'];
  if (validArchetypes.includes(archetype as JungianArchetype)) {
    return archetype as JungianArchetype;
  }
  // Default to shadow for unknown archetypes
  return 'shadow';
}

// Aggregate Jungian analysis across multiple dreams
export function aggregateJungianAnalysis(dreams: Dream[]): {
  dominant_archetypes: { archetype: JungianArchetype; count: number; avgConfidence: number }[];
  shadow_themes: string[];
  collective_symbols: string[];
  dreamsWithAnalysis: number;
  totalDreams: number;
} {
  const archetypeCounts: Record<string, { count: number; totalConfidence: number }> = {};
  const shadowThemes = new Set<string>();
  const collectiveSymbols = new Set<string>();
  let dreamsWithAnalysis = 0;

  dreams.forEach(dream => {
    if (dream.jungian_analysis) {
      dreamsWithAnalysis++;

      // Handle both old format (archetypes_present) and new format (primary_archetype)
      const analysis = dream.jungian_analysis as any; // Cast to handle both formats

      let primary: string;
      let confidence: number;

      if (analysis.primary_archetype) {
        // New format
        primary = normalizeArchetype(analysis.primary_archetype);
        confidence = analysis.confidence || 0.5;
      } else if (analysis.archetypes_present && analysis.archetypes_present.length > 0) {
        // Old format - use first archetype as primary
        primary = normalizeArchetype(analysis.archetypes_present[0].archetype);
        confidence = analysis.archetypes_present[0].strength === 'prominent' ? 0.8 :
                     analysis.archetypes_present[0].strength === 'moderate' ? 0.6 : 0.4;
      } else {
        // No valid data, skip this dream
        dreamsWithAnalysis--;
        return;
      }

      if (!archetypeCounts[primary]) {
        archetypeCounts[primary] = { count: 0, totalConfidence: 0 };
      }
      archetypeCounts[primary].count += 1;
      archetypeCounts[primary].totalConfidence += confidence;

      // Handle secondary archetypes
      if (analysis.secondary_archetypes && analysis.secondary_archetypes.length > 0) {
        analysis.secondary_archetypes.forEach((secondary: any) => {
          // Handle both formats: object with {type, confidence} or plain string
          const archetypeValue = typeof secondary === 'string' ? secondary : secondary.type;
          const secondaryConfidence = typeof secondary === 'object' ? (secondary.confidence || 0.3) : 0.3;

          const normalized = normalizeArchetype(archetypeValue);
          if (!archetypeCounts[normalized]) {
            archetypeCounts[normalized] = { count: 0, totalConfidence: 0 };
          }
          archetypeCounts[normalized].count += 0.5;
          archetypeCounts[normalized].totalConfidence += secondaryConfidence;
        });
      } else if (analysis.archetypes_present && analysis.archetypes_present.length > 1) {
        // Old format - use remaining archetypes as secondary
        analysis.archetypes_present.slice(1).forEach((a: any) => {
          const normalized = normalizeArchetype(a.archetype);
          if (!archetypeCounts[normalized]) {
            archetypeCounts[normalized] = { count: 0, totalConfidence: 0 };
          }
          archetypeCounts[normalized].count += 0.5;
          archetypeCounts[normalized].totalConfidence += 0.3;
        });
      }

      // Collect shadow elements
      analysis.shadow_elements?.forEach((s: string) => shadowThemes.add(s));

      // Collect collective unconscious symbols
      analysis.collective_unconscious_symbols?.forEach((s: string) =>
        collectiveSymbols.add(s)
      );
    }
  });

  const dominant_archetypes = Object.entries(archetypeCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([archetype, data]) => ({
      archetype: archetype as JungianArchetype,
      count: Math.round(data.count), // Round for display
      avgConfidence: data.count > 0 ? data.totalConfidence / data.count : 0,
    }));

  return {
    dominant_archetypes,
    shadow_themes: Array.from(shadowThemes).slice(0, 5),
    collective_symbols: Array.from(collectiveSymbols).slice(0, 10),
    dreamsWithAnalysis,
    totalDreams: dreams.length,
  };
}
