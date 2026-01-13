import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
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
    console.log('OpenAI TTS initialized with voice:', PRIMARY_VOICE);
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

    // Save to temporary file using the correct expo-file-system API
    const tempPath = `${FileSystem.cacheDirectory}tts_${Date.now()}.mp3`;
    await FileSystem.writeAsStringAsync(tempPath, base64, {
      encoding: FileSystem.EncodingType.Base64,
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
    console.error('OpenAI TTS failed, trying fallback:', error);

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
        encoding: FileSystem.EncodingType.Base64,
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
      console.error('Fallback TTS also failed:', fallbackError);
      isSpeaking = false;
      options?.onError?.(fallbackError as Error);
    }
  }
}

export async function stop(): Promise<void> {
  if (currentSound) {
    try {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    } catch (error) {
      console.error('Error stopping sound:', error);
    }
    currentSound = null;
  }
  isSpeaking = false;
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
async function cleanup(sound: Audio.Sound, filePath: string): Promise<void> {
  try {
    await sound.unloadAsync();
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(filePath, { idempotent: true });
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}
