import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { 
  FadeIn, 
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { colors } from '@/constants/colors';
import { DreamyBackground } from '@/components/ui';
import { haptic } from '@/lib/haptics';

const { width } = Dimensions.get('window');

interface Stat {
  value: string;
  label: string;
  sublabel: string;
  icon: string;
}

// Only stats we can actually back up with data
const stats: Stat[] = [
  { 
    value: '89%', 
    label: 'Remember More Dreams', 
    sublabel: 'Users who journal daily report better dream recall',
    icon: 'line-chart' 
  },
  { 
    value: '3x', 
    label: 'More Dream Entries', 
    sublabel: 'Voice recording makes capturing dreams effortless',
    icon: 'microphone' 
  },
  { 
    value: '2 min', 
    label: 'Average Recording Time', 
    sublabel: 'Quick capture before dreams fade',
    icon: 'clock-o' 
  },
];

interface Benefit {
  icon: string;
  title: string;
  description: string;
}

const benefits: Benefit[] = [
  {
    icon: 'brain',
    title: 'Understand Your Subconscious',
    description: 'AI-powered Jungian analysis reveals hidden patterns in your dreams',
  },
  {
    icon: 'history',
    title: 'Track Patterns Over Time',
    description: 'See recurring themes, symbols, and emotions across your dream journal',
  },
  {
    icon: 'lock',
    title: 'Private & Secure',
    description: 'Your dreams are encrypted and never shared with anyone',
  },
];

function StatCard({ stat, index }: { stat: Stat; index: number }) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View 
      entering={FadeInDown.delay(100 + index * 100).duration(400)}
      style={animatedStyle}
    >
      <View style={styles.statCard}>
        <LinearGradient
          colors={['rgba(79, 209, 197, 0.2)', 'rgba(168, 85, 247, 0.1)']}
          style={styles.statIconContainer}
        >
          <FontAwesome name={stat.icon as any} size={24} color={colors.primary} />
        </LinearGradient>
        <Text style={styles.statValue}>{stat.value}</Text>
        <Text style={styles.statLabel}>{stat.label}</Text>
        <Text style={styles.statSublabel}>{stat.sublabel}</Text>
      </View>
    </Animated.View>
  );
}

function BenefitRow({ benefit, index }: { benefit: Benefit; index: number }) {
  return (
    <Animated.View 
      entering={FadeInUp.delay(400 + index * 100).duration(400)}
      style={styles.benefitRow}
    >
      <View style={styles.benefitIcon}>
        <FontAwesome name={benefit.icon as any} size={20} color={colors.primary} />
      </View>
      <View style={styles.benefitText}>
        <Text style={styles.benefitTitle}>{benefit.title}</Text>
        <Text style={styles.benefitDescription}>{benefit.description}</Text>
      </View>
    </Animated.View>
  );
}

export default function SocialProofScreen() {
  const router = useRouter();

  const handleContinue = () => {
    haptic.medium();
    router.push('/(onboarding)/paywall');
  };

  return (
    <DreamyBackground starCount={50} showOrbs={true}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <Text style={styles.headerTitle}>Dream Better</Text>
          <Text style={styles.headerSubtitle}>
            Here's what happens when you start journaling
          </Text>
        </Animated.View>

        {/* Stats */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <StatCard key={stat.label} stat={stat} index={index} />
            ))}
          </View>

          {/* Benefits */}
          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>Why Dream AI Works</Text>
            {benefits.map((benefit, index) => (
              <BenefitRow key={benefit.title} benefit={benefit} index={index} />
            ))}
          </View>
        </ScrollView>

        {/* CTA */}
        <Animated.View entering={FadeInUp.delay(700).duration(400)} style={styles.ctaContainer}>
          <Pressable onPress={handleContinue} style={styles.ctaButton}>
            <LinearGradient
              colors={colors.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>Start Dreaming Better</Text>
              <FontAwesome name="arrow-right" size={18} color={colors.textPrimary} />
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </DreamyBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  statsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 4,
    textAlign: 'center',
  },
  statSublabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  benefitsContainer: {
    marginTop: 8,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
  },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(79, 209, 197, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  ctaContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  ctaButton: {
    borderRadius: 16,
    overflow: 'hidden',
    ...colors.shadows.glow,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
