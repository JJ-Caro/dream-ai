import { View, Text, Pressable, Modal, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useRecordingStore } from '@/stores/recordingStore';
import { useDreamsStore } from '@/stores/dreamsStore';
import { useAuthStore } from '@/stores/authStore';
import { calculateStreak, getStreakMessage } from '@/lib/streak';
import { haptic } from '@/lib/haptics';
import { colors } from '@/constants/colors';
import { logError } from '@/lib/errorLogger';
import { DreamyBackground, GlassCard } from '@/components/ui';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  Easing,
  interpolate,
  FadeIn,
  FadeInUp,
  FadeOut,
  runOnJS,
} from 'react-native-reanimated';

const STREAK_DISMISSAL_KEY = 'streak_card_dismissed_date';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const RECORD_BUTTON_SIZE = 120;

// Bouncing dot component for processing indicator
function BouncingDot({ delay }: { delay: number }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 300, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 300, easing: Easing.in(Easing.ease) })
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[styles.processingDot, animatedStyle]} />;
}

// Ripple ring component
function RippleRing({ delay, isRecording }: { delay: number; isRecording: boolean }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isRecording) {
      scale.value = withDelay(
        delay,
        withRepeat(
          withTiming(2.2, { duration: 2000, easing: Easing.out(Easing.ease) }),
          -1,
          false
        )
      );
      opacity.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(0.6, { duration: 100 }),
            withTiming(0, { duration: 1900, easing: Easing.out(Easing.ease) })
          ),
          -1,
          false
        )
      );
    } else {
      scale.value = withTiming(1);
      opacity.value = withTiming(0);
    }
  }, [isRecording]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.rippleRing,
        { borderColor: isRecording ? colors.negative : colors.primary },
        animatedStyle,
      ]}
    />
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, signInAnonymously } = useAuthStore();
  const { isRecording, duration, start, stop, reset, updateDuration } = useRecordingStore();
  const { dreams, processDream, isProcessing, fetchDreams } = useDreamsStore();
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streakCardVisible, setStreakCardVisible] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Calculate streak
  const streak = useMemo(() => calculateStreak(dreams), [dreams]);
  const streakMessage = useMemo(() => getStreakMessage(streak), [streak]);

  // Streak card swipe animation
  const streakTranslateY = useSharedValue(0);
  const streakOpacity = useSharedValue(1);

  // Check if streak card was dismissed today
  useEffect(() => {
    const checkDismissal = async () => {
      try {
        const dismissedDate = await AsyncStorage.getItem(STREAK_DISMISSAL_KEY);
        if (dismissedDate) {
          const today = new Date().toDateString();
          if (dismissedDate === today) {
            setStreakCardVisible(false);
          }
        }
      } catch (err) {
        logError('checkDismissal', err);
      }
    };
    checkDismissal();
  }, []);

  // Dismiss streak card for today
  const dismissStreakCard = useCallback(async () => {
    try {
      const today = new Date().toDateString();
      await AsyncStorage.setItem(STREAK_DISMISSAL_KEY, today);
      setStreakCardVisible(false);
      haptic.light();
    } catch (err) {
      logError('dismissStreakCard', err);
    }
  }, []);

  // Swipe up gesture to dismiss streak card
  const streakSwipeGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Only allow upward swipes (negative translationY)
      if (event.translationY < 0) {
        streakTranslateY.value = event.translationY;
        streakOpacity.value = interpolate(
          Math.abs(event.translationY),
          [0, 100],
          [1, 0]
        );
      }
    })
    .onEnd((event) => {
      // If swiped up more than 50px, dismiss
      if (event.translationY < -50) {
        streakTranslateY.value = withTiming(-150, { duration: 200 });
        streakOpacity.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(dismissStreakCard)();
        });
      } else {
        // Snap back
        streakTranslateY.value = withSpring(0);
        streakOpacity.value = withSpring(1);
      }
    });

  const streakCardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: streakTranslateY.value }],
    opacity: streakOpacity.value,
  }));

  // Fetch dreams on mount
  useEffect(() => {
    fetchDreams();
  }, []);

  // Animation values
  const buttonScale = useSharedValue(1);
  const glowPulse = useSharedValue(0.5);
  const logoGlow = useSharedValue(0.3);
  const fireScale = useSharedValue(1);

  // Continuous glow animation
  useEffect(() => {
    logoGlow.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
  }, []);

  // Fire animation for streak
  useEffect(() => {
    if (streak.currentStreak > 0) {
      fireScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      );
    }
  }, [streak.currentStreak]);

  // Recording animations
  useEffect(() => {
    if (isRecording) {
      glowPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.4, { duration: 600 })
        ),
        -1
      );
      intervalRef.current = setInterval(() => {
        updateDuration();
      }, 1000);
    } else {
      glowPulse.value = withTiming(0.5);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording]);

  const fireStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fireScale.value }],
  }));

  const logoGlowStyle = useAnimatedStyle(() => ({
    opacity: logoGlow.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15 });
  };

  const handlePress = async () => {
    setError(null);
    haptic.medium();

    if (!user) {
      try {
        await signInAnonymously();
      } catch (err) {
        setError('Failed to authenticate. Please try again.');
        haptic.error();
        return;
      }
    }

    if (isRecording) {
      try {
        const audioUri = await stop();
        if (audioUri) {
          await processDream(audioUri, duration);
          haptic.success();
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
            reset();
          }, 3000);
        }
      } catch (err) {
        setError('Failed to process dream. Please try again.');
        haptic.error();
        reset();
      }
    } else {
      try {
        await start();
      } catch (err) {
        setError('Failed to start recording. Please check microphone permissions.');
        haptic.error();
      }
    }
  };

  return (
    <DreamyBackground starCount={60}>
      <SafeAreaView style={styles.safeArea}>
        {/* Streak Banner - Swipe up to dismiss */}
        {streakCardVisible && (
          <GestureDetector gesture={streakSwipeGesture}>
            <Animated.View
              entering={FadeInUp.delay(200).duration(600)}
              style={streakCardAnimatedStyle}
            >
              <Pressable
                onPress={() => {
                  haptic.light();
                  router.push('/patterns');
                }}
                style={styles.streakBanner}
              >
                <GlassCard
                  intensity="light"
                  glowColor={streak.streakAtRisk ? colors.negative : colors.secondary}
                  style={streak.streakAtRisk ? styles.streakAtRisk : undefined}
                >
                  <View style={styles.streakContent}>
                    <Animated.View style={fireStyle}>
                      <Text style={styles.streakEmoji}>
                        {streak.currentStreak > 0 ? '🔥' : '🌙'}
                      </Text>
                    </Animated.View>
                    <View style={styles.streakInfo}>
                      <View style={styles.streakRow}>
                        <Text style={styles.streakNumber}>{streak.currentStreak}</Text>
                        <Text style={styles.streakLabel}>
                          {streak.currentStreak === 1 ? ' day streak' : ' day streak'}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.streakMessage,
                          streak.streakAtRisk && styles.streakAtRiskText,
                        ]}
                      >
                        {streakMessage}
                      </Text>
                    </View>
                    <View style={styles.streakActions}>
                      <FontAwesome name="chevron-up" size={10} color={colors.textTertiary} style={styles.swipeHint} />
                      <FontAwesome name="chevron-right" size={14} color={colors.textTertiary} />
                    </View>
                  </View>
                </GlassCard>
              </Pressable>
            </Animated.View>
          </GestureDetector>
        )}

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Logo with glow */}
          <Animated.View
            entering={FadeIn.delay(400).duration(800)}
            style={styles.logoContainer}
          >
            <Animated.View style={[styles.logoGlow, logoGlowStyle]} />
            <Text style={styles.logoText}>DREAM</Text>
            <LinearGradient
              colors={colors.gradients.tealToPurple}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.logoBadge}
            >
              <Text style={styles.logoBadgeText}>AI</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.Text
            entering={FadeIn.delay(600).duration(600)}
            style={styles.subtitle}
          >
            {isRecording
              ? 'Speak freely about your dream...'
              : isProcessing
              ? 'Processing your dream...'
              : 'Tap to capture your dream'}
          </Animated.Text>

          {/* Record Button with Ripples */}
          <Animated.View
            entering={FadeIn.delay(800).duration(800)}
            style={styles.recordContainer}
          >
            {/* Ripple rings */}
            <RippleRing delay={0} isRecording={isRecording} />
            <RippleRing delay={500} isRecording={isRecording} />
            <RippleRing delay={1000} isRecording={isRecording} />

            {/* Ambient glow */}
            <Animated.View
              style={[
                styles.ambientGlow,
                { backgroundColor: isRecording ? colors.negative : colors.primary },
                glowStyle,
              ]}
            />

            {/* Main button */}
            <Animated.View style={buttonStyle}>
              <Pressable
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={isProcessing}
                style={styles.recordButton}
              >
                <LinearGradient
                  colors={
                    isRecording
                      ? colors.gradients.recordButtonActive
                      : colors.gradients.recordButton
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.recordButtonGradient,
                    isRecording ? colors.shadows.glowIntense : colors.shadows.glow,
                  ]}
                >
                  {isProcessing ? (
                    <Animated.View entering={FadeIn.duration(200)} style={styles.processingDots}>
                      <BouncingDot delay={0} />
                      <BouncingDot delay={100} />
                      <BouncingDot delay={200} />
                    </Animated.View>
                  ) : (
                    <View
                      style={[
                        styles.recordIcon,
                        isRecording && styles.recordIconActive,
                      ]}
                    />
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </Animated.View>

          {/* Duration */}
          {isRecording && (
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(300)}
              style={styles.durationContainer}
            >
              <View style={styles.durationDot} />
              <Text style={styles.duration}>{formatDuration(duration)}</Text>
            </Animated.View>
          )}

          {/* Error */}
          {error && (
            <Animated.View
              entering={FadeIn.duration(300)}
              style={styles.errorContainer}
            >
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          )}

          {/* Hint */}
          {!isRecording && !isProcessing && (
            <Animated.Text
              entering={FadeIn.delay(1000).duration(600)}
              style={styles.hint}
            >
              Describe your dream in as much detail as you can remember.
              {'\n'}The AI will structure and analyze it for you.
            </Animated.Text>
          )}
        </View>

        {/* Success Modal */}
        <Modal
          visible={showSuccess}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSuccess(false)}
        >
          <BlurView intensity={80} tint="dark" style={styles.modalOverlay}>
            <Animated.View
              entering={FadeIn.duration(300)}
              style={styles.modalContainer}
            >
              <GlassCard intensity="strong" glowColor={colors.positive}>
                <View style={styles.modalContent}>
                  <View style={styles.successIcon}>
                    <FontAwesome name="check" size={32} color={colors.positive} />
                  </View>
                  <Text style={styles.successTitle}>Dream Captured</Text>
                  <Text style={styles.successMessage}>
                    Your dream has been saved and analyzed.
                  </Text>
                  {streak.currentStreak > 0 && (
                    <View style={styles.successStreak}>
                      <Text style={styles.successStreakEmoji}>🔥</Text>
                      <Text style={styles.successStreakText}>
                        {streak.isActiveToday
                          ? streak.currentStreak
                          : streak.currentStreak + 1}{' '}
                        day streak!
                      </Text>
                    </View>
                  )}
                  <Pressable
                    onPress={() => {
                      haptic.light();
                      setShowSuccess(false);
                      router.push('/dreams');
                    }}
                    style={styles.successButton}
                  >
                    <LinearGradient
                      colors={colors.gradients.primary}
                      style={styles.successButtonGradient}
                    >
                      <Text style={styles.successButtonText}>View Dream</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </GlassCard>
            </Animated.View>
          </BlurView>
        </Modal>
      </SafeAreaView>
    </DreamyBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  streakBanner: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  streakAtRisk: {
    borderColor: colors.negative,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakEmoji: {
    fontSize: 32,
    marginRight: 14,
  },
  streakInfo: {
    flex: 1,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: -1,
  },
  streakLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  streakMessage: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 2,
  },
  streakAtRiskText: {
    color: colors.negative,
  },
  streakActions: {
    alignItems: 'center',
    gap: 4,
  },
  swipeHint: {
    opacity: 0.5,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoGlow: {
    position: 'absolute',
    width: 200,
    height: 60,
    backgroundColor: colors.primary,
    borderRadius: 30,
    left: '50%',
    marginLeft: -100,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
  },
  logoText: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 6,
  },
  logoBadge: {
    marginLeft: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  logoBadgeText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 17,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 50,
    lineHeight: 26,
    letterSpacing: 0.3,
  },
  recordContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: RECORD_BUTTON_SIZE * 2.5,
    height: RECORD_BUTTON_SIZE * 2.5,
  },
  rippleRing: {
    position: 'absolute',
    width: RECORD_BUTTON_SIZE,
    height: RECORD_BUTTON_SIZE,
    borderRadius: RECORD_BUTTON_SIZE / 2,
    borderWidth: 2,
  },
  ambientGlow: {
    position: 'absolute',
    width: RECORD_BUTTON_SIZE * 1.5,
    height: RECORD_BUTTON_SIZE * 1.5,
    borderRadius: RECORD_BUTTON_SIZE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 50,
  },
  recordButton: {
    width: RECORD_BUTTON_SIZE,
    height: RECORD_BUTTON_SIZE,
    borderRadius: RECORD_BUTTON_SIZE / 2,
  },
  recordButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: RECORD_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.textPrimary,
  },
  recordIconActive: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  processingDots: {
    flexDirection: 'row',
    gap: 8,
  },
  processingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.textPrimary,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    backgroundColor: colors.surfaceGlass,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.borderGlass,
  },
  durationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.negative,
    marginRight: 14,
  },
  duration: {
    fontSize: 36,
    fontWeight: '600',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: 3,
  },
  errorContainer: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.negativeSubtle,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.negative,
    maxWidth: '100%',
  },
  errorText: {
    color: colors.negative,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  hint: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 22,
    paddingHorizontal: 20,
    letterSpacing: 0.2,
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
  },
  modalContent: {
    alignItems: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.positiveSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: colors.positive,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  successMessage: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  successStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: colors.secondarySubtle,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
  },
  successStreakEmoji: {
    fontSize: 22,
    marginRight: 10,
  },
  successStreakText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
  },
  successButton: {
    marginTop: 28,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  successButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
});
