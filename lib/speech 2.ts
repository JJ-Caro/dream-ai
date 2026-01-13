import * as Speech from 'expo-speech';

// Preferred voices for natural-sounding speech (iOS)
const PREFERRED_VOICES = [
  'com.apple.voice.premium.en-US.Zoe',      // Premium Zoe (very natural)
  'com.apple.voice.premium.en-US.Ava',      // Premium Ava
  'com.apple.voice.enhanced.en-US.Zoe',     // Enhanced Zoe
  'com.apple.voice.enhanced.en-US.Ava',     // Enhanced Ava
  'com.apple.voice.enhanced.en-US.Samantha', // Enhanced Samantha
  'com.apple.ttsbundle.Samantha-compact',   // Compact Samantha
  'com.apple.voice.compact.en-US.Samantha', // Samantha
];

let selectedVoice: string | null = null;
let isSpeaking = false;

export async function initializeSpeech(): Promise<void> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();

    // Find the best available voice
    for (const preferredId of PREFERRED_VOICES) {
      const found = voices.find(v => v.identifier === preferredId);
      if (found) {
        selectedVoice = found.identifier;
        console.log('Selected voice:', found.name, found.identifier);
        break;
      }
    }

    // Fallback to any en-US voice
    if (!selectedVoice) {
      const enVoice = voices.find(v => v.language.startsWith('en'));
      if (enVoice) {
        selectedVoice = enVoice.identifier;
        console.log('Fallback voice:', enVoice.name);
      }
    }
  } catch (error) {
    console.error('Failed to initialize speech:', error);
  }
}

export interface SpeakOptions {
  onStart?: () => void;
  onDone?: () => void;
  onError?: (error: Error) => void;
}

export async function speak(text: string, options?: SpeakOptions): Promise<void> {
  // Stop any current speech
  await stop();

  isSpeaking = true;
  options?.onStart?.();

  return new Promise((resolve) => {
    Speech.speak(text, {
      voice: selectedVoice || undefined,
      language: 'en-US',
      pitch: 1.0,
      rate: 0.92, // Slightly slower for clarity
      onDone: () => {
        isSpeaking = false;
        options?.onDone?.();
        resolve();
      },
      onError: (error) => {
        isSpeaking = false;
        options?.onError?.(new Error(String(error)));
        resolve();
      },
      onStopped: () => {
        isSpeaking = false;
        options?.onDone?.();
        resolve();
      },
    });
  });
}

export async function stop(): Promise<void> {
  if (isSpeaking) {
    await Speech.stop();
    isSpeaking = false;
  }
}

export function getIsSpeaking(): boolean {
  return isSpeaking;
}
