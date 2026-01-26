import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
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
} from 'react-native-reanimated';
import { useState } from 'react';
import { colors } from '@/constants/colors';
import { DreamyBackground, GlassCard } from '@/components/ui';
import { haptic } from '@/lib/haptics';
import { useOnboardingStore } from '@/stores/onboardingStore';

interface Option {
  id: string;
  icon: string;
  label: string;
  description?: string;
}

const dreamGoals: Option[] = [
  { id: 'understand', icon: 'search', label: 'Understand my dreams', description: 'Learn what my dreams mean' },
  { id: 'lucid', icon: 'star', label: 'Lucid dreaming', description: 'Control and remember dreams' },
  { id: 'creativity', icon: 'lightbulb-o', label: 'Boost creativity', description: 'Use dreams for inspiration' },
  { id: 'therapy', icon: 'heart', label: 'Self-discovery', description: 'Explore my subconscious' },
  { id: 'nightmares', icon: 'shield', label: 'Handle nightmares', description: 'Process difficult dreams' },
  { id: 'curious', icon: 'question-circle', label: 'Just curious', description: 'See what it\'s about' },
];

const dreamFrequency: Option[] = [
  { id: 'daily', icon: 'sun-o', label: 'Every day' },
  { id: 'often', icon: 'calendar', label: 'A few times a week' },
  { id: 'sometimes', icon: 'calendar-o', label: 'A few times a month' },
  { id: 'rarely', icon: 'moon-o', label: 'Rarely remember' },
];

function SelectableOption({ 
  option, 
  isSelected, 
  onSelect,
  showDescription = true,
}: { 
  option: Option; 
  isSelected: boolean; 
  onSelect: () => void;
  showDescription?: boolean;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });
    haptic.light();
    onSelect();
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={animatedStyle}>
        <View style={[styles.option, isSelected && styles.optionSelected]}>
          {isSelected && (
            <LinearGradient
              colors={colors.gradients.primary}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          )}
          <View style={[styles.optionIcon, isSelected && styles.optionIconSelected]}>
            <FontAwesome 
              name={option.icon as any} 
              size={20} 
              color={isSelected ? colors.textPrimary : colors.primary} 
            />
          </View>
          <View style={styles.optionContent}>
            <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
              {option.label}
            </Text>
            {showDescription && option.description && (
              <Text style={[styles.optionDescription, isSelected && styles.optionDescriptionSelected]}>
                {option.description}
              </Text>
            )}
          </View>
          {isSelected && (
            <FontAwesome name="check-circle" size={22} color={colors.textPrimary} />
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function PersonalizeScreen() {
  const router = useRouter();
  const { setDreamGoal, setDreamFrequency } = useOnboardingStore();
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedFrequency, setSelectedFrequency] = useState<string | null>(null);
  const [step, setStep] = useState<'goal' | 'frequency'>('goal');

  const handleGoalSelect = (id: string) => {
    setSelectedGoal(id);
    setDreamGoal(id);
  };

  const handleFrequencySelect = (id: string) => {
    setSelectedFrequency(id);
    setDreamFrequency(id);
  };

  const handleContinue = () => {
    haptic.medium();
    if (step === 'goal' && selectedGoal) {
      setStep('frequency');
    } else if (step === 'frequency' && selectedFrequency) {
      router.push('/(onboarding)/paywall');
    }
  };

  const handleBack = () => {
    haptic.light();
    if (step === 'frequency') {
      setStep('goal');
    } else {
      router.back();
    }
  };

  const canContinue = step === 'goal' ? !!selectedGoal : !!selectedFrequency;

  return (
    <DreamyBackground starCount={40} showOrbs={true}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <FontAwesome name="chevron-left" size={18} color={colors.textSecondary} />
          </Pressable>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: step === 'goal' ? '50%' : '100%' }]} />
          </View>
          <View style={styles.headerSpacer} />
        </Animated.View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {step === 'goal' ? (
            <>
              {/* Goal Selection */}
              <Animated.View entering={FadeInDown.duration(400)} style={styles.questionContainer}>
                <View style={styles.questionIcon}>
                  <LinearGradient
                    colors={colors.gradients.tealToPurple}
                    style={styles.questionIconGradient}
                  >
                    <FontAwesome name="compass" size={24} color={colors.textPrimary} />
                  </LinearGradient>
                </View>
                <Text style={styles.questionTitle}>What brings you here?</Text>
                <Text style={styles.questionSubtitle}>
                  Choose what you'd like to explore with Dream AI
                </Text>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.optionsContainer}>
                {dreamGoals.map((option, index) => (
                  <SelectableOption
                    key={option.id}
                    option={option}
                    isSelected={selectedGoal === option.id}
                    onSelect={() => handleGoalSelect(option.id)}
                  />
                ))}
              </Animated.View>
            </>
          ) : (
            <>
              {/* Frequency Selection */}
              <Animated.View entering={FadeInDown.duration(400)} style={styles.questionContainer}>
                <View style={styles.questionIcon}>
                  <LinearGradient
                    colors={colors.gradients.tealToPurple}
                    style={styles.questionIconGradient}
                  >
                    <FontAwesome name="moon-o" size={24} color={colors.textPrimary} />
                  </LinearGradient>
                </View>
                <Text style={styles.questionTitle}>How often do you remember dreams?</Text>
                <Text style={styles.questionSubtitle}>
                  We'll personalize reminders and tips based on this
                </Text>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.optionsContainer}>
                {dreamFrequency.map((option) => (
                  <SelectableOption
                    key={option.id}
                    option={option}
                    isSelected={selectedFrequency === option.id}
                    onSelect={() => handleFrequencySelect(option.id)}
                    showDescription={false}
                  />
                ))}
              </Animated.View>
            </>
          )}
        </ScrollView>

        {/* CTA */}
        <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.ctaContainer}>
          <Pressable 
            onPress={handleContinue} 
            style={[styles.ctaButton, !canContinue && styles.ctaButtonDisabled]}
            disabled={!canContinue}
          >
            <LinearGradient
              colors={canContinue ? colors.gradients.primary : ['rgba(79, 209, 197, 0.3)', 'rgba(79, 209, 197, 0.2)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={[styles.ctaText, !canContinue && styles.ctaTextDisabled]}>
                Continue
              </Text>
              <FontAwesome 
                name="arrow-right" 
                size={18} 
                color={canContinue ? colors.textPrimary : colors.textTertiary} 
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
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginHorizontal: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 16,
  },
  questionContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  questionIcon: {
    marginBottom: 16,
  },
  questionIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  questionSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  optionSelected: {
    borderColor: 'transparent',
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(79, 209, 197, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionIconSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  optionLabelSelected: {
    color: colors.textPrimary,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  optionDescriptionSelected: {
    color: 'rgba(255, 255, 255, 0.7)',
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
  ctaButtonDisabled: {
    ...colors.shadows.none,
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
  ctaTextDisabled: {
    color: colors.textTertiary,
  },
});
