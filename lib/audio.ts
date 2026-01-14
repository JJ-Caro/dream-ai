import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

// Recording settings optimized for voice (M4A/AAC, 64kbps mono)
const RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 64000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.MEDIUM,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 64000,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 64000,
  },
};

let recording: Audio.Recording | null = null;
let isRecordingActive = false;

export async function startRecording(): Promise<void> {
  // Prevent multiple concurrent recordings
  if (isRecordingActive) {
    console.warn('Recording already in progress');
    return;
  }

  try {
    // Clean up any existing recording first
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
      } catch {
        // Ignore cleanup errors
      }
      recording = null;
    }

    // Request permissions
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Audio recording permission not granted');
    }

    // Set audio mode for recording
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    // Create and start recording
    isRecordingActive = true;
    const { recording: newRecording } = await Audio.Recording.createAsync(
      RECORDING_OPTIONS
    );
    recording = newRecording;
  } catch (error) {
    console.error('Failed to start recording:', error);
    recording = null;
    isRecordingActive = false;
    throw error;
  }
}

export async function stopRecording(): Promise<string | null> {
  // Capture current recording reference
  const currentRecording = recording;
  recording = null;
  isRecordingActive = false;

  if (!currentRecording) {
    return null;
  }

  let uri: string | null = null;

  try {
    // Get URI before stopping (it may be cleared after unload)
    uri = currentRecording.getURI();

    // Try to stop and unload
    try {
      const status = await currentRecording.getStatusAsync();
      if (status?.isRecording) {
        await currentRecording.stopAndUnloadAsync();
      }
    } catch {
      // Recording may already be stopped, try to unload anyway
      try {
        await currentRecording.stopAndUnloadAsync();
      } catch {
        // Ignore - recording is already unloaded
      }
    }

    // Reset audio mode
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
    } catch {
      // Ignore audio mode errors
    }

    return uri;
  } catch (error) {
    console.error('Failed to stop recording:', error);
    return uri; // Return URI if we got it, even if stop failed
  }
}

export async function cancelRecording(): Promise<void> {
  const currentRecording = recording;
  recording = null;
  isRecordingActive = false;

  if (!currentRecording) {
    return;
  }

  try {
    const uri = currentRecording.getURI();

    try {
      await currentRecording.stopAndUnloadAsync();
    } catch {
      // Ignore stop errors
    }

    // Delete the cancelled recording
    if (uri) {
      await deleteAudioFile(uri);
    }
  } catch (error) {
    console.error('Failed to cancel recording:', error);
  }
}

export async function getRecordingStatus(): Promise<Audio.RecordingStatus | null> {
  if (!recording) {
    return null;
  }
  try {
    return await recording.getStatusAsync();
  } catch {
    return null;
  }
}

export async function deleteAudioFile(uri: string): Promise<void> {
  if (!uri) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (error) {
    console.error('Failed to delete audio file:', error);
  }
}

export function getAudioDirectory(): string {
  return `${FileSystem.documentDirectory}audio/`;
}

export async function ensureAudioDirectory(): Promise<void> {
  try {
    const dirPath = getAudioDirectory();
    await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
  } catch {
    // Directory likely already exists, ignore
  }
}
