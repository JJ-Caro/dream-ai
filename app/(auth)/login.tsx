import { View, Text, TextInput, Pressable, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';
import { DreamyBackground } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { haptic } from '@/lib/haptics';

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithEmail, signInAnonymously, isLoading, isConfigured } = useAuthStore();
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleEmailSignIn = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    haptic.medium();
    try {
      await signInWithEmail(email.trim());
      setEmailSent(true);
      haptic.success();
    } catch (error: any) {
      haptic.error();
      Alert.alert('Error', error.message || 'Failed to send magic link. Please try again.');
    }
  };

  const handleSkip = async () => {
    haptic.light();
    try {
      await signInAnonymously();
      haptic.success();
      router.replace('/(tabs)');
    } catch (error: any) {
      haptic.error();
      Alert.alert('Error', error.message || 'Failed to continue. Please try again.');
    }
  };

  if (!isConfigured) {
    return (
      <DreamyBackground starCount={50} showOrbs={true}>
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.errorText}>
              App is not configured. Please set up Supabase credentials.
            </Text>
          </View>
        </SafeAreaView>
      </DreamyBackground>
    );
  }

  if (emailSent) {
    return (
      <DreamyBackground starCount={50} showOrbs={true}>
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.content}
          >
            <Animated.View entering={FadeIn.duration(500)} style={styles.successContainer}>
              <View style={styles.successIconContainer}>
                <LinearGradient
                  colors={colors.gradients.primary}
                  style={styles.successIcon}
                >
                  <FontAwesome name="envelope" size={32} color={colors.textPrimary} />
                </LinearGradient>
              </View>

              <Text style={styles.successTitle}>Check Your Email</Text>
              <Text style={styles.successSubtitle}>
                We sent a magic link to
              </Text>
              <Text style={styles.successEmail}>{email}</Text>
              <Text style={styles.successHint}>
                Click the link in the email to sign in. You can close this screen.
              </Text>

              <View style={styles.successActions}>
                <Button
                  title="Use Different Email"
                  variant="outline"
                  onPress={() => {
                    setEmailSent(false);
                    setEmail('');
                  }}
                />
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </DreamyBackground>
    );
  }

  return (
    <DreamyBackground starCount={50} showOrbs={true}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={colors.gradients.tealToPurple}
                  style={styles.logoGradient}
                >
                  <FontAwesome name="moon-o" size={40} color={colors.textPrimary} />
                </LinearGradient>
              </View>
              <Text style={styles.title}>DREAM AI</Text>
              <Text style={styles.subtitle}>
                Capture your dreams in 60 seconds.{'\n'}Discover patterns you'd never see.
              </Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <FontAwesome name="envelope-o" size={18} color={colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              <Button
                title={isLoading ? 'Sending...' : 'Continue with Email'}
                onPress={handleEmailSignIn}
                disabled={isLoading}
                size="large"
                style={styles.emailButton}
                icon={isLoading ? <ActivityIndicator size="small" color={colors.textPrimary} /> : undefined}
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.skipButton,
                  pressed && styles.skipButtonPressed,
                ]}
                onPress={handleSkip}
                disabled={isLoading}
              >
                <Text style={styles.skipText}>Skip for now</Text>
                <Text style={styles.skipHint}>You can add your email later</Text>
              </Pressable>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                By continuing, you agree to our Privacy Policy
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </DreamyBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGradient: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...colors.shadows.glow,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 4,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    ...colors.shadows.card,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  inputIcon: {
    paddingLeft: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  emailButton: {
    marginBottom: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: colors.textTertiary,
    fontSize: 13,
    marginHorizontal: 16,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 16,
  },
  skipButtonPressed: {
    opacity: 0.7,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  skipHint: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 4,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.negative,
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    ...colors.shadows.card,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...colors.shadows.glow,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  successEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 16,
  },
  successHint: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  successActions: {
    width: '100%',
  },
});
