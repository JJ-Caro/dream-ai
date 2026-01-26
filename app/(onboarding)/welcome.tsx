import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
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

const { width, height } = Dimensions.get('window');

// Floating orb animation
function FloatingOrb({ delay, size, x, y }: { delay: number; size: number; x: number; y: number }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-20, { duration: 3000 + delay, easing: Easing.inOut(Easing.ease) }),
        withTiming(20, { duration: 3000 + delay, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 2000 + delay }),
        withTiming(0.3, { duration: 2000 + delay })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.orb, { width: size, height: size, left: x, top: y }, animatedStyle]}>
      <LinearGradient
        colors={['rgba(79, 209, 197, 0.4)', 'rgba(168, 85, 247, 0.2)']}
        style={styles.orbGradient}
      />
    </Animated.View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  
  const moonGlow = useSharedValue(0.5);

  useEffect(() => {
    moonGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: moonGlow.value,
  }));

  const handleContinue = () => {
    haptic.medium();
    router.push('/(onboarding)/features');
  };

  return (
    <DreamyBackground starCount={80} showOrbs={false}>
      {/* Floating orbs */}
      <FloatingOrb delay={0} size={100} x={width * 0.1} y={height * 0.15} />
      <FloatingOrb delay={500} size={60} x={width * 0.7} y={height * 0.25} />
      <FloatingOrb delay={1000} size={80} x={width * 0.2} y={height * 0.6} />
      <FloatingOrb delay={1500} size={50} x={width * 0.8} y={height * 0.5} />

      <SafeAreaView style={styles.container}>
        {/* Moon Icon with Glow */}
        <Animated.View entering={FadeIn.delay(200).duration(800)} style={styles.iconContainer}>
          <Animated.View style={[styles.moonGlow, glowStyle]} />
          <LinearGradient
            colors={colors.gradients.tealToPurple}
            style={styles.moonIcon}
          >
            <FontAwesome name="moon-o" size={48} color={colors.textPrimary} />
          </LinearGradient>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.titleContainer}>
          <Text style={styles.title}>Dream AI</Text>
          <Text style={styles.subtitle}>Your Personal Dream Companion</Text>
        </Animated.View>

        {/* Value Props */}
        <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.valueProps}>
          <View style={styles.valueProp}>
            <View style={styles.valuePropIcon}>
              <FontAwesome name="microphone" size={18} color={colors.primary} />
            </View>
            <Text style={styles.valuePropText}>Record dreams with voice or text</Text>
          </View>
          <View style={styles.valueProp}>
            <View style={styles.valuePropIcon}>
              <FontAwesome name="magic" size={18} color={colors.primary} />
            </View>
            <Text style={styles.valuePropText}>AI-powered dream interpretations</Text>
          </View>
          <View style={styles.valueProp}>
            <View style={styles.valuePropIcon}>
              <FontAwesome name="line-chart" size={18} color={colors.primary} />
            </View>
            <Text style={styles.valuePropText}>Discover patterns in your subconscious</Text>
          </View>
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInUp.delay(800).duration(600)} style={styles.ctaContainer}>
          <Pressable onPress={handleContinue} style={styles.ctaButton}>
            <LinearGradient
              colors={colors.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>Begin Your Journey</Text>
              <FontAwesome name="arrow-right" size={18} color={colors.textPrimary} />
            </LinearGradient>
          </Pressable>

          <Text style={styles.privacyText}>
            Your dreams are private and encrypted
          </Text>
        </Animated.View>
      </SafeAreaView>
    </DreamyBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  orb: {
    position: 'absolute',
    borderRadius: 100,
    overflow: 'hidden',
  },
  orbGradient: {
    flex: 1,
    borderRadius: 100,
  },
  iconContainer: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moonGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(79, 209, 197, 0.2)',
  },
  moonIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    ...colors.shadows.glow,
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  valueProps: {
    width: '100%',
    gap: 16,
  },
  valueProp: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  valuePropIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(79, 209, 197, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  valuePropText: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  ctaContainer: {
    width: '100%',
    alignItems: 'center',
  },
  ctaButton: {
    width: '100%',
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
  privacyText: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 16,
  },
});
