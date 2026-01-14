import { View, Text, ScrollView, Pressable, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useDreamsStore } from '@/stores/dreamsStore';
import { useChatStore } from '@/stores/chatStore';
import { useUserContextStore } from '@/stores/userContextStore';
import { colors } from '@/constants/colors';
import { DreamyBackground, GlassCard } from '@/components/ui';
import { haptic } from '@/lib/haptics';
import { speak, stop, getIsSpeaking } from '@/lib/speech';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useState } from 'react';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { generateDeepAnalysis } from '@/lib/deepAnalysis';
import type { DeepAnalysis } from '@/types/dream';

function Section({
  title,
  icon,
  children,
  defaultExpanded = true,
  delay = 0,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  delay?: number;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    haptic.selection();
    setExpanded(!expanded);
  };

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400).springify()}>
      <GlassCard style={styles.section} noPadding intensity="light">
        <Pressable onPress={handleToggle} style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <LinearGradient
              colors={colors.gradients.tealToPurple}
              style={styles.sectionIcon}
            >
              <FontAwesome name={icon as any} size={14} color={colors.textPrimary} />
            </LinearGradient>
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
          <View style={styles.expandIcon}>
            <FontAwesome
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={12}
              color={colors.textTertiary}
            />
          </View>
        </Pressable>
        {expanded && <View style={styles.sectionContent}>{children}</View>}
      </GlassCard>
    </Animated.View>
  );
}

function Badge({ text, variant = 'default' }: { text: string; variant?: 'default' | 'primary' | 'positive' | 'negative' }) {
  const variantStyles = {
    default: styles.badgeDefault,
    primary: styles.badgePrimary,
    positive: styles.badgePositive,
    negative: styles.badgeNegative,
  };

  const textStyles = {
    default: styles.badgeTextDefault,
    primary: styles.badgeTextPrimary,
    positive: styles.badgeTextPositive,
    negative: styles.badgeTextNegative,
  };

  return (
    <View style={[styles.badge, variantStyles[variant]]}>
      <Text style={[styles.badgeText, textStyles[variant]]}>{text}</Text>
    </View>
  );
}

function IntensityBar({ intensity }: { intensity: number }) {
  const normalizedIntensity = Math.ceil(intensity / 2); // Convert 1-10 to 1-5

  return (
    <View style={styles.intensityContainer}>
      {[1, 2, 3, 4, 5].map((i) => (
        <LinearGradient
          key={i}
          colors={i <= normalizedIntensity ? colors.gradients.tealToPurple : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.1)']}
          style={styles.intensityDot}
        />
      ))}
    </View>
  );
}

// Archetype display configuration
const ARCHETYPE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  shadow: { icon: 'user-secret', color: '#8B5CF6', label: 'Shadow' },
  anima_animus: { icon: 'heart', color: '#EC4899', label: 'Anima/Animus' },
  self: { icon: 'sun-o', color: '#F59E0B', label: 'Self' },
  persona: { icon: 'mask', color: '#64748B', label: 'Persona' },
  hero: { icon: 'shield', color: '#14B8A6', label: 'Hero' },
};

function DeepAnalysisSection({ deepAnalysis, delay }: { deepAnalysis: DeepAnalysis; delay: number }) {
  const [synthesisExpanded, setSynthesisExpanded] = useState(true);
  const [amplificationsExpanded, setAmplificationsExpanded] = useState(false);
  const [questionsExpanded, setQuestionsExpanded] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const archetype = deepAnalysis.primary_archetype;
  const config = ARCHETYPE_CONFIG[archetype.type] || ARCHETYPE_CONFIG.shadow;

  // Compose analysis text for TTS
  const composeAnalysisText = () => {
    const parts: string[] = [];

    // Primary archetype
    parts.push(`The primary archetype in this dream is the ${config.label}, with ${Math.round(archetype.confidence * 100)} percent confidence.`);
    parts.push(archetype.psychological_meaning);

    // Synthesis
    if (deepAnalysis.synthesis) {
      parts.push(`Here's the interpretation: ${deepAnalysis.synthesis}`);
    }

    // Compensatory dynamic
    if (deepAnalysis.compensatory_dynamic) {
      parts.push(`Regarding the compensatory dynamic: ${deepAnalysis.compensatory_dynamic}`);
    }

    // Questions for reflection
    if (deepAnalysis.questions_for_reflection && deepAnalysis.questions_for_reflection.length > 0) {
      parts.push('Here are some questions to reflect on:');
      deepAnalysis.questions_for_reflection.forEach((q, i) => {
        parts.push(`${i + 1}. ${q}`);
      });
    }

    return parts.join(' ');
  };

  const handleListen = async () => {
    haptic.medium();

    if (isPlaying) {
      await stop();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    const text = composeAnalysisText();

    await speak(text, {
      onDone: () => setIsPlaying(false),
      onError: () => {
        setIsPlaying(false);
        Alert.alert('Error', 'Failed to play audio. Please try again.');
      },
    });
  };

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400).springify()}>
      <GlassCard style={styles.deepAnalysisCard} glowColor={config.color} intensity="medium">
        {/* Header with premium styling */}
        <View style={styles.deepAnalysisHeader}>
          <LinearGradient
            colors={[config.color, `${config.color}99`]}
            style={styles.deepAnalysisIcon}
          >
            <FontAwesome name="star" size={16} color="#fff" />
          </LinearGradient>
          <View style={styles.deepAnalysisHeaderText}>
            <Text style={styles.deepAnalysisTitle}>Deep Jungian Analysis</Text>
            <Text style={styles.deepAnalysisSubtitle}>Powered by Gemini Pro</Text>
          </View>
          {/* Listen Button */}
          <Pressable onPress={handleListen} style={styles.listenButton}>
            <LinearGradient
              colors={isPlaying ? ['#EF4444', '#DC2626'] : colors.gradients.tealToPurple}
              style={styles.listenButtonGradient}
            >
              <FontAwesome
                name={isPlaying ? 'stop' : 'volume-up'}
                size={14}
                color="#fff"
              />
            </LinearGradient>
          </Pressable>
        </View>

        {/* Primary Archetype */}
        <View style={styles.archetypeSection}>
          <View style={[styles.archetypeBadge, { backgroundColor: `${config.color}20`, borderColor: `${config.color}40` }]}>
            <FontAwesome name={config.icon as any} size={14} color={config.color} />
            <Text style={[styles.archetypeLabel, { color: config.color }]}>{config.label}</Text>
            <View style={[styles.confidenceBadge, { backgroundColor: `${config.color}30` }]}>
              <Text style={[styles.confidenceText, { color: config.color }]}>
                {Math.round(archetype.confidence * 100)}%
              </Text>
            </View>
          </View>
          <Text style={styles.archetypeMeaning}>{archetype.psychological_meaning}</Text>
          {archetype.evidence.length > 0 && (
            <View style={styles.evidenceContainer}>
              {archetype.evidence.map((e, i) => (
                <Text key={i} style={styles.evidenceItem}>• {e}</Text>
              ))}
            </View>
          )}
        </View>

        {/* Synthesis (collapsible) */}
        <Pressable
          onPress={() => { haptic.selection(); setSynthesisExpanded(!synthesisExpanded); }}
          style={styles.collapsibleHeader}
        >
          <Text style={styles.collapsibleTitle}>Interpretation</Text>
          <FontAwesome
            name={synthesisExpanded ? 'chevron-up' : 'chevron-down'}
            size={12}
            color={colors.textTertiary}
          />
        </Pressable>
        {synthesisExpanded && (
          <Text style={styles.synthesisText}>{deepAnalysis.synthesis}</Text>
        )}

        {/* Compensatory Dynamic */}
        {deepAnalysis.compensatory_dynamic && (
          <View style={styles.compensatorySection}>
            <View style={styles.compensatoryHeader}>
              <FontAwesome name="balance-scale" size={12} color={colors.primary} />
              <Text style={styles.compensatoryTitle}>Compensatory Dynamic</Text>
            </View>
            <Text style={styles.compensatoryText}>{deepAnalysis.compensatory_dynamic}</Text>
          </View>
        )}

        {/* Amplifications (collapsible) */}
        {deepAnalysis.amplifications && deepAnalysis.amplifications.length > 0 && (
          <>
            <Pressable
              onPress={() => { haptic.selection(); setAmplificationsExpanded(!amplificationsExpanded); }}
              style={styles.collapsibleHeader}
            >
              <Text style={styles.collapsibleTitle}>Symbol Amplifications</Text>
              <FontAwesome
                name={amplificationsExpanded ? 'chevron-up' : 'chevron-down'}
                size={12}
                color={colors.textTertiary}
              />
            </Pressable>
            {amplificationsExpanded && (
              <View style={styles.amplificationsContainer}>
                {deepAnalysis.amplifications.map((amp, i) => (
                  <View key={i} style={styles.amplificationItem}>
                    <Text style={styles.amplificationSymbol}>{amp.symbol}</Text>
                    <Text style={styles.amplificationMythological}>{amp.mythological}</Text>
                    {amp.personal_connection && (
                      <Text style={styles.amplificationPersonal}>
                        <Text style={styles.amplificationPersonalLabel}>Personal: </Text>
                        {amp.personal_connection}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Questions for Reflection (collapsible) */}
        {deepAnalysis.questions_for_reflection && deepAnalysis.questions_for_reflection.length > 0 && (
          <>
            <Pressable
              onPress={() => { haptic.selection(); setQuestionsExpanded(!questionsExpanded); }}
              style={styles.collapsibleHeader}
            >
              <Text style={styles.collapsibleTitle}>Questions for Reflection</Text>
              <FontAwesome
                name={questionsExpanded ? 'chevron-up' : 'chevron-down'}
                size={12}
                color={colors.textTertiary}
              />
            </Pressable>
            {questionsExpanded && (
              <View style={styles.questionsContainer}>
                {deepAnalysis.questions_for_reflection.map((q, i) => (
                  <View key={i} style={styles.questionItem}>
                    <LinearGradient
                      colors={colors.gradients.tealToPurple}
                      style={styles.questionNumber}
                    >
                      <Text style={styles.questionNumberText}>{i + 1}</Text>
                    </LinearGradient>
                    <Text style={styles.questionText}>{q}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </GlassCard>
    </Animated.View>
  );
}


export default function DreamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { dreams, deleteDream, updateDreamDeepAnalysis } = useDreamsStore();
  const { setDreamContext } = useChatStore();
  const { userContext } = useUserContextStore();
  const [deepAnalysis, setDeepAnalysis] = useState<DeepAnalysis | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const dream = dreams.find((d) => d.id === id);

  // Sync deep analysis from dream if available
  if (dream?.deep_analysis && !deepAnalysis) {
    setDeepAnalysis(dream.deep_analysis);
  }

  const handleGenerateDeepAnalysis = async () => {
    if (!dream || isGenerating) return;

    haptic.medium();
    setIsGenerating(true);

    try {
      const result = await generateDeepAnalysis(
        dream.id,
        dream.cleaned_narrative,
        dream.symbols,
        dream.themes,
        dream.figures,
        dream.emotions,
        userContext
      );

      if (result) {
        setDeepAnalysis(result);
        updateDreamDeepAnalysis(dream.id, result);
        haptic.success();
      } else {
        haptic.error();
        Alert.alert('Error', 'Failed to generate deep analysis. Please try again.');
      }
    } catch (error) {
      haptic.error();
      Alert.alert('Error', 'Failed to generate deep analysis. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!dream) {
    return (
      <DreamyBackground starCount={40} showOrbs={true}>
        <SafeAreaView style={styles.notFoundContainer}>
          <Animated.View entering={FadeIn.duration(600)} style={styles.notFoundContent}>
            <View style={styles.notFoundIconContainer}>
              <LinearGradient
                colors={['rgba(79, 209, 197, 0.2)', 'rgba(167, 139, 250, 0.1)']}
                style={styles.notFoundIconGradient}
              >
                <FontAwesome name="moon-o" size={48} color={colors.primary} />
              </LinearGradient>
            </View>
            <Text style={styles.notFoundTitle}>Dream not found</Text>
            <Text style={styles.notFoundSubtitle}>
              This dream may have been deleted or doesn't exist
            </Text>
            <Pressable
              onPress={() => {
                haptic.light();
                router.back();
              }}
              style={styles.backButton}
            >
              <LinearGradient colors={colors.gradients.recordButton} style={styles.backButtonGradient}>
                <FontAwesome name="arrow-left" size={14} color={colors.textPrimary} />
                <Text style={styles.backButtonText}>Go Back</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      </DreamyBackground>
    );
  }

  const date = new Date(dream.recorded_at);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const handleChat = () => {
    haptic.medium();
    setDreamContext(dream);
    router.push('/chat');
  };

  const handleDelete = () => {
    haptic.warning();
    Alert.alert('Delete Dream', 'Are you sure you want to delete this dream? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          haptic.error();
          await deleteDream(dream.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <DreamyBackground starCount={25} showOrbs={false}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400).springify()}>
          <GlassCard style={styles.headerCard} intensity="medium">
            <View style={styles.headerContent}>
              <View style={styles.headerDateRow}>
                <View style={styles.moonIconContainer}>
                  <FontAwesome name="moon-o" size={18} color={colors.primary} />
                </View>
                <View style={styles.headerDateInfo}>
                  <Text style={styles.headerDate}>{formattedDate}</Text>
                  <View style={styles.headerTimeContainer}>
                    <FontAwesome name="clock-o" size={11} color={colors.textTertiary} />
                    <Text style={styles.headerTime}>{formattedTime}</Text>
                    {dream.duration_seconds && (
                      <>
                        <View style={styles.headerDivider} />
                        <FontAwesome name="microphone" size={11} color={colors.textTertiary} />
                        <Text style={styles.headerTime}>
                          {Math.floor(dream.duration_seconds / 60)}:
                          {(dream.duration_seconds % 60).toString().padStart(2, '0')}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Overall tone */}
        <Animated.View entering={FadeInDown.delay(100).duration(400).springify()}>
          <GlassCard style={styles.toneCard} glowColor={colors.primary} intensity="light">
            <View style={styles.toneHeader}>
              <LinearGradient colors={colors.gradients.emotionMedium} style={styles.toneIconContainer}>
                <FontAwesome name="heart" size={14} color={colors.textPrimary} />
              </LinearGradient>
              <Text style={styles.toneLabel}>Emotional Tone</Text>
            </View>
            <Text style={styles.toneValue}>{dream.overall_emotional_tone}</Text>
          </GlassCard>
        </Animated.View>

        {/* Narrative */}
        <Section title="Dream Narrative" icon="book" defaultExpanded={true} delay={200}>
          <Text style={styles.narrativeText}>{dream.cleaned_narrative}</Text>
        </Section>

        {/* Themes */}
        {dream.themes.length > 0 && (
          <Section title="Themes" icon="tags" defaultExpanded={true} delay={300}>
            <View style={styles.badgeContainer}>
              {dream.themes.map((theme, i) => (
                <Badge key={i} text={theme} variant="primary" />
              ))}
            </View>
          </Section>
        )}

        {/* Emotions */}
        {dream.emotions.length > 0 && (
          <Section title="Emotions" icon="smile-o" defaultExpanded={true} delay={400}>
            {dream.emotions.map((emotion, i) => (
              <View
                key={i}
                style={[
                  styles.emotionItem,
                  i < dream.emotions.length - 1 && styles.emotionItemBorder,
                ]}
              >
                <View style={styles.emotionInfo}>
                  <Text style={styles.emotionName}>{emotion.emotion}</Text>
                  <Text style={styles.emotionMoment}>{emotion.moment}</Text>
                </View>
                <IntensityBar intensity={emotion.intensity} />
              </View>
            ))}
          </Section>
        )}

        {/* Figures */}
        {dream.figures.length > 0 && (
          <Section title="Figures" icon="users" defaultExpanded={false} delay={500}>
            {dream.figures.map((figure, i) => (
              <View
                key={i}
                style={[
                  styles.figureItem,
                  i < dream.figures.length - 1 && styles.figureItemBorder,
                ]}
              >
                <Text style={styles.figureName}>{figure.description}</Text>
                <View style={styles.badgeContainer}>
                  <Badge text={figure.gender} />
                  <Badge
                    text={figure.emotional_valence}
                    variant={
                      figure.emotional_valence === 'positive'
                        ? 'positive'
                        : figure.emotional_valence === 'negative'
                        ? 'negative'
                        : 'default'
                    }
                  />
                  {figure.archetype_hint && (
                    <Badge text={figure.archetype_hint} variant="primary" />
                  )}
                </View>
                {figure.relationship && (
                  <Text style={styles.figureRelationship}>
                    Resembles: {figure.relationship}
                  </Text>
                )}
              </View>
            ))}
          </Section>
        )}

        {/* Locations */}
        {dream.locations.length > 0 && (
          <Section title="Locations" icon="map-marker" defaultExpanded={false} delay={600}>
            {dream.locations.map((location, i) => (
              <View
                key={i}
                style={[
                  styles.locationItem,
                  i < dream.locations.length - 1 && styles.locationItemBorder,
                ]}
              >
                <Text style={styles.locationName}>{location.description}</Text>
                <View style={styles.badgeContainer}>
                  <Badge text={location.familiarity} />
                  <Badge text={location.atmosphere} />
                </View>
              </View>
            ))}
          </Section>
        )}

        {/* Symbols */}
        {dream.symbols.length > 0 && (
          <Section title="Symbols" icon="key" defaultExpanded={false} delay={700}>
            {dream.symbols.map((symbol, i) => (
              <View
                key={i}
                style={[
                  styles.symbolItem,
                  i < dream.symbols.length - 1 && styles.symbolItemBorder,
                ]}
              >
                <Text style={styles.symbolName}>{symbol.symbol}</Text>
                <Text style={styles.symbolContext}>{symbol.context}</Text>
                {symbol.possible_meanings.length > 0 && (
                  <View style={styles.badgeContainer}>
                    {symbol.possible_meanings.map((meaning, j) => (
                      <Badge key={j} text={meaning} />
                    ))}
                  </View>
                )}
              </View>
            ))}
          </Section>
        )}

        {/* Deep Jungian Analysis - On-Demand Feature */}
        {deepAnalysis ? (
          <DeepAnalysisSection deepAnalysis={deepAnalysis} delay={750} />
        ) : (
          <Animated.View entering={FadeInDown.delay(750).duration(400).springify()}>
            <Pressable
              onPress={handleGenerateDeepAnalysis}
              disabled={isGenerating}
              style={styles.generateDeepAnalysisButton}
            >
              <GlassCard style={styles.generateDeepAnalysisCard} intensity="light">
                {isGenerating ? (
                  <View style={styles.generatingContent}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <View style={styles.generatingTextContainer}>
                      <Text style={styles.generatingTitle}>Generating Deep Analysis...</Text>
                      <Text style={styles.generatingSubtitle}>
                        AI is performing psychological analysis
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.generateContent}>
                    <LinearGradient
                      colors={['#F59E0B', '#D97706']}
                      style={styles.generateIcon}
                    >
                      <FontAwesome name="star" size={16} color="#fff" />
                    </LinearGradient>
                    <View style={styles.generateTextContainer}>
                      <Text style={styles.generateTitle}>Generate Deep Analysis</Text>
                      <Text style={styles.generateSubtitle}>
                        Unlock Jungian psychological insights
                      </Text>
                    </View>
                    <FontAwesome name="chevron-right" size={14} color={colors.textTertiary} />
                  </View>
                )}
              </GlassCard>
            </Pressable>
          </Animated.View>
        )}

        {/* Raw transcript */}
        <Section title="Original Recording" icon="file-text-o" defaultExpanded={false} delay={800}>
          <Text style={styles.transcriptText}>{dream.raw_transcript}</Text>
        </Section>

        {/* Actions */}
        <Animated.View
          entering={FadeInUp.delay(900).duration(400).springify()}
          style={styles.actionsContainer}
        >
          <Pressable onPress={handleChat} style={styles.chatAction}>
            <LinearGradient
              colors={colors.gradients.recordButton}
              style={styles.chatActionGradient}
            >
              <FontAwesome name="comments-o" size={20} color={colors.textPrimary} />
              <Text style={styles.chatActionText}>Explore This Dream</Text>
            </LinearGradient>
          </Pressable>

          <Pressable onPress={handleDelete} style={styles.deleteAction}>
            <FontAwesome name="trash-o" size={16} color={colors.negative} />
            <Text style={styles.deleteActionText}>Delete Dream</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </DreamyBackground>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  notFoundContainer: {
    flex: 1,
  },
  notFoundContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  notFoundIconContainer: {
    marginBottom: 24,
  },
  notFoundIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(79, 209, 197, 0.2)',
  },
  notFoundTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  notFoundSubtitle: {
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
  headerCard: {
    marginBottom: 16,
  },
  headerContent: {
    gap: 4,
  },
  headerDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  moonIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDateInfo: {
    flex: 1,
  },
  headerDate: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  headerTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTime: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  headerDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textTertiary,
    marginHorizontal: 4,
  },
  toneCard: {
    marginBottom: 16,
  },
  toneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  toneIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toneLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toneValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  expandIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
  narrativeText: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 26,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeDefault: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  badgePrimary: {
    backgroundColor: 'rgba(79, 209, 197, 0.12)',
    borderColor: 'rgba(79, 209, 197, 0.25)',
  },
  badgePositive: {
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    borderColor: 'rgba(74, 222, 128, 0.25)',
  },
  badgeNegative: {
    backgroundColor: 'rgba(251, 113, 133, 0.12)',
    borderColor: 'rgba(251, 113, 133, 0.25)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  badgeTextDefault: {
    color: colors.textSecondary,
  },
  badgeTextPrimary: {
    color: colors.primary,
  },
  badgeTextPositive: {
    color: colors.positive,
  },
  badgeTextNegative: {
    color: colors.negative,
  },
  emotionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  emotionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  emotionInfo: {
    flex: 1,
    marginRight: 16,
  },
  emotionName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  emotionMoment: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  intensityContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  intensityDot: {
    width: 18,
    height: 6,
    borderRadius: 3,
  },
  figureItem: {
    paddingVertical: 14,
  },
  figureItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  figureName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  figureRelationship: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 10,
    fontStyle: 'italic',
  },
  locationItem: {
    paddingVertical: 14,
  },
  locationItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  locationName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  symbolItem: {
    paddingVertical: 14,
  },
  symbolItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  symbolName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  symbolContext: {
    fontSize: 13,
    color: colors.textTertiary,
    marginBottom: 10,
  },
  transcriptText: {
    fontSize: 14,
    color: colors.textTertiary,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  actionsContainer: {
    marginTop: 8,
    gap: 12,
  },
  chatAction: {
    borderRadius: 20,
    overflow: 'hidden',
    ...colors.shadows.glow,
  },
  chatActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  chatActionText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  deleteAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: 'rgba(251, 113, 133, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 113, 133, 0.2)',
    gap: 10,
  },
  deleteActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.negative,
  },
  // Deep Analysis styles
  deepAnalysisCard: {
    marginBottom: 16,
    padding: 20,
  },
  deepAnalysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  deepAnalysisIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deepAnalysisHeaderText: {
    flex: 1,
  },
  listenButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  listenButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deepAnalysisTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  deepAnalysisSubtitle: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  archetypeSection: {
    marginBottom: 20,
  },
  archetypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
  },
  archetypeLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  archetypeMeaning: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 12,
  },
  evidenceContainer: {
    gap: 6,
  },
  evidenceItem: {
    fontSize: 13,
    color: colors.textTertiary,
    lineHeight: 20,
    paddingLeft: 4,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  collapsibleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  synthesisText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 26,
    marginBottom: 16,
  },
  compensatorySection: {
    backgroundColor: 'rgba(79, 209, 197, 0.08)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  compensatoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  compensatoryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  compensatoryText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  amplificationsContainer: {
    gap: 16,
    marginBottom: 16,
  },
  amplificationItem: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    paddingLeft: 14,
  },
  amplificationSymbol: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  amplificationMythological: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 6,
  },
  amplificationPersonal: {
    fontSize: 13,
    color: colors.textTertiary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  amplificationPersonalLabel: {
    fontWeight: '600',
    fontStyle: 'normal',
    color: colors.textSecondary,
  },
  questionsContainer: {
    gap: 14,
    marginBottom: 8,
  },
  questionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  questionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  // Generate Deep Analysis Button
  generateDeepAnalysisButton: {
    marginBottom: 16,
  },
  generateDeepAnalysisCard: {
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  generateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  generateIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateTextContainer: {
    flex: 1,
  },
  generateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  generateSubtitle: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  generatingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  generatingTextContainer: {
    flex: 1,
  },
  generatingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  generatingSubtitle: {
    fontSize: 13,
    color: colors.textTertiary,
  },
});
