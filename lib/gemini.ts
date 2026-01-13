import { GoogleGenerativeAI } from '@google/generative-ai';
import { File } from 'expo-file-system';
import { DREAM_ANALYSIS_PROMPT, CHAT_SYSTEM_PROMPT } from '@/constants/prompts';
import type { GeminiDreamResponse, ChatMessage, Dream } from '@/types/dream';

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY!);

// Use Gemini 2.0 Flash for audio processing
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

export async function analyzeDreamAudio(audioUri: string): Promise<GeminiDreamResponse> {
  // Read audio file as base64 using new File API
  const file = new File(audioUri);
  const audioBase64 = await file.base64();

  // Determine mime type based on file extension
  const mimeType = audioUri.endsWith('.m4a') ? 'audio/mp4' : 'audio/mpeg';

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType,
        data: audioBase64,
      },
    },
    { text: DREAM_ANALYSIS_PROMPT },
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
    console.error('Failed to parse Gemini response:', text);
    throw new Error('Failed to parse dream analysis response');
  }
}

export async function transcribeAudio(audioUri: string): Promise<string> {
  // Read audio file as base64
  const file = new File(audioUri);
  const audioBase64 = await file.base64();

  const mimeType = audioUri.endsWith('.m4a') ? 'audio/mp4' : 'audio/mpeg';

  const result = await model.generateContent([
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
  dreamContext: Dream | Dream[]
): Promise<string> {
  const dreams = Array.isArray(dreamContext) ? dreamContext : [dreamContext];

  // Build context from dreams
  const dreamContextText = dreams.map((dream, i) => {
    return `Dream ${i + 1} (${new Date(dream.recorded_at).toLocaleDateString()}):
${dream.cleaned_narrative}

Key elements:
- Figures: ${dream.figures.map(f => f.description).join(', ') || 'None noted'}
- Locations: ${dream.locations.map(l => l.description).join(', ') || 'None noted'}
- Emotions: ${dream.emotions.map(e => `${e.emotion} (intensity ${e.intensity})`).join(', ') || 'None noted'}
- Themes: ${dream.themes.join(', ') || 'None noted'}
- Overall tone: ${dream.overall_emotional_tone}
`;
  }).join('\n---\n');

  // Build conversation history
  const conversationHistory = messages.map(m =>
    `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
  ).join('\n\n');

  const prompt = `${CHAT_SYSTEM_PROMPT}

Here are the dreams we're discussing:

${dreamContextText}

Conversation so far:
${conversationHistory}

Respond to the user's last message. Remember to be curious, warm, and never interpret meaning.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
