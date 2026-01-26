import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  dreamGoal: string | null;
  dreamFrequency: string | null;
  selectedPlan: 'free' | 'premium' | null;
  
  // Actions
  setDreamGoal: (goal: string) => void;
  setDreamFrequency: (frequency: string) => void;
  setSelectedPlan: (plan: 'free' | 'premium') => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      dreamGoal: null,
      dreamFrequency: null,
      selectedPlan: null,

      setDreamGoal: (goal) => set({ dreamGoal: goal }),
      
      setDreamFrequency: (frequency) => set({ dreamFrequency: frequency }),
      
      setSelectedPlan: (plan) => set({ selectedPlan: plan }),
      
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      
      resetOnboarding: () => set({
        hasCompletedOnboarding: false,
        dreamGoal: null,
        dreamFrequency: null,
        selectedPlan: null,
      }),
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
