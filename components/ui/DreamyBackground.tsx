import { View, StyleSheet, Dimensions } from 'react-native';
import { useEffect, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { colors } from '@/constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  delay: number;
  duration: number;
}

function Star({ star }: { star: Star }) {
  const twinkle = useSharedValue(0);

  useEffect(() => {
    twinkle.value = withDelay(
      star.delay,
      withRepeat(
        withTiming(1, { duration: star.duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(twinkle.value, [0, 1], [star.opacity * 0.3, star.opacity]),
    transform: [{ scale: interpolate(twinkle.value, [0, 1], [0.8, 1.2]) }],
  }));

  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: star.x,
          top: star.y,
          width: star.size,
          height: star.size,
          borderRadius: star.size / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

interface FloatingOrbProps {
  size: number;
  color: string;
  startX: number;
  startY: number;
  delay: number;
}

function FloatingOrb({ size, color, startX, startY, delay }: FloatingOrbProps) {
  const floatY = useSharedValue(0);
  const floatX = useSharedValue(0);

  useEffect(() => {
    floatY.value = withDelay(
      delay,
      withRepeat(
        withTiming(30, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
    floatX.value = withDelay(
      delay + 500,
      withRepeat(
        withTiming(20, { duration: 12000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value - 15 },
      { translateX: floatX.value - 10 },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.orb,
        {
          left: startX,
          top: startY,
          width: size,
          height: size,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

interface DreamyBackgroundProps {
  children: React.ReactNode;
  starCount?: number;
  showOrbs?: boolean;
}

export function DreamyBackground({
  children,
  starCount = 50,
  showOrbs = true,
}: DreamyBackgroundProps) {
  // Generate stars once
  const stars = useMemo(() => {
    return Array.from({ length: starCount }, (_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * SCREEN_HEIGHT,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.3,
      delay: Math.random() * 3000,
      duration: Math.random() * 3000 + 2000,
    }));
  }, [starCount]);

  return (
    <View style={styles.container}>
      {/* Base gradient */}
      <LinearGradient
        colors={colors.gradients.background}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Stars layer */}
      <View style={styles.starsContainer} pointerEvents="none">
        {stars.map((star) => (
          <Star key={star.id} star={star} />
        ))}
      </View>

      {/* Floating orbs */}
      {showOrbs && (
        <View style={styles.orbsContainer} pointerEvents="none">
          <FloatingOrb
            size={200}
            color="rgba(79, 209, 197, 0.08)"
            startX={SCREEN_WIDTH * 0.7}
            startY={SCREEN_HEIGHT * 0.15}
            delay={0}
          />
          <FloatingOrb
            size={150}
            color="rgba(167, 139, 250, 0.06)"
            startX={-50}
            startY={SCREEN_HEIGHT * 0.5}
            delay={2000}
          />
          <FloatingOrb
            size={180}
            color="rgba(246, 193, 119, 0.05)"
            startX={SCREEN_WIDTH * 0.3}
            startY={SCREEN_HEIGHT * 0.75}
            delay={4000}
          />
        </View>
      )}

      {/* Content */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  starsContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  star: {
    position: 'absolute',
    backgroundColor: colors.starBright,
  },
  orbsContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
});
