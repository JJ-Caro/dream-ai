import '../global.css';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';
import { reregisterReminderIfNeeded } from '@/lib/notifications';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Custom dark theme matching our design system
const DreamTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.primary,
  },
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const initialize = useAuthStore(state => state.initialize);
  const isInitialized = useAuthStore(state => state.isInitialized);

  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    initialize();
    // Re-register notification reminder if one was previously scheduled
    reregisterReminderIfNeeded();
  }, []);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded && isInitialized) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isInitialized]);

  if (!fontsLoaded || !isInitialized) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DreamTheme}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="dream/[id]"
            options={{
              headerShown: true,
              headerTitle: 'Dream',
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.textPrimary,
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="chat"
            options={{
              headerShown: true,
              headerTitle: 'Chat',
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.textPrimary,
              presentation: 'modal',
            }}
          />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
