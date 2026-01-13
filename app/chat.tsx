import {
  View,
  Text,
  TextInput,
  FlatList,
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
import { useChatStore } from '@/stores/chatStore';
import { useRecordingStore } from '@/stores/recordingStore';
import { transcribeAudio } from '@/lib/gemini';
import { deleteAudioFile } from '@/lib/audio';
import { speak, stop as stopSpeech, initializeSpeech } from '@/lib/speech';
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
  withSpring,
  withDelay,
  FadeIn,
  FadeInDown,
  FadeInUp,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import type { ChatMessage } from '@/types/dream';

type ChatMode = 'type' | 'talk';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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

// Waveform visualization component
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

function ChatBubble({
  message,
  onSpeak,
  index,
}: {
  message: ChatMessage;
  onSpeak: (text: string) => void;
  index: number;
}) {
  const isUser = message.role === 'user';
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleSpeakPress = () => {
    haptic.light();
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    onSpeak(message.content);
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(400).springify()}
      style={[styles.bubbleContainer, isUser ? styles.bubbleUser : styles.bubbleAssistant]}
    >
      {!isUser && (
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={colors.gradients.tealToPurple}
            style={styles.avatar}
          >
            <FontAwesome name="moon-o" size={14} color={colors.textPrimary} />
          </LinearGradient>
        </View>
      )}
      <View style={styles.bubbleContent}>
        {isUser ? (
          <LinearGradient
            colors={colors.gradients.recordButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.bubble, styles.bubbleUserInner]}
          >
            <Text style={styles.bubbleText}>{message.content}</Text>
          </LinearGradient>
        ) : (
          <GlassCard style={styles.bubbleAssistantCard} noPadding intensity="light" haptic={false}>
            <View style={styles.bubbleAssistantContent}>
              <Text style={styles.bubbleText}>{message.content}</Text>
            </View>
          </GlassCard>
        )}
        <View style={[styles.bubbleMeta, isUser && styles.bubbleMetaUser]}>
          <Text style={styles.bubbleTime}>
            {new Date(message.timestamp).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Text>
          {!isUser && (
            <AnimatedPressable
              onPress={handleSpeakPress}
              style={[styles.speakButton, animatedStyle]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome name="volume-up" size={12} color={colors.primary} />
            </AnimatedPressable>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

function ModeToggle({
  mode,
  onModeChange,
}: {
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}) {
  const indicatorPosition = useSharedValue(mode === 'type' ? 0 : 1);

  useEffect(() => {
    indicatorPosition.value = withSpring(mode === 'type' ? 0 : 1, {
      damping: 15,
      stiffness: 150,
    });
  }, [mode]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value * 88 }],
  }));

  const handleModeChange = (newMode: ChatMode) => {
    haptic.selection();
    onModeChange(newMode);
  };

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
          <Pressable onPress={() => handleModeChange('type')} style={styles.modeButton}>
            <FontAwesome
              name="keyboard-o"
              size={15}
              color={mode === 'type' ? colors.textPrimary : colors.textTertiary}
            />
            <Text style={[styles.modeButtonText, mode === 'type' && styles.modeButtonTextActive]}>
              Type
            </Text>
          </Pressable>
          <Pressable onPress={() => handleModeChange('talk')} style={styles.modeButton}>
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

export default function ChatScreen() {
  const router = useRouter();
  const { messages, dreamContext, isLoading, error, sendMessage, clearChat } = useChatStore();
  const { isRecording, start, stop, reset, duration, updateDuration } = useRecordingStore();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ChatMode>('talk');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMessageCountRef = useRef(0);

  // Animation for recording
  const recordScale = useSharedValue(1);
  const recordGlow = useSharedValue(0);
  const ringScale1 = useSharedValue(1);
  const ringScale2 = useSharedValue(1);
  const ringOpacity1 = useSharedValue(0);
  const ringOpacity2 = useSharedValue(0);

  useEffect(() => {
    if (isRecording) {
      // Pulsing record button
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
      // Expanding rings
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
      ringScale2.value = withDelay(
        500,
        withRepeat(
          withTiming(2, { duration: 1500, easing: Easing.out(Easing.ease) }),
          -1,
          false
        )
      );
      ringOpacity2.value = withDelay(
        500,
        withRepeat(
          withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }),
          -1,
          false
        )
      );

      intervalRef.current = setInterval(() => {
        updateDuration();
      }, 1000);
    } else {
      recordScale.value = withTiming(1);
      recordGlow.value = withTiming(0);
      ringScale1.value = 1;
      ringScale2.value = 1;
      ringOpacity1.value = 0;
      ringOpacity2.value = 0;
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

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale2.value }],
    opacity: interpolate(ringScale2.value, [1, 2], [0.4, 0]),
  }));

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }

    // Auto-speak new AI messages in talk mode
    if (autoSpeak && mode === 'talk' && messages.length > lastMessageCountRef.current) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        speakText(lastMessage.content);
      }
    }
    lastMessageCountRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    // Initialize speech with OpenAI TTS
    initializeSpeech();

    // Clean up on unmount
    return () => {
      clearChat();
      stopSpeech();
    };
  }, []);

  const speakText = async (text: string) => {
    try {
      setIsSpeaking(true);
      haptic.light();
      await speak(text, {
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (error) {
      console.error('Failed to speak:', error);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = async () => {
    haptic.light();
    await stopSpeech();
    setIsSpeaking(false);
  };

  const handleVoiceRecord = async () => {
    if (isRecording) {
      haptic.medium();
      // Stop recording, transcribe, and send
      try {
        const audioUri = await stop();
        if (audioUri) {
          setIsTranscribing(true);
          const transcription = await transcribeAudio(audioUri);
          await deleteAudioFile(audioUri);
          setIsTranscribing(false);

          // Automatically send the transcribed message
          if (transcription.trim()) {
            await sendMessage(transcription.trim());
          }
        }
        reset();
      } catch (error) {
        console.error('Voice input failed:', error);
        reset();
        setIsTranscribing(false);
      }
    } else {
      haptic.heavy();
      // Start recording
      try {
        await start();
      } catch (error) {
        console.error('Failed to start recording:', error);
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    haptic.light();
    const messageContent = input.trim();
    setInput('');
    await sendMessage(messageContent);
  };

  if (!dreamContext) {
    return (
      <DreamyBackground starCount={40} showOrbs={true}>
        <SafeAreaView style={styles.emptyContainer}>
          <Animated.View entering={FadeIn.duration(600)} style={styles.emptyContent}>
            <View style={styles.emptyIconContainer}>
              <LinearGradient
                colors={['rgba(79, 209, 197, 0.2)', 'rgba(167, 139, 250, 0.1)']}
                style={styles.emptyIconGradient}
              >
                <FontAwesome name="comments-o" size={48} color={colors.primary} />
              </LinearGradient>
            </View>
            <Text style={styles.emptyTitle}>No dream selected</Text>
            <Text style={styles.emptySubtitle}>
              Select a dream from your journal to explore its meaning
            </Text>
            <Pressable
              onPress={() => {
                haptic.light();
                router.back();
              }}
              style={styles.backButton}
            >
              <LinearGradient
                colors={colors.gradients.recordButton}
                style={styles.backButtonGradient}
              >
                <FontAwesome name="arrow-left" size={14} color={colors.textPrimary} />
                <Text style={styles.backButtonText}>Go Back</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      </DreamyBackground>
    );
  }

  const dreamCount = Array.isArray(dreamContext) ? dreamContext.length : 1;
  const contextLabel = dreamCount === 1 ? '1 dream' : `${dreamCount} dreams`;

  const suggestedPrompts = [
    "What patterns do you notice in this dream?",
    "What emotions stand out to you?",
    "Does anything here connect to my waking life?",
  ];

  return (
    <DreamyBackground starCount={25} showOrbs={false}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
          keyboardVerticalOffset={100}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.headerWrapper}>
            <GlassCard style={styles.headerCard} noPadding intensity="medium">
              <View style={styles.headerInner}>
                <View style={styles.headerTop}>
                  <View style={styles.headerLeft}>
                    <LinearGradient
                      colors={colors.gradients.tealToPurple}
                      style={styles.headerAvatar}
                    >
                      <FontAwesome name="moon-o" size={18} color={colors.textPrimary} />
                    </LinearGradient>
                    <View style={styles.headerInfo}>
                      <Text style={styles.headerTitle}>Dream Guide</Text>
                      <Text style={styles.headerSubtitle}>
                        Exploring {contextLabel}
                      </Text>
                    </View>
                  </View>
                  {isSpeaking && (
                    <Pressable onPress={stopSpeaking} style={styles.stopButton}>
                      <View style={styles.stopButtonInner}>
                        <FontAwesome name="stop" size={10} color={colors.textPrimary} />
                      </View>
                      <Waveform isActive={true} />
                    </Pressable>
                  )}
                </View>
                <View style={styles.headerBottom}>
                  <ModeToggle mode={mode} onModeChange={setMode} />
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <ChatBubble
                message={item}
                onSpeak={speakText}
                index={index}
              />
            )}
            contentContainerStyle={styles.messageList}
            ListEmptyComponent={
              <Animated.View entering={FadeIn.delay(200).duration(600)} style={styles.emptyChat}>
                <View style={styles.emptyChatIcon}>
                  <LinearGradient
                    colors={['rgba(79, 209, 197, 0.15)', 'rgba(167, 139, 250, 0.08)']}
                    style={styles.emptyChatIconGradient}
                  >
                    <FontAwesome name="comments-o" size={32} color={colors.primary} />
                  </LinearGradient>
                </View>
                <Text style={styles.emptyChatTitle}>
                  {mode === 'talk' ? 'Tap to talk' : 'Start a conversation'}
                </Text>
                <Text style={styles.emptyChatSubtitle}>
                  {mode === 'talk'
                    ? 'Hold the button below and speak your thoughts'
                    : 'Ask anything about your dream'}
                </Text>

                {/* Suggested prompts */}
                <View style={styles.suggestedContainer}>
                  {suggestedPrompts.map((prompt, i) => (
                    <Animated.View
                      key={i}
                      entering={FadeInUp.delay(300 + i * 100).duration(400)}
                    >
                      <Pressable
                        onPress={() => {
                          haptic.light();
                          if (mode === 'type') {
                            setInput(prompt);
                          } else {
                            sendMessage(prompt);
                          }
                        }}
                        style={styles.suggestedButton}
                      >
                        <GlassCard style={styles.suggestedCard} noPadding intensity="light" haptic={false}>
                          <View style={styles.suggestedInner}>
                            <Text style={styles.suggestedText}>{prompt}</Text>
                            <FontAwesome name="chevron-right" size={10} color={colors.primary} />
                          </View>
                        </GlassCard>
                      </Pressable>
                    </Animated.View>
                  ))}
                </View>
              </Animated.View>
            }
            ListFooterComponent={
              isLoading ? (
                <Animated.View entering={FadeIn.duration(200)} style={styles.typingContainer}>
                  <View style={styles.avatarContainer}>
                    <LinearGradient
                      colors={colors.gradients.tealToPurple}
                      style={styles.avatar}
                    >
                      <FontAwesome name="moon-o" size={14} color={colors.textPrimary} />
                    </LinearGradient>
                  </View>
                  <GlassCard style={styles.typingBubble} noPadding intensity="light" haptic={false}>
                    <View style={styles.typingInner}>
                      <TypingIndicator />
                    </View>
                  </GlassCard>
                </Animated.View>
              ) : null
            }
          />

          {/* Error */}
          {error && (
            <Animated.View entering={FadeIn.duration(200)} style={styles.errorContainer}>
              <GlassCard style={styles.errorCard} noPadding intensity="light" haptic={false}>
                <View style={styles.errorInner}>
                  <FontAwesome name="exclamation-circle" size={14} color={colors.negative} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              </GlassCard>
            </Animated.View>
          )}

          {/* Talk Mode Input */}
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
                        {/* Expanding rings */}
                        {isRecording && (
                          <>
                            <Animated.View style={[styles.recordRing, ring1Style]}>
                              <LinearGradient
                                colors={colors.gradients.recordButtonActive}
                                style={styles.recordRingGradient}
                              />
                            </Animated.View>
                            <Animated.View style={[styles.recordRing, ring2Style]}>
                              <LinearGradient
                                colors={colors.gradients.recordButtonActive}
                                style={styles.recordRingGradient}
                              />
                            </Animated.View>
                          </>
                        )}
                        {/* Glow effect */}
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
                          disabled={isLoading || isTranscribing}
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
                        {isRecording ? 'Tap to send' : 'Tap to speak'}
                      </Text>
                    </>
                  )}
                </View>
              </GlassCard>
            </Animated.View>
          )}

          {/* Type Mode Input */}
          {mode === 'type' && (
            <Animated.View entering={FadeInUp.duration(400)} style={styles.typeInputWrapper}>
              <GlassCard style={styles.typeInputCard} noPadding intensity="medium">
                <View style={styles.typeInputContainer}>
                  <TextInput
                    value={input}
                    onChangeText={setInput}
                    placeholder="Ask about your dream..."
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    maxLength={500}
                    style={styles.textInput}
                  />
                  <Pressable
                    onPress={handleSend}
                    disabled={!input.trim() || isLoading}
                    style={styles.sendButton}
                  >
                    <LinearGradient
                      colors={
                        input.trim() && !isLoading
                          ? colors.gradients.recordButton
                          : ['rgba(79, 209, 197, 0.2)', 'rgba(79, 209, 197, 0.1)']
                      }
                      style={styles.sendButtonGradient}
                    >
                      <FontAwesome
                        name="arrow-up"
                        size={18}
                        color={input.trim() && !isLoading ? colors.textPrimary : colors.textTertiary}
                      />
                    </LinearGradient>
                  </Pressable>
                </View>
              </GlassCard>
            </Animated.View>
          )}
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
  emptyContainer: {
    flex: 1,
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(79, 209, 197, 0.2)',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  backButton: {
    borderRadius: 16,
    overflow: 'hidden',
    ...colors.shadows.glow,
  },
  backButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 8,
  },
  stopButtonInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.negative,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBottom: {
    marginTop: 16,
    alignItems: 'center',
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
  messageList: {
    padding: 16,
    flexGrow: 1,
  },
  bubbleContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '85%',
  },
  bubbleUser: {
    alignSelf: 'flex-end',
  },
  bubbleAssistant: {
    alignSelf: 'flex-start',
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
  bubbleContent: {
    flex: 1,
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleUserInner: {
    borderBottomRightRadius: 4,
  },
  bubbleAssistantCard: {
    borderRadius: 20,
    borderBottomLeftRadius: 4,
  },
  bubbleAssistantContent: {
    padding: 16,
  },
  bubbleText: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 10,
  },
  bubbleMetaUser: {
    justifyContent: 'flex-end',
  },
  bubbleTime: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  speakButton: {
    padding: 6,
    backgroundColor: 'rgba(79, 209, 197, 0.15)',
    borderRadius: 12,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  typingBubble: {
    borderRadius: 20,
    borderBottomLeftRadius: 4,
  },
  typingInner: {
    padding: 16,
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyChatIcon: {
    marginBottom: 20,
  },
  emptyChatIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(79, 209, 197, 0.15)',
  },
  emptyChatTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyChatSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  suggestedContainer: {
    width: '100%',
    gap: 10,
  },
  suggestedButton: {
    width: '100%',
  },
  suggestedCard: {
    borderRadius: 14,
  },
  suggestedInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  suggestedText: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  errorContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  errorCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  errorInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  errorText: {
    fontSize: 13,
    color: colors.negative,
    flex: 1,
  },
  talkInputWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  talkInputCard: {
    borderRadius: 24,
  },
  talkInputContainer: {
    paddingVertical: 24,
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
    marginBottom: 20,
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
    width: 120,
    height: 120,
  },
  recordRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  recordRingGradient: {
    flex: 1,
    opacity: 0.3,
  },
  recordGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
  },
  recordGlowInner: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  recordButton: {
    width: 80,
    height: 80,
  },
  recordButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...colors.shadows.glow,
  },
  recordHint: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 16,
  },
  typeInputWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  typeInputCard: {
    borderRadius: 24,
  },
  typeInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    paddingLeft: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    maxHeight: 120,
    minHeight: 44,
    paddingVertical: 12,
  },
  sendButton: {
    marginLeft: 8,
    marginBottom: 4,
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
