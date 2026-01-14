export interface DreamFigure {
  description: string;
  relationship: string | null;
  gender: 'male' | 'female' | 'ambiguous' | 'non-human';
  emotional_valence: 'positive' | 'negative' | 'neutral' | 'ambivalent';
  archetype_hint: string | null;
}

export interface DreamLocation {
  description: string;
  familiarity: 'familiar' | 'unfamiliar' | 'mixed';
  atmosphere: string;
}

export interface DreamObject {
  description: string;
  significance: 'prominent' | 'background';
  symbolic_hint: string | null;
}

export interface DreamAction {
  description: string;
  dreamer_role: 'active' | 'passive' | 'observer';
}

export interface DreamEmotion {
  emotion: string;
  intensity: 1 | 2 | 3 | 4 | 5;
  moment: string;
}

export interface DreamSymbol {
  symbol: string;
  context: string;
  possible_meanings: string[];
}

// Jungian Psychology Types
export type JungianArchetype = 'shadow' | 'anima_animus' | 'self' | 'persona' | 'hero';

// Quick archetype from Flash model (fast initial analysis)
export interface QuickArchetype {
  likely_archetype: JungianArchetype;
  confidence: number;
  brief_reason: string;
}

// Legacy format for backward compatibility
export interface SecondaryArchetype {
  type: JungianArchetype;
  confidence: number;
  evidence: string[];
}

export interface JungianAnalysis {
  primary_archetype: JungianArchetype;
  confidence: number;
  evidence: string[];
  interpretation: string;
  secondary_archetypes: SecondaryArchetype[];
  shadow_elements: string[];
  collective_unconscious_symbols: string[];
}

// Deep Analysis Types (from Pro model)
export interface SymbolAmplification {
  symbol: string;
  mythological: string;
  personal_connection: string;
}

export interface DeepArchetype {
  type: JungianArchetype;
  confidence: number;
  evidence: string[];
  psychological_meaning?: string;
}

export interface DeepAnalysis {
  amplifications: SymbolAmplification[];
  compensatory_dynamic: string;
  primary_archetype: DeepArchetype;
  secondary_archetypes: DeepArchetype[];
  synthesis: string;
  questions_for_reflection: string[];
  generated_at?: string;
}

// Weekly Report Types
export interface WeeklyReport {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  dream_count: number;
  top_themes: { theme: string; count: number }[];
  emotional_journey: {
    dominant_emotions: string[];
    trend: 'ascending' | 'descending' | 'stable' | 'fluctuating';
    narrative: string;
  };
  key_symbols: { symbol: string; count: number }[];
  jungian_summary: {
    dominant_archetypes: { archetype: string; count: number }[];
    shadow_work_themes: string[];
  };
  ai_insight: string;
  created_at: string;
}

export interface WeeklyReportInsert {
  user_id: string;
  week_start: string;
  week_end: string;
  dream_count: number;
  top_themes: { theme: string; count: number }[];
  emotional_journey: WeeklyReport['emotional_journey'];
  key_symbols: { symbol: string; count: number }[];
  jungian_summary: WeeklyReport['jungian_summary'];
  ai_insight: string;
}

export interface Dream {
  id: string;
  user_id: string;
  created_at: string;
  recorded_at: string;
  raw_transcript: string;
  cleaned_narrative: string;
  figures: DreamFigure[];
  locations: DreamLocation[];
  objects: DreamObject[];
  actions: DreamAction[];
  emotions: DreamEmotion[];
  themes: string[];
  symbols: DreamSymbol[];
  overall_emotional_tone: string;
  quick_archetype?: QuickArchetype;
  deep_analysis?: DeepAnalysis;
  // Legacy field for backward compatibility
  jungian_analysis?: JungianAnalysis;
  embedding?: number[];
  duration_seconds?: number;
  word_count?: number;
}

export interface DreamInsert {
  user_id: string;
  recorded_at: string;
  raw_transcript: string;
  cleaned_narrative: string;
  figures: DreamFigure[];
  locations: DreamLocation[];
  objects: DreamObject[];
  actions: DreamAction[];
  emotions: DreamEmotion[];
  themes: string[];
  symbols: DreamSymbol[];
  overall_emotional_tone: string;
  quick_archetype?: QuickArchetype;
  deep_analysis?: DeepAnalysis;
  duration_seconds?: number;
  word_count?: number;
}

export interface GeminiDreamResponse {
  raw_transcript: string;
  cleaned_narrative: string;
  figures: DreamFigure[];
  locations: DreamLocation[];
  objects: DreamObject[];
  actions: DreamAction[];
  emotions: DreamEmotion[];
  themes: string[];
  symbols: DreamSymbol[];
  overall_emotional_tone: string;
  quick_archetype: QuickArchetype;
}

export interface RecordingState {
  isRecording: boolean;
  duration: number;
  audioUri: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
