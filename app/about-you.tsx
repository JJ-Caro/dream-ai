import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useUserContextStore } from '@/stores/userContextStore';
import { useRecordingStore } from '@/stores/recordingStore';
import { transcribeAudio } from '@/lib/gemini';
import { deleteAudioFile } from '@/lib/audio';
import { colors } from '@/constants/colors';
import { DreamyBackground, GlassCard, TypingIndicator } from '@/components/ui';
import { haptic } from '@/lib/haptics';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  FadeIn,
  FadeInDown,
  FadeInUp,
  Easing,
  interpolate,
} from 'react-native-reanimated';

type InputMode = 'type' | 'talk';

// Animated waveform bar component
function WaveformBar({ index, isActive }: { index: number; isActive: boolean }) {
  const height = useSharedValue(8);

  useEffect(() => {
    if (isActive) {
      const baseHeight = 8 + Math.random() * 8;
      const maxHeight = 20 + Math.random() * 20;
      const duration = 200 + Math.random() * 200;

      height.value = withDelay(
        index * 50,
        withRepeat(
          withSequence(
            withTiming(maxHeight, { duration, easing: Easing.inOut(Easing.ease) }),
            withTiming(baseHeight, { duration, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        )
      );
    } else {
      height.value = withTiming(8, { duration: 200 });
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View style={[styles.waveformBar, animatedStyle]}>
      <LinearGradient
        colors={isActive ? colors.gradients.tealToPurple : ['rgba(79, 209, 197, 0.3)', 'rgba(79, 209, 197, 0.3)']}
        style={styles.waveformBarGradient}
      />
    </Animated.View>
  );
}

function Waveform({ isActive }: { isActive: boolean }) {
  const bars = 12;
  return (
    <View style={styles.waveformContainer}>
      {Array.from({ length: bars }).map((_, i) => (
        <WaveformBar key={i} index={i} isActive={isActive} />
      ))}
    </View>
  );
}

function ModeToggle({
  mode,
  onModeChange,
}: {
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
}) {
  const indicatorPosition = useSharedValue(mode === 'type' ? 0 : 1);

  useEffect(() => {
    indicatorPosition.value = withTiming(mode === 'type' ? 0 : 1, { duration: 200 });
  }, [mode]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value * 88 }],
  }));

  return (
    <View style={styles.modeToggleWrapper}>
      <BlurView intensity={30} tint="dark" style={styles.modeToggleBlur}>
        <View style={styles.modeToggleContainer}>
          <Animated.View style={[styles.modeIndicator, indicatorStyle]}>
            <LinearGradient
              colors={colors.gradients.tealToPurple}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modeIndicatorGradient}
            />
          </Animated.View>
          <Pressable onPress={() => onModeChange('type')} style={styles.modeButton}>
            <FontAwesome
              name="keyboard-o"
              size={15}
              color={mode === 'type' ? colors.textPrimary : colors.textTertiary}
            />
            <Text style={[styles.modeButtonText, mode === 'type' && styles.modeButtonTextActive]}>
              Type
            </Text>
          </Pressable>
          <Pressable onPress={() => onModeChange('talk')} style={styles.modeButton}>
            <FontAwesome
              name="microphone"
              size={15}
              color={mode === 'talk' ? colors.textPrimary : colors.textTertiary}
            />
            <Text style={[styles.modeButtonText, mode === 'talk' && styles.modeButtonTextActive]}>
              Talk
            </Text>
          </Pressable>
        </View>
      </BlurView>
    </View>
  );
}

const INTRO_MESSAGE = `I'd love to learn about you so I can better understand your dreams. You can share as much or as little as you'd like — things like:

• Where you grew up and live now
• Important relationships (family, partner, close friends)
• Your work or what you spend your days doing
• Any major life events or changes happening
• Recurring worries or things on your mind

What would you like to share?`;

export default function AboutYouScreen() {
  const router = useRouter();
  const { userContext, isSaving, saveUserContext, fetchUserContext } = useUserContextStore();
  const { isRecording, start, stop, reset, duration, updateDuration } = useRecordingStore();

  const [input, setInput] = useState('');
  const [mode, setMode] = useState<InputMode>('type');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [saved, setSaved] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load existing context on mount
  useEffect(() => {
    fetchUserContext();
  }, []);

  // Pre-fill input with existing context
  useEffect(() => {
    if (userContext && !input) {
      setInput(userContext);
    }
  }, [userContext]);

  // Recording animation
  const recordScale = useSharedValue(1);
  const recordGlow = useSharedValue(0);
  const ringScale1 = useSharedValue(1);
  const ringOpacity1 = useSharedValue(0);

  useEffect(() => {
    if (isRecording) {
      recordScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      );
      recordGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0.5, { duration: 800 })
        ),
        -1
      );
      ringScale1.value = withRepeat(
        withTiming(2, { duration: 1500, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
      ringOpacity1.value = withRepeat(
        withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );

      intervalRef.current = setInterval(() => {
        updateDuration();
      }, 1000);
    } else {
      recordScale.value = withTiming(1);
      recordGlow.value = withTiming(0);
      ringScale1.value = 1;
      ringOpacity1.value = 0;
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

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: recordScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: recordGlow.value,
  }));

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale1.value }],
    opacity: interpolate(ringScale1.value, [1, 2], [0.6, 0]),
  }));

  const handleVoiceRecord = async () => {
    if (isRecording) {
      haptic.medium();
      try {
        const audioUri = await stop();
        if (audioUri) {
          setIsTranscribing(true);
          const transcription = await transcribeAudio(audioUri);
          await deleteAudioFile(audioUri);
          setIsTranscribing(false);

          if (transcription.trim()) {
            // Append to existing input
            setInput(prev => prev ? `${prev}\n\n${transcription.trim()}` : transcription.trim());
          }
        }
        reset();
      } catch (error) {
        reset();
        setIsTranscribing(false);
      }
    } else {
      haptic.heavy();
      try {
        await start();
      } catch (error) {
      }
    }
  };

  const handleSave = async () => {
    if (!input.trim() || isSaving) return;

    haptic.medium();
    try {
      await saveUserContext(input.trim());
      setSaved(true);
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (error) {
    }
  };

  return (
    <DreamyBackground starCount={30} showOrbs={true}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.headerWrapper}>
            <GlassCard style={styles.headerCard} noPadding intensity="medium">
              <View style={styles.headerInner}>
                <View style={styles.headerTop}>
                  <Pressable
                    onPress={() => {
                      haptic.light();
                      router.back();
                    }}
                    style={styles.closeButton}
                  >
                    <FontAwesome name="chevron-left" size={16} color={colors.textSecondary} />
                  </Pressable>
                  <View style={styles.headerCenter}>
                    <LinearGradient
                      colors={colors.gradients.tealToPurple}
                      style={styles.headerAvatar}
                    >
                      <FontAwesome name="user-circle-o" size={20} color={colors.textPrimary} />
                    </LinearGradient>
                    <Text style={styles.headerTitle}>About You</Text>
                  </View>
                  <View style={styles.headerRight}>
                    {saved && (
                      <Animated.View entering={FadeIn.duration(300)}>
                        <FontAwesome name="check-circle" size={20} color={colors.positive} />
                      </Animated.View>
                    )}
                  </View>
                </View>
                <View style={styles.headerBottom}>
                  <ModeToggle mode={mode} onModeChange={setMode} />
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Content */}
          <ScrollView
            ref={scrollRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* AI Message */}
            <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.aiMessage}>
              <View style={styles.avatarContainer}>
                <LinearGradient colors={colors.gradients.tealToPurple} style={styles.avatar}>
                  <FontAwesome name="moon-o" size={14} color={colors.textPrimary} />
                </LinearGradient>
              </View>
              <GlassCard style={styles.aiBubble} noPadding intensity="light" haptic={false}>
                <View style={styles.aiBubbleContent}>
                  <Text style={styles.aiText}>{INTRO_MESSAGE}</Text>
                </View>
              </GlassCard>
            </Animated.View>

            {/* User Input Area - Type Mode */}
            {mode === 'type' && (
              <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.inputSection}>
                <GlassCard style={styles.inputCard} noPadding intensity="light" haptic={false}>
                  <TextInput
                    value={input}
                    onChangeText={setInput}
                    placeholder="Share your story here..."
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    style={styles.textInput}
                    textAlignVertical="top"
                  />
                </GlassCard>
              </Animated.View>
            )}

            {/* User Input Display - Talk Mode */}
            {mode === 'talk' && input && (
              <Animated.View entering={FadeIn.duration(300)} style={styles.inputSection}>
                <GlassCard style={styles.inputCard} noPadding intensity="light" haptic={false}>
                  <View style={styles.transcriptContainer}>
                    <Text style={styles.transcriptText}>{input}</Text>
                  </View>
                </GlassCard>
              </Animated.View>
            )}
          </ScrollView>

          {/* Talk Mode Controls */}
          {mode === 'talk' && (
            <Animated.View entering={FadeInUp.duration(400)} style={styles.talkInputWrapper}>
              <GlassCard style={styles.talkInputCard} noPadding intensity="medium">
                <View style={styles.talkInputContainer}>
                  {isTranscribing ? (
                    <View style={styles.transcribingContainer}>
                      <TypingIndicator />
                      <Text style={styles.transcribingText}>Processing your voice...</Text>
                    </View>
                  ) : (
                    <>
                      {isRecording && (
                        <Animated.View entering={FadeIn.duration(200)} style={styles.recordingInfo}>
                          <View style={styles.recordingBadge}>
                            <View style={styles.recordingDot} />
                            <Text style={styles.recordingText}>{duration}s</Text>
                          </View>
                          <Waveform isActive={isRecording} />
                        </Animated.View>
                      )}
                      <View style={styles.recordButtonContainer}>
                        {isRecording && (
                          <Animated.View style={[styles.recordRing, ring1Style]}>
                            <LinearGradient
                              colors={colors.gradients.recordButtonActive}
                              style={styles.recordRingGradient}
                            />
                          </Animated.View>
                        )}
                        {isRecording && (
                          <Animated.View style={[styles.recordGlow, glowStyle]}>
                            <LinearGradient
                              colors={['rgba(244, 63, 94, 0.4)', 'rgba(244, 63, 94, 0)']}
                              style={styles.recordGlowInner}
                            />
                          </Animated.View>
                        )}
                        <Pressable
                          onPress={handleVoiceRecord}
                          disabled={isTranscribing}
                          style={styles.recordButton}
                        >
                          <Animated.View style={pulseStyle}>
                            <LinearGradient
                              colors={
                                isRecording
                                  ? colors.gradients.recordButtonActive
                                  : colors.gradients.recordButton
                              }
                              style={styles.recordButtonGradient}
                            >
                              {isRecording ? (
                                <FontAwesome name="stop" size={28} color={colors.textPrimary} />
                              ) : (
                                <FontAwesome name="microphone" size={28} color={colors.textPrimary} />
                              )}
                            </LinearGradient>
                          </Animated.View>
                        </Pressable>
                      </View>
                      <Text style={styles.recordHint}>
                        {isRecording ? 'Tap to stop' : 'Tap to add more'}
                      </Text>
                    </>
                  )}
                </View>
              </GlassCard>
            </Animated.View>
          )}

          {/* Save Button */}
          <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.saveWrapper}>
            <Pressable
              onPress={handleSave}
              disabled={!input.trim() || isSaving || saved}
              style={styles.saveButton}
            >
              <LinearGradient
                colors={
                  input.trim() && !isSaving && !saved
                    ? colors.gradients.recordButton
                    : ['rgba(79, 209, 197, 0.2)', 'rgba(79, 209, 197, 0.1)']
                }
                style={styles.saveButtonGradient}
              >
                {isSaving ? (
                  <TypingIndicator />
                ) : saved ? (
                  <>
                    <FontAwesome name="check" size={18} color={colors.textPrimary} />
                    <Text style={styles.saveButtonText}>Saved!</Text>
                  </>
                ) : (
                  <>
                    <FontAwesome
                      name="save"
                      size={18}
                      color={input.trim() ? colors.textPrimary : colors.textTertiary}
                    />
                    <Text
                      style={[
                        styles.saveButtonText,
                        !input.trim() && styles.saveButtonTextDisabled,
                      ]}
                    >
                      Save Context
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </DreamyBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  headerWrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerCard: {
    borderRadius: 20,
  },
  headerInner: {
    padding: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerRight: {
    width: 40,
    alignItems: 'center',
  },
  headerBottom: {
    marginTop: 16,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  aiMessage: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBubble: {
    flex: 1,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
  },
  aiBubbleContent: {
    padding: 16,
  },
  aiText: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  inputSection: {
    marginTop: 8,
  },
  inputCard: {
    borderRadius: 20,
  },
  textInput: {
    fontSize: 16,
    color: colors.textPrimary,
    padding: 16,
    minHeight: 200,
    maxHeight: 400,
  },
  transcriptContainer: {
    padding: 16,
    minHeight: 100,
  },
  transcriptText: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  talkInputWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  talkInputCard: {
    borderRadius: 24,
  },
  talkInputContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  transcribingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 20,
  },
  transcribingText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  recordingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.negative,
    marginRight: 8,
  },
  recordingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.negative,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    gap: 3,
  },
  waveformBar: {
    width: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  waveformBarGradient: {
    flex: 1,
  },
  recordButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
  },
  recordRing: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
  },
  recordRingGradient: {
    flex: 1,
    opacity: 0.3,
  },
  recordGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
  },
  recordGlowInner: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  recordButton: {
    width: 70,
    height: 70,
  },
  recordButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    ...colors.shadows.glow,
  },
  recordHint: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 12,
  },
  saveWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  saveButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  saveButtonTextDisabled: {
    color: colors.textTertiary,
  },
  modeToggleWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  modeToggleBlur: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  modeToggleContainer: {
    flexDirection: 'row',
    padding: 4,
    position: 'relative',
  },
  modeIndicator: {
    position: 'absolute',
    width: 88,
    height: 40,
    borderRadius: 12,
    top: 4,
    left: 4,
    overflow: 'hidden',
  },
  modeIndicatorGradient: {
    flex: 1,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 88,
    height: 40,
    gap: 8,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  modeButtonTextActive: {
    color: colors.textPrimary,
  },
});
