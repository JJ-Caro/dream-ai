import { View, Text, FlatList, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useDreamsStore } from '@/stores/dreamsStore';
import { useChatStore } from '@/stores/chatStore';
import { colors } from '@/constants/colors';
import { DreamyBackground, GlassCard, Skeleton, SkeletonText } from '@/components/ui';
import { haptic } from '@/lib/haptics';
import type { Dream } from '@/types/dream';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function DreamCardSkeleton({ index }: { index: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(400)}>
      <GlassCard style={styles.skeletonCard}>
        <View style={styles.skeletonHeader}>
          <Skeleton width={100} height={12} borderRadius={6} />
          <Skeleton width={70} height={26} borderRadius={13} />
        </View>
        <View style={styles.skeletonBody}>
          <SkeletonText lines={3} lineHeight={14} spacing={10} />
        </View>
        <View style={styles.skeletonFooter}>
          <Skeleton width={80} height={24} borderRadius={12} />
          <Skeleton width={80} height={24} borderRadius={12} />
          <Skeleton width={60} height={24} borderRadius={12} />
        </View>
      </GlassCard>
    </Animated.View>
  );
}

function EmotionBadge({ emotion, intensity }: { emotion: string; intensity: number }) {
  // Map intensity (1-10) to gradient colors
  const getGradientColors = () => {
    if (intensity >= 7) {
      return colors.gradients.emotionHigh;
    } else if (intensity >= 4) {
      return colors.gradients.emotionMedium;
    }
    return colors.gradients.emotionLow;
  };

  return (
    <LinearGradient
      colors={getGradientColors()}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.emotionBadge}
    >
      <Text style={styles.emotionText}>{emotion}</Text>
    </LinearGradient>
  );
}

function ThemeBadge({ theme }: { theme: string }) {
  return (
    <View style={styles.themeBadge}>
      <Text style={styles.themeText}>{theme}</Text>
    </View>
  );
}

function DreamCard({
  dream,
  onPress,
  onChat,
  index,
}: {
  dream: Dream;
  onPress: () => void;
  onChat: () => void;
  index: number;
}) {
  const scale = useSharedValue(1);

  const date = new Date(dream.recorded_at);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  // Get first 150 chars of narrative for more context
  const snippet =
    dream.cleaned_narrative.length > 150
      ? dream.cleaned_narrative.substring(0, 150) + '...'
      : dream.cleaned_narrative;

  // Get dominant emotion if any
  const dominantEmotion =
    dream.emotions.length > 0
      ? dream.emotions.reduce(
          (max, e) => (e.intensity > max.intensity ? e : max),
          dream.emotions[0]
        )
      : null;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    haptic.light();
    onPress();
  };

  const handleChatPress = () => {
    haptic.medium();
    onChat();
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(500).springify()}
      style={styles.cardWrapper}
    >
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={animatedStyle}
      >
        <GlassCard
          style={styles.dreamCard}
          glowColor={dominantEmotion ? colors.primary : undefined}
          haptic={false}
          noPadding
        >
          {/* Card Content */}
          <View style={styles.dreamCardContent}>
            {/* Header with date and emotion */}
            <View style={styles.dreamHeader}>
              <View style={styles.dreamDateContainer}>
                <View style={styles.moonIcon}>
                  <FontAwesome name="moon-o" size={14} color={colors.primary} />
                </View>
                <Text style={styles.dreamDate}>
                  {formattedDate}
                </Text>
                <Text style={styles.dreamTime}>
                  {formattedTime}
                </Text>
              </View>
              {dominantEmotion && (
                <EmotionBadge
                  emotion={dominantEmotion.emotion}
                  intensity={dominantEmotion.intensity}
                />
              )}
            </View>

            {/* Narrative snippet */}
            <Text style={styles.dreamSnippet} numberOfLines={4}>
              {snippet}
            </Text>

            {/* Themes */}
            {dream.themes.length > 0 && (
              <View style={styles.themesContainer}>
                {dream.themes.slice(0, 3).map((theme, i) => (
                  <ThemeBadge key={i} theme={theme} />
                ))}
                {dream.themes.length > 3 && (
                  <View style={styles.moreThemesBadge}>
                    <Text style={styles.moreThemesText}>+{dream.themes.length - 3}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Footer stats */}
            <View style={styles.dreamFooter}>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <FontAwesome name="user" size={11} color={colors.textTertiary} />
                  <Text style={styles.statText}>
                    {dream.figures.length}
                  </Text>
                </View>
                <View style={styles.statDot} />
                <View style={styles.statItem}>
                  <FontAwesome name="map-marker" size={11} color={colors.textTertiary} />
                  <Text style={styles.statText}>
                    {dream.locations.length}
                  </Text>
                </View>
                {dream.overall_emotional_tone && (
                  <>
                    <View style={styles.statDot} />
                    <Text style={styles.toneText}>{dream.overall_emotional_tone}</Text>
                  </>
                )}
                {/* Deep Analysis indicator */}
                {dream.deep_analysis && (
                  <>
                    <View style={styles.statDot} />
                    <View style={styles.deepAnalysisBadge}>
                      <FontAwesome name="star" size={10} color="#F59E0B" />
                      <Text style={styles.deepAnalysisBadgeText}>Deep Analysis</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Chat Button */}
          <Pressable onPress={handleChatPress} style={styles.chatButton}>
            <BlurView intensity={20} tint="dark" style={styles.chatButtonBlur}>
              <LinearGradient
                colors={['rgba(79, 209, 197, 0.1)', 'rgba(79, 209, 197, 0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.chatButtonGradient}
              >
                <FontAwesome name="comments-o" size={16} color={colors.primary} />
                <Text style={styles.chatButtonText}>Explore this dream</Text>
                <FontAwesome name="chevron-right" size={12} color={colors.primary} style={styles.chatButtonArrow} />
              </LinearGradient>
            </BlurView>
          </Pressable>
        </GlassCard>
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function DreamsScreen() {
  const router = useRouter();
  const { dreams, isLoading, fetchDreams } = useDreamsStore();
  const { setDreamContext } = useChatStore();

  useEffect(() => {
    fetchDreams();
  }, []);

  const handleChat = (dream: Dream) => {
    haptic.light();
    setDreamContext(dream);
    router.push('/chat');
  };

  const renderEmptyState = () => (
    <Animated.View entering={FadeIn.duration(600)} style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <LinearGradient
          colors={['rgba(79, 209, 197, 0.2)', 'rgba(167, 139, 250, 0.1)']}
          style={styles.emptyIconGradient}
        >
          <FontAwesome name="moon-o" size={48} color={colors.primary} />
        </LinearGradient>
      </View>
      <Text style={styles.emptyTitle}>Your dream journal awaits</Text>
      <Text style={styles.emptySubtitle}>
        Begin capturing your dreams and unlock insights into your subconscious mind.
      </Text>
      <Pressable
        onPress={() => {
          haptic.medium();
          router.push('/');
        }}
        style={styles.emptyButton}
      >
        <LinearGradient
          colors={colors.gradients.recordButton}
          style={styles.emptyButtonGradient}
        >
          <FontAwesome name="microphone" size={16} color={colors.textPrimary} />
          <Text style={styles.emptyButtonText}>Record Your First Dream</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <DreamCardSkeleton index={0} />
      <DreamCardSkeleton index={1} />
      <DreamCardSkeleton index={2} />
    </View>
  );

  const renderHeader = () => (
    <Animated.View entering={FadeInDown.duration(500)} style={styles.headerContainer}>
      <GlassCard style={styles.headerCard} intensity="light">
        <View style={styles.headerContent}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Dream Journal</Text>
            {dreams.length > 0 && (
              <LinearGradient
                colors={colors.gradients.tealToPurple}
                style={styles.dreamCountBadge}
              >
                <Text style={styles.dreamCountText}>{dreams.length}</Text>
              </LinearGradient>
            )}
          </View>
          <Text style={styles.headerSubtitle}>
            {dreams.length === 0
              ? 'Start your journey of self-discovery'
              : `${dreams.length} dream${dreams.length !== 1 ? 's' : ''} captured`}
          </Text>
        </View>
      </GlassCard>
    </Animated.View>
  );

  return (
    <DreamyBackground starCount={30} showOrbs={true}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Dream List */}
        {isLoading && dreams.length === 0 ? (
          <>
            {renderHeader()}
            {renderLoadingState()}
          </>
        ) : (
          <FlatList
            data={dreams}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <DreamCard
                dream={item}
                onPress={() => router.push(`/dream/${item.id}`)}
                onChat={() => handleChat(item)}
                index={index}
              />
            )}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={() => {
                  haptic.light();
                  fetchDreams();
                }}
                tintColor={colors.primary}
                colors={[colors.primary]}
                progressBackgroundColor={colors.surface}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </DreamyBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerCard: {
    borderRadius: 16,
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
  dreamCountBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dreamCountText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    flexGrow: 1,
  },
  loadingContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  skeletonCard: {
    gap: 16,
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonBody: {
    marginTop: 4,
  },
  skeletonFooter: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  cardWrapper: {
    marginTop: 16,
  },
  dreamCard: {
    borderRadius: 24,
  },
  dreamCardContent: {
    padding: 20,
  },
  dreamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dreamDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moonIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dreamDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  dreamTime: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  emotionBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  emotionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  dreamSnippet: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 16,
  },
  themesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  themeBadge: {
    backgroundColor: 'rgba(79, 209, 197, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 209, 197, 0.2)',
  },
  themeText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
  },
  moreThemesBadge: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  moreThemesText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textTertiary,
  },
  dreamFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  statDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textTertiary,
    marginHorizontal: 10,
    opacity: 0.5,
  },
  toneText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  chatButton: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  chatButtonBlur: {
    overflow: 'hidden',
  },
  chatButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  chatButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  chatButtonArrow: {
    marginLeft: 4,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    paddingTop: 60,
  },
  emptyIconContainer: {
    marginBottom: 32,
  },
  emptyIconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(79, 209, 197, 0.2)',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  emptyButton: {
    borderRadius: 20,
    overflow: 'hidden',
    ...colors.shadows.glow,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 16,
    gap: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  deepAnalysisBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  deepAnalysisBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
  },
});
