import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useDreamsStore } from '@/stores/dreamsStore';
import { useWeeklyReportsStore } from '@/stores/weeklyReportsStore';
import { useUserContextStore } from '@/stores/userContextStore';
import { useChatStore } from '@/stores/chatStore';
import { aggregateJungianAnalysis } from '@/lib/gemini';
import { colors } from '@/constants/colors';
import { DreamyBackground, GlassCard, TypingIndicator } from '@/components/ui';
import { haptic } from '@/lib/haptics';
import type { JungianArchetype, WeeklyReport } from '@/types/dream';

interface PatternData {
  label: string;
  count: number;
  percentage: number;
}

// Archetype display configuration
const ARCHETYPE_CONFIG: Record<JungianArchetype, { icon: string; label: string; color: readonly [string, string]; description: string }> = {
  shadow: {
    icon: 'user-secret',
    label: 'Shadow',
    color: ['#1A1040', '#4B3F72'] as const,
    description: 'Repressed aspects of self'
  },
  anima_animus: {
    icon: 'heart',
    label: 'Anima/Animus',
    color: ['#F472B6', '#EC4899'] as const,
    description: 'Contrasexual inner figure'
  },
  self: {
    icon: 'sun-o',
    label: 'Self',
    color: ['#F6C177', '#D4A55A'] as const,
    description: 'Wholeness & integration'
  },
  persona: {
    icon: 'id-card',
    label: 'Persona',
    color: ['#94A3B8', '#64748B'] as const,
    description: 'Social mask we wear'
  },
  hero: {
    icon: 'shield',
    label: 'Hero',
    color: ['#4FD1C5', '#38A89D'] as const,
    description: 'Transformation journey'
  },
};

function PatternBar({ data, gradientColors, index }: { data: PatternData; gradientColors: readonly [string, string] | string[]; index: number }) {
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
          colors={gradientColors as [string, string]}
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
          <LinearGradient colors={colors.gradients.tealToPurple as [string, string]} style={styles.patternCardIcon}>
            <FontAwesome name={icon as any} size={14} color={colors.textPrimary} />
          </LinearGradient>
          <Text style={styles.patternCardTitle}>{title}</Text>
        </View>
        <View style={styles.patternCardContent}>{children}</View>
      </GlassCard>
    </Animated.View>
  );
}

function StatCard({ value, label, gradientColors, delay }: { value: string | number; label: string; gradientColors: readonly [string, string] | string[]; delay: number }) {
  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(400).springify()} style={styles.statCardWrapper}>
      <GlassCard style={styles.statCard} intensity="light">
        <LinearGradient colors={gradientColors as [string, string]} style={styles.statGradient}>
          <Text style={styles.statValue}>{value}</Text>
        </LinearGradient>
        <Text style={styles.statLabel}>{label}</Text>
      </GlassCard>
    </Animated.View>
  );
}

function ArchetypeCircle({ archetype, count, avgConfidence, dreamsWithAnalysis, index }: {
  archetype: JungianArchetype;
  count: number;
  avgConfidence: number;
  dreamsWithAnalysis: number;
  index: number;
}) {
  const config = ARCHETYPE_CONFIG[archetype];
  if (!config) return null; // Safety check for unknown archetypes

  const percentage = dreamsWithAnalysis > 0 ? Math.round((count / dreamsWithAnalysis) * 100) : 0;
  const confidenceLabel = avgConfidence >= 0.7 ? 'High' : avgConfidence >= 0.4 ? 'Med' : 'Low';

  return (
    <Animated.View entering={FadeInUp.delay(index * 80).duration(400).springify()} style={styles.archetypeCircleContainer}>
      <LinearGradient colors={config.color as [string, string]} style={styles.archetypeCircle}>
        <FontAwesome name={config.icon as any} size={20} color={colors.textPrimary} />
        {count > 0 && (
          <View style={styles.archetypeCountBadge}>
            <Text style={styles.archetypeCountText}>{count}</Text>
          </View>
        )}
      </LinearGradient>
      <Text style={styles.archetypeLabel}>{config.label}</Text>
      <Text style={styles.archetypePercentage}>{percentage}%</Text>
      {avgConfidence > 0 && (
        <Text style={styles.archetypeConfidence}>{confidenceLabel}</Text>
      )}
    </Animated.View>
  );
}

function AboutYouCard({ hasContext, onPress }: { hasContext: boolean; onPress: () => void }) {
  return (
    <Animated.View entering={FadeInDown.duration(400)}>
      <Pressable onPress={onPress}>
        <GlassCard style={styles.aboutYouCard} intensity="medium">
          <View style={styles.aboutYouContent}>
            <LinearGradient
              colors={hasContext ? ['#4FD1C5', '#38A89D'] : colors.gradients.tealToPurple as [string, string]}
              style={styles.aboutYouIcon}
            >
              <FontAwesome name={hasContext ? 'check' : 'user-circle-o'} size={18} color={colors.textPrimary} />
            </LinearGradient>
            <View style={styles.aboutYouText}>
              <View style={styles.aboutYouTitleRow}>
                <Text style={styles.aboutYouTitle}>
                  {hasContext ? 'Your Context' : 'Help Me Understand You'}
                </Text>
                {hasContext && (
                  <View style={styles.personalizedBadge}>
                    <FontAwesome name="check" size={10} color={colors.positive} />
                    <Text style={styles.personalizedBadgeText}>Personalized</Text>
                  </View>
                )}
              </View>
              <Text style={styles.aboutYouSubtitle}>
                {hasContext
                  ? 'Your dreams are analyzed with personal context'
                  : 'Share context about your life for better dream insights'}
              </Text>
            </View>
            <View style={styles.aboutYouCta}>
              <Text style={styles.aboutYouCtaText}>{hasContext ? 'Edit' : 'Share'}</Text>
              <FontAwesome name="chevron-right" size={12} color={colors.primary} />
            </View>
          </View>
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
}

function WeeklyReportCard({ report, isGenerating }: { report: WeeklyReport | null; isGenerating: boolean }) {
  const [expanded, setExpanded] = useState(false);

  if (isGenerating) {
    return (
      <Animated.View entering={FadeInDown.duration(400)}>
        <GlassCard style={styles.weeklyReportCard} intensity="medium">
          <View style={styles.weeklyReportHeader}>
            <LinearGradient colors={colors.gradients.tealToPurple as [string, string]} style={styles.weeklyReportIcon}>
              <FontAwesome name="calendar" size={16} color={colors.textPrimary} />
            </LinearGradient>
            <View style={styles.weeklyReportHeaderText}>
              <Text style={styles.weeklyReportTitle}>Weekly Report</Text>
              <Text style={styles.weeklyReportDate}>Generating insights...</Text>
            </View>
          </View>
          <View style={styles.generatingContainer}>
            <TypingIndicator />
          </View>
        </GlassCard>
      </Animated.View>
    );
  }

  if (!report) return null;

  const weekStart = new Date(report.week_start);
  const weekEnd = new Date(report.week_end);
  const dateRange = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  return (
    <Animated.View entering={FadeInDown.duration(400)}>
      <Pressable onPress={() => setExpanded(!expanded)}>
        <GlassCard style={styles.weeklyReportCard} intensity="medium">
          <View style={styles.weeklyReportHeader}>
            <LinearGradient colors={colors.gradients.tealToPurple as [string, string]} style={styles.weeklyReportIcon}>
              <FontAwesome name="calendar" size={16} color={colors.textPrimary} />
            </LinearGradient>
            <View style={styles.weeklyReportHeaderText}>
              <Text style={styles.weeklyReportTitle}>Weekly Report</Text>
              <Text style={styles.weeklyReportDate}>{dateRange}</Text>
            </View>
            <View style={styles.weeklyReportBadge}>
              <Text style={styles.weeklyReportBadgeText}>{report.dream_count} dreams</Text>
            </View>
            <FontAwesome
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.textTertiary}
            />
          </View>

          {expanded && (
            <Animated.View entering={FadeIn.duration(200)} style={styles.weeklyReportContent}>
              {/* Emotional Journey */}
              <View style={styles.weeklyReportSection}>
                <Text style={styles.weeklyReportSectionTitle}>Emotional Journey</Text>
                <View style={styles.emotionTags}>
                  {report.emotional_journey.dominant_emotions.slice(0, 3).map((emotion, i) => (
                    <View key={i} style={styles.emotionTag}>
                      <Text style={styles.emotionTagText}>{emotion}</Text>
                    </View>
                  ))}
                  <View style={[styles.emotionTag, styles.emotionTrendTag]}>
                    <Text style={styles.emotionTagText}>{report.emotional_journey.trend}</Text>
                  </View>
                </View>
                <Text style={styles.weeklyReportNarrative}>{report.emotional_journey.narrative}</Text>
              </View>

              {/* Top Themes */}
              {report.top_themes.length > 0 && (
                <View style={styles.weeklyReportSection}>
                  <Text style={styles.weeklyReportSectionTitle}>Top Themes</Text>
                  <View style={styles.themeTags}>
                    {report.top_themes.slice(0, 4).map((t, i) => (
                      <View key={i} style={styles.themeTag}>
                        <Text style={styles.themeTagText}>{t.theme}</Text>
                        <Text style={styles.themeTagCount}>{t.count}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* AI Insight */}
              <View style={styles.weeklyReportSection}>
                <Text style={styles.weeklyReportSectionTitle}>Insight</Text>
                <Text style={styles.weeklyReportInsight}>{report.ai_insight}</Text>
              </View>
            </Animated.View>
          )}
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
}

export default function PatternsScreen() {
  const router = useRouter();
  const { dreams } = useDreamsStore();
  const { reports, isGenerating, fetchReports, checkAndGenerateReport } = useWeeklyReportsStore();
  const { userContext, fetchUserContext, hasContext } = useUserContextStore();
  const { setDreamContext } = useChatStore();

  const minDreamsForPatterns = 5;
  const hasEnoughDreams = dreams.length >= minDreamsForPatterns;
  const hasDreams = dreams.length > 0;

  // Fetch reports and user context on mount
  useEffect(() => {
    fetchReports();
    fetchUserContext();
  }, []);

  // Check and generate report when dreams change
  useEffect(() => {
    if (dreams.length > 0) {
      checkAndGenerateReport(dreams);
    }
  }, [dreams]);

  // Get latest report
  const latestReport = reports.length > 0 ? reports[0] : null;

  // Calculate Jungian aggregates
  const jungianData = useMemo(() => {
    if (dreams.length === 0) return null;
    return aggregateJungianAnalysis(dreams);
  }, [dreams]);

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

  const handleAboutYou = () => {
    haptic.medium();
    router.push('/about-you');
  };

  if (!hasEnoughDreams) {
    const progress = (dreams.length / minDreamsForPatterns) * 100;
    const remaining = minDreamsForPatterns - dreams.length;

    return (
      <DreamyBackground starCount={40} showOrbs={true}>
        <SafeAreaView style={styles.container} edges={['top']}>
          <ScrollView contentContainerStyle={styles.emptyScrollContent} showsVerticalScrollIndicator={false}>
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
                    colors={colors.gradients.tealToPurple as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressFill, { width: `${progress}%` }]}
                  />
                </View>
                <Text style={styles.progressHint}>
                  Each dream reveals more about your subconscious patterns
                </Text>
              </GlassCard>

              {/* Show weekly report even with < 5 dreams */}
              {(latestReport || isGenerating) && (
                <View style={styles.earlyReportSection}>
                  <WeeklyReportCard report={latestReport} isGenerating={isGenerating} />
                </View>
              )}

              {/* Show Jungian archetypes if any dreams have analysis */}
              {jungianData && jungianData.dreamsWithAnalysis > 0 && jungianData.dominant_archetypes.length > 0 && (
                <View style={styles.earlyArchetypeSection}>
                  <Text style={styles.earlyArchetypeTitle}>Dream Archetypes</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.archetypeScrollContent}
                  >
                    {jungianData.dominant_archetypes.map((item, i) => (
                      <ArchetypeCircle
                        key={item.archetype}
                        archetype={item.archetype}
                        count={item.count}
                        avgConfidence={item.avgConfidence}
                        dreamsWithAnalysis={jungianData.dreamsWithAnalysis}
                        index={i}
                      />
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Show message if dreams exist but no analysis yet */}
              {jungianData && jungianData.totalDreams > 0 && jungianData.dreamsWithAnalysis === 0 && (
                <View style={styles.earlyArchetypeSection}>
                  <Text style={styles.noArchetypesText}>
                    Record more dreams to discover your archetypes
                  </Text>
                </View>
              )}

              <Pressable
                onPress={() => {
                  haptic.medium();
                  router.push('/');
                }}
                style={styles.recordButton}
              >
                <LinearGradient colors={colors.gradients.recordButton as [string, string]} style={styles.recordButtonGradient}>
                  <FontAwesome name="microphone" size={18} color={colors.textPrimary} />
                  <Text style={styles.recordButtonText}>Record a Dream</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </ScrollView>
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
                  <LinearGradient colors={colors.gradients.tealToPurple as [string, string]} style={styles.headerBadge}>
                    <FontAwesome name="magic" size={12} color={colors.textPrimary} />
                  </LinearGradient>
                </View>
                <Text style={styles.headerSubtitle}>
                  Patterns discovered from {patterns?.totalDreams} dreams
                </Text>
              </View>
            </GlassCard>
          </Animated.View>

          {/* About You - Personalization Card */}
          <AboutYouCard hasContext={hasContext()} onPress={handleAboutYou} />

          {/* Weekly Report */}
          {(latestReport || isGenerating) && (
            <WeeklyReportCard report={latestReport} isGenerating={isGenerating} />
          )}

          {/* Jungian Archetypes Section */}
          {jungianData && jungianData.dreamsWithAnalysis > 0 && jungianData.dominant_archetypes.length > 0 && (
            <Animated.View entering={FadeInDown.delay(150).duration(400)}>
              <GlassCard style={styles.archetypesCard} intensity="light">
                <View style={styles.patternCardHeader}>
                  <LinearGradient colors={colors.gradients.emotionMedium as [string, string]} style={styles.patternCardIcon}>
                    <FontAwesome name="th-large" size={14} color={colors.textPrimary} />
                  </LinearGradient>
                  <Text style={styles.patternCardTitle}>Dream Archetypes</Text>
                  <Text style={styles.archetypeSubtitle}>
                    {jungianData.dreamsWithAnalysis} of {jungianData.totalDreams} dreams analyzed
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.archetypeScrollContent}
                >
                  {jungianData.dominant_archetypes.map((item, i) => (
                    <ArchetypeCircle
                      key={item.archetype}
                      archetype={item.archetype}
                      count={item.count}
                      avgConfidence={item.avgConfidence}
                      dreamsWithAnalysis={jungianData.dreamsWithAnalysis}
                      index={i}
                    />
                  ))}
                </ScrollView>
                {jungianData.shadow_themes.length > 0 && (
                  <View style={styles.shadowThemesContainer}>
                    <Text style={styles.shadowThemesTitle}>Shadow Elements</Text>
                    <View style={styles.shadowThemesTags}>
                      {jungianData.shadow_themes.slice(0, 3).map((theme, i) => (
                        <View key={i} style={styles.shadowThemeTag}>
                          <Text style={styles.shadowThemeTagText}>{theme}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </GlassCard>
            </Animated.View>
          )}

          {/* Show message if no dreams have Jungian analysis yet */}
          {jungianData && jungianData.totalDreams > 0 && jungianData.dreamsWithAnalysis === 0 && (
            <Animated.View entering={FadeInDown.delay(150).duration(400)}>
              <GlassCard style={styles.archetypesCard} intensity="light">
                <View style={styles.patternCardHeader}>
                  <LinearGradient colors={colors.gradients.emotionMedium as [string, string]} style={styles.patternCardIcon}>
                    <FontAwesome name="th-large" size={14} color={colors.textPrimary} />
                  </LinearGradient>
                  <Text style={styles.patternCardTitle}>Dream Archetypes</Text>
                </View>
                <Text style={styles.noArchetypesText}>
                  Record more dreams to discover your Jungian archetypes
                </Text>
              </GlassCard>
            </Animated.View>
          )}

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
              <LinearGradient colors={colors.gradients.recordButton as [string, string]} style={styles.chatButtonGradient}>
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
  emptyScrollContent: {
    flexGrow: 1,
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
  // About You card styles
  aboutYouCard: {
    marginBottom: 16,
  },
  aboutYouContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  aboutYouIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutYouText: {
    flex: 1,
  },
  aboutYouTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  aboutYouTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  aboutYouSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  aboutYouCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(79, 209, 197, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  aboutYouCtaText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  personalizedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  personalizedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.positive,
  },
  // Weekly Report styles
  weeklyReportCard: {
    marginBottom: 16,
  },
  weeklyReportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weeklyReportIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weeklyReportHeaderText: {
    flex: 1,
  },
  weeklyReportTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  weeklyReportDate: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  weeklyReportBadge: {
    backgroundColor: 'rgba(79, 209, 197, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  weeklyReportBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  weeklyReportContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  weeklyReportSection: {
    marginBottom: 16,
  },
  weeklyReportSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  weeklyReportNarrative: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: 8,
  },
  weeklyReportInsight: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  emotionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emotionTag: {
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emotionTrendTag: {
    backgroundColor: 'rgba(79, 209, 197, 0.2)',
  },
  emotionTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  themeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  themeTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  themeTagCount: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  generatingContainer: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 12,
  },
  // Archetype styles
  archetypesCard: {
    marginBottom: 16,
  },
  archetypeScrollContent: {
    paddingRight: 16,
    gap: 16,
  },
  archetypeCircleContainer: {
    alignItems: 'center',
    width: 72,
  },
  archetypeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  archetypeCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archetypeCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.background,
  },
  archetypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  archetypePercentage: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },
  archetypeConfidence: {
    fontSize: 10,
    color: colors.primary,
    marginTop: 2,
    fontWeight: '500',
  },
  archetypeSubtitle: {
    fontSize: 12,
    color: colors.textTertiary,
    marginLeft: 'auto',
  },
  noArchetypesText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 16,
    fontStyle: 'italic',
  },
  shadowThemesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  shadowThemesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    marginBottom: 8,
  },
  shadowThemesTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shadowThemeTag: {
    backgroundColor: 'rgba(26, 16, 64, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(75, 63, 114, 0.3)',
  },
  shadowThemeTagText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  earlyReportSection: {
    width: '100%',
    marginBottom: 24,
  },
  earlyArchetypeSection: {
    width: '100%',
    marginBottom: 24,
  },
  earlyArchetypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
});
