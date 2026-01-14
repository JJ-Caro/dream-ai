import '../global.css';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/colors';
import { reregisterReminderIfNeeded } from '@/lib/notifications';
import { logError, logDebug } from '@/lib/errorLogger';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)',
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

// Loading screen component
function LoadingScreen() {
  return (
    <View style={loadingStyles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={loadingStyles.text}>Loading...</Text>
    </View>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: 16,
    color: colors.textSecondary,
    fontSize: 16,
  },
});

// Handle deep links for auth callbacks
function useDeepLinkHandler() {
  useEffect(() => {
    // Handle initial URL (app opened from link)
    const handleInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleAuthCallback(initialUrl);
      }
    };

    // Handle URL when app is already open
    const subscription = Linking.addEventListener('url', (event) => {
      handleAuthCallback(event.url);
    });

    handleInitialURL();

    return () => {
      subscription.remove();
    };
  }, []);
}

// Process auth callback URL
async function handleAuthCallback(url: string) {
  try {
    logDebug('handleAuthCallback', 'Processing URL', url);

    // Check if this is an auth callback
    if (url.includes('auth/callback') || url.includes('access_token') || url.includes('refresh_token')) {
      // Extract tokens from URL fragment
      const hashParams = url.split('#')[1];
      if (hashParams && supabase) {
        const params = new URLSearchParams(hashParams);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          logDebug('handleAuthCallback', 'Setting session from magic link');
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            logError('handleAuthCallback', error);
          }
        }
      }
    }
  } catch (error) {
    logError('handleAuthCallback', error);
  }
}

function useProtectedRoute(user: any, isInitialized: boolean) {
  const segments = useSegments();
  const router = useRouter();
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      setHasNavigated(true);
      setTimeout(() => router.replace('/(auth)/login'), 0);
    } else if (user && inAuthGroup) {
      setHasNavigated(true);
      setTimeout(() => router.replace('/(tabs)'), 0);
    }
  }, [user, segments, isInitialized]);

  return hasNavigated;
}

export default function RootLayout() {
  const initialize = useAuthStore(state => state.initialize);
  const isInitialized = useAuthStore(state => state.isInitialized);
  const user = useAuthStore(state => state.user);

  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Handle deep links for magic link auth
  useDeepLinkHandler();

  useEffect(() => {
    initialize();
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

  useProtectedRoute(user, isInitialized);

  // Show loading screen while initializing
  if (!fontsLoaded || !isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DreamTheme}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
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
