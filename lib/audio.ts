import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

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

export async function startRecording(): Promise<void> {
  try {
    // Clean up any existing recording first
    if (recording) {
      try {
        const status = await recording.getStatusAsync();
        if (status.isRecording) {
          await recording.stopAndUnloadAsync();
        }
      } catch {
        // Ignore errors when cleaning up
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
    const { recording: newRecording } = await Audio.Recording.createAsync(
      RECORDING_OPTIONS
    );
    recording = newRecording;
  } catch (error) {
    console.error('Failed to start recording:', error);
    recording = null;
    throw error;
  }
}

export async function stopRecording(): Promise<string | null> {
  if (!recording) {
    return null;
  }

  try {
    const status = await recording.getStatusAsync();
    if (status.isRecording) {
      await recording.stopAndUnloadAsync();
    }

    // Reset audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });

    const uri = recording.getURI();
    recording = null;
    return uri;
  } catch (error) {
    console.error('Failed to stop recording:', error);
    recording = null;
    throw error;
  }
}

export async function cancelRecording(): Promise<void> {
  if (!recording) {
    return;
  }

  try {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    recording = null;

    // Delete the cancelled recording
    if (uri) {
      await deleteAudioFile(uri);
    }
  } catch (error) {
    console.error('Failed to cancel recording:', error);
    recording = null;
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
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch (error) {
    console.error('Failed to delete audio file:', error);
  }
}

export function getAudioDirectory(): string {
  return `${FileSystem.documentDirectory}audio/`;
}

export async function ensureAudioDirectory(): Promise<void> {
  const dirPath = getAudioDirectory();
  const dirInfo = await FileSystem.getInfoAsync(dirPath);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
  }
}
