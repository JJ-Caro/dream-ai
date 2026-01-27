import { Stack } from 'expo-router';
import { colors } from '@/constants/colors';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
        gestureEnabled: false, // Prevent swiping back during onboarding
      }}
    >
      {/* 
        Onboarding Flow (optimized for conversion):
        1. Welcome - Value prop, build excitement
        2. Problem - Why they downloaded, build pain awareness
        3. Features - Show the solution
        4. Personalize - Collect preferences, build investment
        5. Social Proof - Testimonials, build trust
        6. Paywall - Convert (with free trial)
      */}
      <Stack.Screen name="welcome" />
      <Stack.Screen name="problem" />
      <Stack.Screen name="features" />
      <Stack.Screen name="personalize" />
      <Stack.Screen name="social-proof" />
      <Stack.Screen name="paywall" />
    </Stack>
  );
}
