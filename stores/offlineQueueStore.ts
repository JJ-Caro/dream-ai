// Offline Queue Store
// Queue operations when offline and sync when back online

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { logError, logWarning } from '@/lib/errorLogger';

const OFFLINE_QUEUE_KEY = 'offline_queue';

export type QueuedOperation = {
  id: string;
  type: 'dream' | 'symbol' | 'incubation' | 'synchronicity' | 'comment';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  retryCount: number;
};

interface OfflineQueueState {
  queue: QueuedOperation[];
  isOnline: boolean;
  isSyncing: boolean;
  
  initialize: () => Promise<void>;
  addToQueue: (operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount'>) => Promise<void>;
  removeFromQueue: (id: string) => Promise<void>;
  syncQueue: () => Promise<void>;
  getQueueLength: () => number;
}

export const useOfflineQueueStore = create<OfflineQueueState>((set, get) => ({
  queue: [],
  isOnline: true,
  isSyncing: false,
  
  initialize: async () => {
    // Load existing queue
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (stored) {
        set({ queue: JSON.parse(stored) });
      }
    } catch (error) {
      logError('loadOfflineQueue', error);
    }
    
    // Subscribe to network state
    NetInfo.addEventListener(state => {
      const wasOffline = !get().isOnline;
      const isNowOnline = state.isConnected && state.isInternetReachable;
      
      set({ isOnline: !!isNowOnline });
      
      // Sync when coming back online
      if (wasOffline && isNowOnline) {
        get().syncQueue();
      }
    });
    
    // Check initial state
    const netState = await NetInfo.fetch();
    set({ isOnline: !!(netState.isConnected && netState.isInternetReachable) });
  },
  
  addToQueue: async (operation) => {
    const queuedOp: QueuedOperation = {
      ...operation,
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };
    
    const updated = [...get().queue, queuedOp];
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
    set({ queue: updated });
    
    // Try to sync immediately if online
    if (get().isOnline) {
      get().syncQueue();
    }
  },
  
  removeFromQueue: async (id) => {
    const updated = get().queue.filter(op => op.id !== id);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
    set({ queue: updated });
  },
  
  syncQueue: async () => {
    const { queue, isOnline, isSyncing } = get();
    
    if (!isOnline || isSyncing || queue.length === 0) return;
    
    set({ isSyncing: true });
    
    for (const operation of queue) {
      try {
        // Process based on operation type
        await processOperation(operation);
        await get().removeFromQueue(operation.id);
      } catch (error) {
        logWarning('syncQueue', `Failed to process operation ${operation.id}`);
        
        // Increment retry count
        const updated = get().queue.map(op =>
          op.id === operation.id
            ? { ...op, retryCount: op.retryCount + 1 }
            : op
        );
        
        // Remove operations that have failed too many times
        const filtered = updated.filter(op => op.retryCount < 5);
        await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
        set({ queue: filtered });
      }
    }
    
    set({ isSyncing: false });
  },
  
  getQueueLength: () => get().queue.length,
}));

// Process individual operations
async function processOperation(operation: QueuedOperation): Promise<void> {
  const { supabase } = await import('@/lib/supabase');
  if (!supabase) throw new Error('Supabase not configured');
  
  const tableMap: Record<QueuedOperation['type'], string> = {
    dream: 'dreams',
    symbol: 'personal_symbols',
    incubation: 'dream_incubations',
    synchronicity: 'synchronicities',
    comment: 'dream_comments',
  };
  
  const table = tableMap[operation.type];
  
  switch (operation.action) {
    case 'create':
      const { error: createError } = await supabase
        .from(table)
        .insert(operation.data);
      if (createError) throw createError;
      break;
      
    case 'update':
      const { error: updateError } = await supabase
        .from(table)
        .update(operation.data.updates)
        .eq('id', operation.data.id);
      if (updateError) throw updateError;
      break;
      
    case 'delete':
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('id', operation.data.id);
      if (deleteError) throw deleteError;
      break;
  }
}
