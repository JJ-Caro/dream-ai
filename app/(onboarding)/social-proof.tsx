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

interface Testimonial {
  name: string;
  avatar: string;
  text: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    name: 'Sarah M.',
    avatar: '👩‍🦰',
    text: 'I used to forget my dreams within minutes. Now I have a journal full of insights about myself.',
    rating: 5,
  },
  {
    name: 'James K.',
    avatar: '👨',
    text: 'The AI interpretations helped me understand a recurring nightmare I\'d had for years. Life-changing.',
    rating: 5,
  },
  {
    name: 'Maya R.',
    avatar: '👩',
    text: 'Love how easy it is to just speak my dreams. The voice recording is so natural.',
    rating: 5,
  },
];

interface Stat {
  value: string;
  label: string;
  icon: string;
}

const stats: Stat[] = [
  { value: '50K+', label: 'Dreams Recorded', icon: 'moon-o' },
  { value: '4.8', label: 'App Store Rating', icon: 'star' },
  { value: '89%', label: 'Remember More', icon: 'line-chart' },
];

function TestimonialCard({ testimonial, index }: { testimonial: Testimonial; index: number }) {
  return (
    <Animated.View 
      entering={FadeInUp.delay(200 + index * 150).duration(500)}
      style={styles.testimonialCard}
    >
      <View style={styles.testimonialHeader}>
        <Text style={styles.avatar}>{testimonial.avatar}</Text>
        <View style={styles.testimonialInfo}>
          <Text style={styles.testimonialName}>{testimonial.name}</Text>
          <View style={styles.starsContainer}>
            {[...Array(testimonial.rating)].map((_, i) => (
              <FontAwesome key={i} name="star" size={12} color="#FFD700" />
            ))}
          </View>
        </View>
      </View>
      <Text style={styles.testimonialText}>"{testimonial.text}"</Text>
    </Animated.View>
  );
}

function StatCard({ stat, index }: { stat: Stat; index: number }) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
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
      style={[styles.statCard, animatedStyle]}
    >
      <LinearGradient
        colors={['rgba(79, 209, 197, 0.2)', 'rgba(168, 85, 247, 0.1)']}
        style={styles.statIconContainer}
      >
        <FontAwesome name={stat.icon as any} size={20} color={colors.primary} />
      </LinearGradient>
      <Text style={styles.statValue}>{stat.value}</Text>
      <Text style={styles.statLabel}>{stat.label}</Text>
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
          <Text style={styles.headerTitle}>Join 50,000+ Dreamers</Text>
          <Text style={styles.headerSubtitle}>
            See why people love Dream AI
          </Text>
        </Animated.View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {stats.map((stat, index) => (
            <StatCard key={stat.label} stat={stat} index={index} />
          ))}
        </View>

        {/* Testimonials */}
        <ScrollView 
          style={styles.testimonialsScroll}
          contentContainerStyle={styles.testimonialsContent}
          showsVerticalScrollIndicator={false}
        >
          {testimonials.map((testimonial, index) => (
            <TestimonialCard 
              key={testimonial.name} 
              testimonial={testimonial} 
              index={index}
            />
          ))}

          {/* Featured In */}
          <Animated.View 
            entering={FadeInUp.delay(600).duration(400)}
            style={styles.featuredContainer}
          >
            <Text style={styles.featuredLabel}>AS SEEN IN</Text>
            <View style={styles.featuredLogos}>
              <Text style={styles.featuredLogo}>TechCrunch</Text>
              <Text style={styles.featuredDot}>•</Text>
              <Text style={styles.featuredLogo}>Product Hunt</Text>
              <Text style={styles.featuredDot}>•</Text>
              <Text style={styles.featuredLogo}>Wired</Text>
            </View>
          </Animated.View>
        </ScrollView>

        {/* CTA */}
        <Animated.View entering={FadeInUp.delay(500).duration(400)} style={styles.ctaContainer}>
          <Pressable onPress={handleContinue} style={styles.ctaButton}>
            <LinearGradient
              colors={colors.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>Unlock Dream AI</Text>
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
    fontSize: 28,
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
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  testimonialsScroll: {
    flex: 1,
  },
  testimonialsContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  testimonialCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  testimonialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    fontSize: 32,
    marginRight: 12,
  },
  testimonialInfo: {
    flex: 1,
  },
  testimonialName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  testimonialText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  featuredContainer: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 16,
  },
  featuredLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  featuredLogos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featuredLogo: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  featuredDot: {
    fontSize: 8,
    color: colors.textTertiary,
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
