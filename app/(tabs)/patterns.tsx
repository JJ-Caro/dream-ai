import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useDreamsStore } from '@/stores/dreamsStore';
import { useChatStore } from '@/stores/chatStore';
import { colors } from '@/constants/colors';
import { DreamyBackground, GlassCard } from '@/components/ui';
import { haptic } from '@/lib/haptics';

interface PatternData {
  label: string;
  count: number;
  percentage: number;
}

function PatternBar({ data, gradientColors, index }: { data: PatternData; gradientColors: string[]; index: number }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(300)}
      style={styles.patternBarContainer}
    >
      <View style={styles.patternBarHeader}>
        <Text style={styles.patternBarLabel}>{data.label}</Text>
        <Text style={styles.patternBarCount}>{data.count}</Text>
      </View>
      <View style={styles.patternBarTrack}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.patternBarFill, { width: `${Math.max(data.percentage, 5)}%` }]}
        />
      </View>
    </Animated.View>
  );
}

function PatternCard({
  title,
  icon,
  children,
  delay = 0,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400).springify()}>
      <GlassCard style={styles.patternCard} intensity="light">
        <View style={styles.patternCardHeader}>
          <LinearGradient colors={colors.gradients.tealToPurple} style={styles.patternCardIcon}>
            <FontAwesome name={icon as any} size={14} color={colors.textPrimary} />
          </LinearGradient>
          <Text style={styles.patternCardTitle}>{title}</Text>
        </View>
        <View style={styles.patternCardContent}>{children}</View>
      </GlassCard>
    </Animated.View>
  );
}

function StatCard({ value, label, gradientColors, delay }: { value: string | number; label: string; gradientColors: string[]; delay: number }) {
  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(400).springify()} style={styles.statCardWrapper}>
      <GlassCard style={styles.statCard} intensity="light">
        <LinearGradient colors={gradientColors} style={styles.statGradient}>
          <Text style={styles.statValue}>{value}</Text>
        </LinearGradient>
        <Text style={styles.statLabel}>{label}</Text>
      </GlassCard>
    </Animated.View>
  );
}

export default function PatternsScreen() {
  const router = useRouter();
  const { dreams } = useDreamsStore();
  const { setDreamContext } = useChatStore();

  const minDreamsForPatterns = 5;
  const hasEnoughDreams = dreams.length >= minDreamsForPatterns;

  // Calculate patterns
  const patterns = useMemo(() => {
    if (!hasEnoughDreams) return null;

    // Theme frequency
    const themeCounts: Record<string, number> = {};
    dreams.forEach(dream => {
      dream.themes.forEach(theme => {
        themeCounts[theme] = (themeCounts[theme] || 0) + 1;
      });
    });

    const topThemes: PatternData[] = Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count]) => ({
        label,
        count,
        percentage: (count / dreams.length) * 100,
      }));

    // Emotion frequency
    const emotionCounts: Record<string, number> = {};
    let totalEmotionIntensity = 0;
    let emotionCount = 0;

    dreams.forEach(dream => {
      dream.emotions.forEach(emotion => {
        emotionCounts[emotion.emotion] = (emotionCounts[emotion.emotion] || 0) + 1;
        totalEmotionIntensity += emotion.intensity;
        emotionCount++;
      });
    });

    const topEmotions: PatternData[] = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count]) => ({
        label,
        count,
        percentage: (count / dreams.length) * 100,
      }));

    const avgEmotionIntensity = emotionCount > 0
      ? (totalEmotionIntensity / emotionCount).toFixed(1)
      : '0';

    // Figure types
    const figureCounts: Record<string, number> = {};
    dreams.forEach(dream => {
      dream.figures.forEach(figure => {
        const type = figure.archetype_hint || figure.gender;
        figureCounts[type] = (figureCounts[type] || 0) + 1;
      });
    });

    const topFigures: PatternData[] = Object.entries(figureCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count]) => ({
        label,
        count,
        percentage: (count / dreams.length) * 100,
      }));

    // Location familiarity
    let familiarCount = 0;
    let unfamiliarCount = 0;
    let mixedCount = 0;

    dreams.forEach(dream => {
      dream.locations.forEach(location => {
        if (location.familiarity === 'familiar') familiarCount++;
        else if (location.familiarity === 'unfamiliar') unfamiliarCount++;
        else mixedCount++;
      });
    });

    const totalLocations = familiarCount + unfamiliarCount + mixedCount;
    const locationPatterns = totalLocations > 0
      ? [
          { label: 'Familiar places', count: familiarCount, percentage: (familiarCount / totalLocations) * 100 },
          { label: 'Unfamiliar places', count: unfamiliarCount, percentage: (unfamiliarCount / totalLocations) * 100 },
          { label: 'Mixed/Distorted', count: mixedCount, percentage: (mixedCount / totalLocations) * 100 },
        ].filter(p => p.count > 0)
      : [];

    return {
      topThemes,
      topEmotions,
      topFigures,
      locationPatterns,
      avgEmotionIntensity,
      totalDreams: dreams.length,
    };
  }, [dreams, hasEnoughDreams]);

  const handleChatAboutPatterns = () => {
    haptic.medium();
    setDreamContext(dreams);
    router.push('/chat');
  };

  if (!hasEnoughDreams) {
    const progress = (dreams.length / minDreamsForPatterns) * 100;
    const remaining = minDreamsForPatterns - dreams.length;

    return (
      <DreamyBackground starCount={40} showOrbs={true}>
        <SafeAreaView style={styles.container} edges={['top']}>
          <Animated.View entering={FadeIn.duration(600)} style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <LinearGradient
                colors={['rgba(79, 209, 197, 0.2)', 'rgba(167, 139, 250, 0.1)']}
                style={styles.emptyIconGradient}
              >
                <FontAwesome name="line-chart" size={48} color={colors.primary} />
              </LinearGradient>
            </View>
            <Text style={styles.emptyTitle}>Patterns Emerging</Text>
            <Text style={styles.emptySubtitle}>
              Record {remaining} more dream{remaining !== 1 ? 's' : ''} to unlock your personal dream insights.
            </Text>

            {/* Progress bar */}
            <GlassCard style={styles.progressCard} intensity="light">
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progress</Text>
                <Text style={styles.progressCount}>{dreams.length} / {minDreamsForPatterns}</Text>
              </View>
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={colors.gradients.tealToPurple}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${progress}%` }]}
                />
              </View>
              <Text style={styles.progressHint}>
                Each dream reveals more about your subconscious patterns
              </Text>
            </GlassCard>

            <Pressable
              onPress={() => {
                haptic.medium();
                router.push('/');
              }}
              style={styles.recordButton}
            >
              <LinearGradient colors={colors.gradients.recordButton} style={styles.recordButtonGradient}>
                <FontAwesome name="microphone" size={18} color={colors.textPrimary} />
                <Text style={styles.recordButtonText}>Record a Dream</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      </DreamyBackground>
    );
  }

  return (
    <DreamyBackground starCount={25} showOrbs={false}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(400)}>
            <GlassCard style={styles.headerCard} intensity="medium">
              <View style={styles.headerContent}>
                <View style={styles.headerTitleRow}>
                  <Text style={styles.headerTitle}>Dream Insights</Text>
                  <LinearGradient colors={colors.gradients.tealToPurple} style={styles.headerBadge}>
                    <FontAwesome name="magic" size={12} color={colors.textPrimary} />
                  </LinearGradient>
                </View>
                <Text style={styles.headerSubtitle}>
                  Patterns discovered from {patterns?.totalDreams} dreams
                </Text>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <StatCard
              value={patterns?.totalDreams || 0}
              label="Dreams"
              gradientColors={colors.gradients.recordButton}
              delay={100}
            />
            <StatCard
              value={patterns?.avgEmotionIntensity || '0'}
              label="Avg Intensity"
              gradientColors={colors.gradients.emotionMedium}
              delay={200}
            />
          </View>

          {/* Top Themes */}
          {patterns?.topThemes && patterns.topThemes.length > 0 && (
            <PatternCard title="Recurring Themes" icon="tags" delay={300}>
              {patterns.topThemes.map((theme, i) => (
                <PatternBar
                  key={theme.label}
                  data={theme}
                  gradientColors={i === 0 ? colors.gradients.tealToPurple : colors.gradients.primary}
                  index={i}
                />
              ))}
            </PatternCard>
          )}

          {/* Top Emotions */}
          {patterns?.topEmotions && patterns.topEmotions.length > 0 && (
            <PatternCard title="Emotional Patterns" icon="heart" delay={400}>
              {patterns.topEmotions.map((emotion, i) => (
                <PatternBar
                  key={emotion.label}
                  data={emotion}
                  gradientColors={i === 0 ? colors.gradients.emotionMedium : colors.gradients.emotionLow}
                  index={i}
                />
              ))}
            </PatternCard>
          )}

          {/* Figure Types */}
          {patterns?.topFigures && patterns.topFigures.length > 0 && (
            <PatternCard title="Dream Figures" icon="users" delay={500}>
              {patterns.topFigures.map((figure, i) => (
                <PatternBar
                  key={figure.label}
                  data={figure}
                  gradientColors={colors.gradients.goldToTeal}
                  index={i}
                />
              ))}
            </PatternCard>
          )}

          {/* Location Familiarity */}
          {patterns?.locationPatterns && patterns.locationPatterns.length > 0 && (
            <PatternCard title="Dream Locations" icon="map-marker" delay={600}>
              {patterns.locationPatterns.map((location, i) => (
                <PatternBar
                  key={location.label}
                  data={location}
                  gradientColors={colors.gradients.secondary}
                  index={i}
                />
              ))}
            </PatternCard>
          )}

          {/* Chat about patterns */}
          <Animated.View entering={FadeInUp.delay(700).duration(400).springify()}>
            <Pressable onPress={handleChatAboutPatterns} style={styles.chatButton}>
              <LinearGradient colors={colors.gradients.recordButton} style={styles.chatButtonGradient}>
                <FontAwesome name="comments-o" size={20} color={colors.textPrimary} />
                <View style={styles.chatButtonText}>
                  <Text style={styles.chatButtonTitle}>Explore Your Patterns</Text>
                  <Text style={styles.chatButtonSubtitle}>Chat about what these patterns mean to you</Text>
                </View>
                <FontAwesome name="chevron-right" size={14} color={colors.textPrimary} style={styles.chatButtonArrow} />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </DreamyBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  emptyContainer: {
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
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  progressCard: {
    width: '100%',
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  progressCount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressHint: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  recordButton: {
    borderRadius: 20,
    overflow: 'hidden',
    ...colors.shadows.glow,
  },
  recordButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 16,
    gap: 12,
  },
  recordButtonText: {
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCardWrapper: {
    flex: 1,
  },
  statCard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  statGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  patternCard: {
    marginBottom: 16,
  },
  patternCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  patternCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternCardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  patternCardContent: {
    gap: 4,
  },
  patternBarContainer: {
    marginBottom: 12,
  },
  patternBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  patternBarLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  patternBarCount: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  patternBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  patternBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  chatButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 8,
    ...colors.shadows.glow,
  },
  chatButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 14,
  },
  chatButtonText: {
    flex: 1,
  },
  chatButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  chatButtonSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  chatButtonArrow: {
    opacity: 0.7,
  },
});
