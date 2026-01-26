import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
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
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useState, useEffect } from 'react';
import { colors } from '@/constants/colors';
import { DreamyBackground, GlassCard } from '@/components/ui';
import { haptic } from '@/lib/haptics';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useAuthStore } from '@/stores/authStore';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: 'free' | 'premium';
  name: string;
  price: string;
  period: string;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Get started with dream journaling',
    features: [
      { text: '5 dream entries per month', included: true },
      { text: 'Basic AI interpretations', included: true },
      { text: 'Voice recording', included: true },
      { text: 'Unlimited entries', included: false },
      { text: 'Advanced pattern analysis', included: false },
      { text: 'Dream chat', included: false },
      { text: 'Weekly insights', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$6.99',
    period: 'per month',
    description: 'Unlock the full dream experience',
    features: [
      { text: 'Unlimited dream entries', included: true },
      { text: 'Advanced AI interpretations', included: true },
      { text: 'Voice recording', included: true },
      { text: 'Pattern recognition', included: true },
      { text: 'Dream chat assistant', included: true },
      { text: 'Weekly insights & reports', included: true },
      { text: 'Export dream journal', included: true },
    ],
    popular: true,
  },
];

function PlanCard({ 
  plan, 
  isSelected, 
  onSelect 
}: { 
  plan: Plan; 
  isSelected: boolean; 
  onSelect: () => void;
}) {
  const scale = useSharedValue(1);
  const borderGlow = useSharedValue(0);

  useEffect(() => {
    if (plan.popular) {
      borderGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.5, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: borderGlow.value,
  }));

  const handlePress = () => {
    scale.value = withSpring(0.98, {}, () => {
      scale.value = withSpring(1);
    });
    haptic.medium();
    onSelect();
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={animatedStyle}>
        <View style={[styles.planCard, isSelected && styles.planCardSelected]}>
          {plan.popular && (
            <Animated.View style={[styles.planGlow, glowStyle]}>
              <LinearGradient
                colors={['rgba(79, 209, 197, 0.3)', 'rgba(168, 85, 247, 0.3)']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </Animated.View>
          )}
          
          {plan.popular && (
            <View style={styles.popularBadge}>
              <LinearGradient
                colors={colors.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.popularBadgeGradient}
              >
                <FontAwesome name="star" size={10} color={colors.textPrimary} />
                <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
              </LinearGradient>
            </View>
          )}

          <View style={styles.planHeader}>
            <View>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planDescription}>{plan.description}</Text>
            </View>
            <View style={styles.planPricing}>
              <Text style={styles.planPrice}>{plan.price}</Text>
              <Text style={styles.planPeriod}>{plan.period}</Text>
            </View>
          </View>

          <View style={styles.planFeatures}>
            {plan.features.map((feature, index) => (
              <View key={index} style={styles.planFeature}>
                <FontAwesome 
                  name={feature.included ? 'check-circle' : 'times-circle'} 
                  size={16} 
                  color={feature.included ? colors.positive : colors.textTertiary} 
                />
                <Text style={[
                  styles.planFeatureText,
                  !feature.included && styles.planFeatureTextDisabled
                ]}>
                  {feature.text}
                </Text>
              </View>
            ))}
          </View>

          {isSelected && (
            <View style={styles.selectedIndicator}>
              <LinearGradient
                colors={colors.gradients.primary}
                style={styles.selectedIndicatorGradient}
              >
                <FontAwesome name="check" size={14} color={colors.textPrimary} />
              </LinearGradient>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function PaywallScreen() {
  const router = useRouter();
  const { setSelectedPlan, completeOnboarding } = useOnboardingStore();
  const { user } = useAuthStore();
  const [selectedPlan, setSelectedPlanLocal] = useState<'free' | 'premium'>('premium');

  const handleSelectPlan = (planId: 'free' | 'premium') => {
    setSelectedPlanLocal(planId);
    setSelectedPlan(planId);
  };

  const handleContinue = async () => {
    haptic.success();
    
    if (selectedPlan === 'premium') {
      // TODO: Implement actual payment flow
      Alert.alert(
        'Premium Coming Soon',
        'Premium subscriptions will be available soon! For now, enjoy the free tier.',
        [{ text: 'Continue', onPress: finishOnboarding }]
      );
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = () => {
    completeOnboarding();
    router.replace('/(tabs)');
  };

  const handleRestore = () => {
    haptic.light();
    Alert.alert('Restore Purchases', 'No previous purchases found.');
  };

  return (
    <DreamyBackground starCount={40} showOrbs={true}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <View style={styles.headerContent}>
            <LinearGradient
              colors={colors.gradients.tealToPurple}
              style={styles.headerIcon}
            >
              <FontAwesome name="unlock-alt" size={24} color={colors.textPrimary} />
            </LinearGradient>
            <Text style={styles.headerTitle}>Unlock Your Dreams</Text>
            <Text style={styles.headerSubtitle}>
              Choose the plan that's right for you
            </Text>
          </View>
        </Animated.View>

        {/* Plans */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.plansContainer}>
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isSelected={selectedPlan === plan.id}
                onSelect={() => handleSelectPlan(plan.id)}
              />
            ))}
          </Animated.View>

          {/* Terms */}
          <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.termsContainer}>
            <Text style={styles.termsText}>
              Premium subscription renews automatically. Cancel anytime in Settings.
            </Text>
            <Pressable onPress={handleRestore}>
              <Text style={styles.restoreText}>Restore Purchases</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.ctaContainer}>
          <Pressable onPress={handleContinue} style={styles.ctaButton}>
            <LinearGradient
              colors={selectedPlan === 'premium' ? colors.gradients.primary : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>
                {selectedPlan === 'premium' ? 'Start Free Trial' : 'Continue with Free'}
              </Text>
              <FontAwesome name="arrow-right" size={18} color={colors.textPrimary} />
            </LinearGradient>
          </Pressable>
          
          {selectedPlan === 'premium' && (
            <Text style={styles.trialText}>7-day free trial, then $6.99/month</Text>
          )}
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 16,
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  planCardSelected: {
    borderColor: colors.primary,
  },
  planGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    right: 16,
    borderRadius: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
  },
  popularBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  planDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  planPricing: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  planPeriod: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  planFeatures: {
    gap: 10,
  },
  planFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  planFeatureText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  planFeatureTextDisabled: {
    color: colors.textTertiary,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  selectedIndicatorGradient: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsContainer: {
    alignItems: 'center',
    marginTop: 24,
    gap: 12,
  },
  termsText: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  restoreText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  ctaContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
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
  trialText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 12,
  },
});
