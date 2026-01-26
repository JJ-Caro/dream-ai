import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { 
  FadeIn, 
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { useState, useRef } from 'react';
import { colors } from '@/constants/colors';
import { DreamyBackground } from '@/components/ui';
import { haptic } from '@/lib/haptics';

const { width } = Dimensions.get('window');

interface Feature {
  icon: string;
  title: string;
  description: string;
  gradient: readonly [string, string];
}

const features: Feature[] = [
  {
    icon: 'microphone',
    title: 'Voice Recording',
    description: 'Capture dreams the moment you wake up. Just speak naturally and we\'ll transcribe it instantly.',
    gradient: ['#4FD1C5', '#38B2AC'] as const,
  },
  {
    icon: 'magic',
    title: 'AI Dream Analysis',
    description: 'Understand the deeper meaning behind your dreams with intelligent interpretations powered by advanced AI.',
    gradient: ['#A855F7', '#8B5CF6'] as const,
  },
  {
    icon: 'line-chart',
    title: 'Pattern Discovery',
    description: 'Track recurring themes, symbols, and emotions. See how your dreams connect over time.',
    gradient: ['#F472B6', '#EC4899'] as const,
  },
  {
    icon: 'comments',
    title: 'Dream Chat',
    description: 'Have conversations about your dreams. Ask questions and explore their significance together.',
    gradient: ['#60A5FA', '#3B82F6'] as const,
  },
];

function FeatureCard({ feature, index, scrollX }: { feature: Feature; index: number; scrollX: SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];
    
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.85, 1, 0.85],
      Extrapolation.CLAMP
    );
    
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.5, 1, 0.5],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.featureCard, animatedStyle]}>
      <View style={styles.featureContent}>
        <LinearGradient
          colors={feature.gradient}
          style={styles.featureIcon}
        >
          <FontAwesome name={feature.icon as any} size={40} color="#fff" />
        </LinearGradient>
        <Text style={styles.featureTitle}>{feature.title}</Text>
        <Text style={styles.featureDescription}>{feature.description}</Text>
      </View>
    </Animated.View>
  );
}

function PaginationDot({ index, scrollX }: { index: number; scrollX: SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];
    
    const dotWidth = interpolate(
      scrollX.value,
      inputRange,
      [8, 24, 8],
      Extrapolation.CLAMP
    );
    
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.3, 1, 0.3],
      Extrapolation.CLAMP
    );

    return {
      width: dotWidth,
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.paginationDot, animatedStyle]}>
      <LinearGradient
        colors={colors.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.paginationDotGradient}
      />
    </Animated.View>
  );
}

export default function FeaturesScreen() {
  const router = useRouter();
  const scrollX = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<Animated.ScrollView>(null);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleContinue = () => {
    haptic.medium();
    if (currentIndex < features.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      router.push('/(onboarding)/personalize');
    }
  };

  const handleSkip = () => {
    haptic.light();
    router.push('/(onboarding)/personalize');
  };

  const isLastFeature = currentIndex === features.length - 1;

  return (
    <DreamyBackground starCount={50} showOrbs={true}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </Animated.View>

        {/* Feature Carousel */}
        <View style={styles.carouselContainer}>
          <Animated.ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentIndex(newIndex);
            }}
          >
            {features.map((feature, index) => (
              <FeatureCard 
                key={index} 
                feature={feature} 
                index={index} 
                scrollX={scrollX}
              />
            ))}
          </Animated.ScrollView>
        </View>

        {/* Pagination */}
        <View style={styles.pagination}>
          {features.map((_, index) => (
            <PaginationDot key={index} index={index} scrollX={scrollX} />
          ))}
        </View>

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.ctaContainer}>
          <Pressable onPress={handleContinue} style={styles.ctaButton}>
            <LinearGradient
              colors={colors.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>
                {isLastFeature ? 'Get Started' : 'Next'}
              </Text>
              <FontAwesome 
                name={isLastFeature ? 'check' : 'arrow-right'} 
                size={18} 
                color={colors.textPrimary} 
              />
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
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  featureCard: {
    width: width,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  featureContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    ...colors.shadows.glow,
  },
  featureTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  featureDescription: {
    fontSize: 17,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  paginationDotGradient: {
    flex: 1,
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
