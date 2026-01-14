import React from 'react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '@/constants/colors';
import { haptic } from '@/lib/haptics';

const AnimatedView = Animated.createAnimatedComponent(View);

function TabBarIcon({
  name,
  color,
  focused,
}: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  focused: boolean;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  React.useEffect(() => {
    if (focused) {
      scale.value = withSpring(1.1, { damping: 12, stiffness: 200 });
    } else {
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    }
  }, [focused]);

  return (
    <View style={styles.iconContainer}>
      {focused && (
        <View style={styles.activeGlow}>
          <LinearGradient
            colors={['rgba(79, 209, 197, 0.4)', 'transparent']}
            style={styles.glowGradient}
          />
        </View>
      )}
      <AnimatedView style={animatedStyle}>
        <FontAwesome name={name} size={22} color={color} />
      </AnimatedView>
      {focused && (
        <View style={styles.activeIndicator}>
          <LinearGradient
            colors={colors.gradients.tealToPurple}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.indicatorGradient}
          />
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: 90,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          elevation: 0,
        },
        tabBarBackground: () => (
          <View style={styles.tabBarBackground}>
            <BlurView
              intensity={60}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={['rgba(10, 22, 40, 0.95)', 'rgba(10, 22, 40, 0.98)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.tabBarBorder} />
          </View>
        ),
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 6,
          letterSpacing: 0.3,
        },
        headerShown: false,
        tabBarButton: (props) => {
          const { onPressIn, ref, ...rest } = props;
          return (
            <Pressable
              {...rest}
              onPressIn={(e) => {
                haptic.selection();
                onPressIn?.(e);
              }}
            />
          );
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Record',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="microphone" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="dreams"
        options={{
          title: 'Dreams',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="moon-o" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="patterns"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="line-chart" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="cog" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  tabBarBorder: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(79, 209, 197, 0.15)',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 36,
  },
  activeGlow: {
    position: 'absolute',
    top: -12,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  glowGradient: {
    flex: 1,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 20,
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  indicatorGradient: {
    flex: 1,
  },
});
