import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'gradient';
  style?: ViewStyle;
  noPadding?: boolean;
}

export function Card({
  children,
  onPress,
  variant = 'default',
  style,
  noPadding = false,
}: CardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }
  };

  const variantStyles = {
    default: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    elevated: {
      backgroundColor: colors.surfaceElevated,
      ...colors.shadows.medium,
    },
    gradient: {},
  };

  if (variant === 'gradient') {
    if (onPress) {
      return (
        <AnimatedPressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[animatedStyle, style]}
        >
          <LinearGradient
            colors={colors.gradients.card}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[
              styles.card,
              noPadding && styles.noPadding,
              styles.gradientBorder,
            ]}
          >
            {children}
          </LinearGradient>
        </AnimatedPressable>
      );
    }

    return (
      <LinearGradient
        colors={colors.gradients.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          styles.card,
          noPadding && styles.noPadding,
          styles.gradientBorder,
          style,
        ]}
      >
        {children}
      </LinearGradient>
    );
  }

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          variantStyles[variant],
          noPadding && styles.noPadding,
          animatedStyle,
          style,
        ]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <View
      style={[
        styles.card,
        variantStyles[variant],
        noPadding && styles.noPadding,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },
  noPadding: {
    padding: 0,
  },
  gradientBorder: {
    borderWidth: 1,
    borderColor: colors.border,
  },
});
