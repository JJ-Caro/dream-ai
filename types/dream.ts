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
