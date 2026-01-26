// Sleep Data Integration Store
// Connect with HealthKit (iOS) and Google Fit (Android)

import { create } from 'zustand';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { logError, logWarning } from '@/lib/errorLogger';
import type { SleepData } from '@/types/dream';

interface SleepDataState {
  sleepData: SleepData[];
  isLoading: boolean;
  isConnected: boolean;
  
  fetchSleepData: () => Promise<void>;
  addManualSleepEntry: (entry: Omit<SleepData, 'id' | 'user_id' | 'source'>) => Promise<void>;
  connectHealthKit: () => Promise<boolean>;
  connectGoogleFit: () => Promise<boolean>;
  syncSleepData: () => Promise<void>;
  linkDreamToSleep: (sleepId: string, dreamId: string) => Promise<void>;
  getSleepForDate: (date: string) => SleepData | undefined;
}

export const useSleepDataStore = create<SleepDataState>((set, get) => ({
  sleepData: [],
  isLoading: false,
  isConnected: false,
  
  fetchSleepData: async () => {
    if (!supabase) return;
    set({ isLoading: true });
    
    try {
      const { data, error } = await supabase
        .from('sleep_data')
        .select('*')
        .order('date', { ascending: false })
        .limit(90); // Last 90 days
      
      if (error) throw error;
      set({ sleepData: data as SleepData[] });
    } catch (error) {
      logError('fetchSleepData', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  addManualSleepEntry: async (entry) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('sleep_data')
      .insert({
        ...entry,
        user_id: user.id,
        source: 'manual',
      })
      .select()
      .single();
    
    if (error) throw error;
    set(state => ({ sleepData: [data as SleepData, ...state.sleepData] }));
  },
  
  connectHealthKit: async () => {
    if (Platform.OS !== 'ios') {
      logWarning('connectHealthKit', 'HealthKit is only available on iOS');
      return false;
    }
    
    // TODO: Implement HealthKit integration
    // This requires expo-health or react-native-health
    // For now, return placeholder
    logWarning('connectHealthKit', 'HealthKit integration not yet implemented');
    
    /*
    Example implementation with expo-health:
    
    import * as Health from 'expo-health';
    
    const permissions = [Health.HealthDataType.SleepAnalysis];
    const authorized = await Health.requestPermissionsAsync(permissions);
    
    if (authorized) {
      set({ isConnected: true });
      await get().syncSleepData();
      return true;
    }
    */
    
    return false;
  },
  
  connectGoogleFit: async () => {
    if (Platform.OS !== 'android') {
      logWarning('connectGoogleFit', 'Google Fit is only available on Android');
      return false;
    }
    
    // TODO: Implement Google Fit integration
    // This requires react-native-google-fit
    logWarning('connectGoogleFit', 'Google Fit integration not yet implemented');
    
    /*
    Example implementation:
    
    import GoogleFit from 'react-native-google-fit';
    
    const options = {
      scopes: [
        GoogleFit.Scopes.SLEEP_READ,
      ],
    };
    
    const authorized = await GoogleFit.authorize(options);
    if (authorized.success) {
      set({ isConnected: true });
      await get().syncSleepData();
      return true;
    }
    */
    
    return false;
  },
  
  syncSleepData: async () => {
    // TODO: Implement actual sync from HealthKit/Google Fit
    // This would fetch sleep data from the native health APIs
    // and save it to Supabase
    
    /*
    Example for HealthKit:
    
    const sleepSamples = await Health.queryQuantitySamplesAsync({
      type: Health.HealthDataType.SleepAnalysis,
      startDate: subDays(new Date(), 30).toISOString(),
      endDate: new Date().toISOString(),
    });
    
    for (const sample of sleepSamples) {
      // Process and save to Supabase
    }
    */
    
    logWarning('syncSleepData', 'Sleep data sync not yet implemented');
  },
  
  linkDreamToSleep: async (sleepId, dreamId) => {
    if (!supabase) return;
    
    const sleepEntry = get().sleepData.find(s => s.id === sleepId);
    if (!sleepEntry) return;
    
    const newLinkedDreams = [...new Set([...sleepEntry.linked_dream_ids, dreamId])];
    
    const { error } = await supabase
      .from('sleep_data')
      .update({ linked_dream_ids: newLinkedDreams })
      .eq('id', sleepId);
    
    if (error) {
      logError('linkDreamToSleep', error);
      return;
    }
    
    set(state => ({
      sleepData: state.sleepData.map(s =>
        s.id === sleepId ? { ...s, linked_dream_ids: newLinkedDreams } : s
      ),
    }));
  },
  
  getSleepForDate: (date) => {
    return get().sleepData.find(s => s.date === date);
  },
}));

// Utility to calculate sleep quality insights
export function calculateSleepQualityInsights(sleepData: SleepData[]) {
  if (sleepData.length === 0) return null;
  
  const totalSleep = sleepData.reduce((sum, s) => sum + s.total_sleep_minutes, 0);
  const avgSleep = totalSleep / sleepData.length;
  
  const remData = sleepData.filter(s => s.rem_sleep_minutes !== undefined);
  const avgRem = remData.length > 0
    ? remData.reduce((sum, s) => sum + (s.rem_sleep_minutes || 0), 0) / remData.length
    : undefined;
  
  const qualityData = sleepData.filter(s => s.sleep_quality !== undefined);
  const avgQuality = qualityData.length > 0
    ? qualityData.reduce((sum, s) => sum + (s.sleep_quality || 0), 0) / qualityData.length
    : undefined;
  
  return {
    averageSleepMinutes: Math.round(avgSleep),
    averageSleepHours: (avgSleep / 60).toFixed(1),
    averageRemMinutes: avgRem ? Math.round(avgRem) : undefined,
    averageQuality: avgQuality ? Math.round(avgQuality) : undefined,
    totalDreamsRecorded: sleepData.reduce((sum, s) => sum + s.linked_dream_ids.length, 0),
    bestNightForDreams: sleepData.reduce((best, s) =>
      s.linked_dream_ids.length > (best?.linked_dream_ids.length || 0) ? s : best
    , sleepData[0]),
  };
}
