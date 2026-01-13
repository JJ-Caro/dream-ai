import { View, Text, ScrollView, Pressable, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useDreamsStore } from '@/stores/dreamsStore';
import { useChatStore } from '@/stores/chatStore';
import { colors } from '@/constants/colors';
import { DreamyBackground, GlassCard } from '@/components/ui';
import { haptic } from '@/lib/haptics';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useState } from 'react';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

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

export default function DreamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { dreams, deleteDream } = useDreamsStore();
  const { setDreamContext } = useChatStore();

  const dream = dreams.find((d) => d.id === id);

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
});
