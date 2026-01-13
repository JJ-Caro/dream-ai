import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '@/constants/colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GlassCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  intensity?: 'light' | 'medium' | 'strong';
  glowColor?: string;
  noPadding?: boolean;
  haptic?: boolean;
}

export function GlassCard({
  children,
  onPress,
  style,
  intensity = 'medium',
  glowColor,
  noPadding = false,
  haptic = true,
}: GlassCardProps) {
  const scale = useSharedValue(1);

  const intensityValues = {
    light: 20,
    medium: 40,
    strong: 60,
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    }
  };

  const handlePress = () => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  const content = (
    <>
      {/* Glow effect */}
      {glowColor && (
        <View
          style={[
            styles.glow,
            { backgroundColor: glowColor, shadowColor: glowColor },
          ]}
        />
      )}

      {/* Gradient border effect */}
      <LinearGradient
        colors={colors.gradients.glass}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBorder}
      />

      {/* Blur background */}
      <BlurView
        intensity={intensityValues[intensity]}
        tint="dark"
        style={styles.blur}
      />

      {/* Inner gradient for glass effect */}
      <LinearGradient
        colors={colors.gradients.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.innerGradient}
      />

      {/* Content */}
      <View style={[styles.content, noPadding && styles.noPadding]}>
        {children}
      </View>
    </>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.container, animatedStyle, style]}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return <View style={[styles.container, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderGlass,
    ...colors.shadows.card,
  },
  glow: {
    position: 'absolute',
    top: -20,
    left: '20%',
    right: '20%',
    height: 40,
    borderRadius: 20,
    opacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
  },
  gradientBorder: {
    ...StyleSheet.absoluteFillObject,
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  innerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    padding: 20,
  },
  noPadding: {
    padding: 0,
  },
});
