import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import OpenAI from 'openai';
import { logError, logWarning } from '@/lib/errorLogger';

const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true, // Required for React Native - API key should be rotated regularly
});

// Voice options: alloy, echo, fable, onyx, nova, shimmer
const PRIMARY_VOICE = 'nova';
const FALLBACK_VOICE = 'alloy';

let currentSound: Audio.Sound | null = null;
let isSpeaking = false;

export async function initializeSpeech(): Promise<void> {
  try {
    // Configure audio mode for playback
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch (error) {
    logError('initializeSpeech', error);
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

  try {
    // Generate speech using OpenAI TTS
    const mp3Response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: PRIMARY_VOICE,
      input: text,
      response_format: 'mp3',
    });

    // Convert response to array buffer then to base64
    const arrayBuffer = await mp3Response.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);

    // Save to temporary file
    const tempPath = `${FileSystem.cacheDirectory}tts_${Date.now()}.mp3`;
    await FileSystem.writeAsStringAsync(tempPath, base64, {
      encoding: 'base64',
    });

    // Create and play sound
    const { sound } = await Audio.Sound.createAsync(
      { uri: tempPath },
      { shouldPlay: true }
    );
    currentSound = sound;

    // Handle playback completion
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        isSpeaking = false;
        options?.onDone?.();
        cleanup(sound, tempPath);
      }
    });
  } catch (error) {
    // Try fallback voice
    try {
      const mp3Response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: FALLBACK_VOICE,
        input: text,
        response_format: 'mp3',
      });

      const arrayBuffer = await mp3Response.arrayBuffer();
      const base64 = arrayBufferToBase64(arrayBuffer);

      const tempPath = `${FileSystem.cacheDirectory}tts_${Date.now()}.mp3`;
      await FileSystem.writeAsStringAsync(tempPath, base64, {
        encoding: 'base64',
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: tempPath },
        { shouldPlay: true }
      );
      currentSound = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          isSpeaking = false;
          options?.onDone?.();
          cleanup(sound, tempPath);
        }
      });
    } catch (fallbackError) {
      isSpeaking = false;
      options?.onError?.(fallbackError as Error);
    }
  }
}

export async function stop(): Promise<void> {
  const sound = currentSound;
  currentSound = null;
  isSpeaking = false;

  if (sound) {
    try {
      await sound.stopAsync();
      await sound.unloadAsync();
    } catch (error) {
      // Sound may already be stopped
      logWarning('stop', 'Sound may already be stopped');
    }
  }
}

export function getIsSpeaking(): boolean {
  return isSpeaking;
}

// Helper to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Cleanup sound and temp file
async function cleanup(sound: Audio.Sound | null, filePath: string): Promise<void> {
  try {
    if (sound) {
      await sound.unloadAsync();
    }
    if (filePath) {
      await FileSystem.deleteAsync(filePath, { idempotent: true });
    }
  } catch (error) {
    // File/sound may already be cleaned up
    logWarning('cleanup', 'Cleanup may have already occurred');
  }
}
