import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_DREAMS_KEY = 'pending_dreams';

export interface PendingDream {
  id: string;
  audioUri: string;
  recordedAt: string;
  durationSeconds: number;
}

export async function getPendingDreams(): Promise<PendingDream[]> {
  try {
    const data = await AsyncStorage.getItem(PENDING_DREAMS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get pending dreams:', error);
    return [];
  }
}

export async function addPendingDream(dream: PendingDream): Promise<void> {
  try {
    const pending = await getPendingDreams();
    pending.push(dream);
    await AsyncStorage.setItem(PENDING_DREAMS_KEY, JSON.stringify(pending));
  } catch (error) {
    console.error('Failed to add pending dream:', error);
    throw error;
  }
}

export async function removePendingDream(id: string): Promise<void> {
  try {
    const pending = await getPendingDreams();
    const filtered = pending.filter(d => d.id !== id);
    await AsyncStorage.setItem(PENDING_DREAMS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove pending dream:', error);
    throw error;
  }
}

export async function clearPendingDreams(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PENDING_DREAMS_KEY);
  } catch (error) {
    console.error('Failed to clear pending dreams:', error);
    throw error;
  }
}
