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
  withSpring,
} from 'react-native-reanimated';
import { useState } from 'react';
import { colors } from '@/constants/colors';
import { DreamyBackground } from '@/components/ui';
import { haptic } from '@/lib/haptics';

const { width } = Dimensions.get('window');

interface ProblemOption {
  id: string;
  icon: string;
  text: string;
  subtext: string;
}

const problems: ProblemOption[] = [
  {
    id: 'forget',
    icon: 'cloud',
    text: 'I forget my dreams',
    subtext: 'Dreams fade within minutes of waking',
  },
  {
    id: 'meaning',
    icon: 'question-circle',
    text: 'I don\'t understand them',
    subtext: 'Dreams feel random and confusing',
  },
  {
    id: 'patterns',
    icon: 'repeat',
    text: 'I have recurring dreams',
    subtext: 'The same themes keep coming back',
  },
  {
    id: 'curious',
    icon: 'lightbulb-o',
    text: 'I want to explore my mind',
    subtext: 'Dreams hold hidden insights',
  },
];

function ProblemCard({ 
  problem, 
  isSelected, 
  onSelect,
  index,
}: { 
  problem: ProblemOption; 
  isSelected: boolean;
  onSelect: () => void;
  index: number;
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
    <Animated.View 
      entering={FadeInUp.delay(100 + index * 100).duration(400)}
      style={animatedStyle}
    >
      <Pressable onPress={handlePress}>
        <View style={[styles.problemCard, isSelected && styles.problemCardSelected]}>
          <View style={[styles.problemIcon, isSelected && styles.problemIconSelected]}>
            <FontAwesome 
              name={problem.icon as any} 
              size={24} 
              color={isSelected ? colors.primary : colors.textSecondary} 
            />
          </View>
          <View style={styles.problemTextContainer}>
            <Text style={[styles.problemText, isSelected && styles.problemTextSelected]}>
              {problem.text}
            </Text>
            <Text style={styles.problemSubtext}>{problem.subtext}</Text>
          </View>
          {isSelected && (
            <View style={styles.checkmark}>
              <LinearGradient
                colors={colors.gradients.primary}
                style={styles.checkmarkGradient}
              >
                <FontAwesome name="check" size={12} color={colors.textPrimary} />
              </LinearGradient>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function ProblemScreen() {
  const router = useRouter();
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);

  const toggleProblem = (id: string) => {
    setSelectedProblems(prev => 
      prev.includes(id) 
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  const handleContinue = () => {
    haptic.medium();
    router.push('/(onboarding)/features');
  };

  return (
    <DreamyBackground starCount={60} showOrbs={true}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <LinearGradient
            colors={colors.gradients.tealToPurple}
            style={styles.headerIcon}
          >
            <FontAwesome name="moon-o" size={28} color={colors.textPrimary} />
          </LinearGradient>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.titleContainer}>
          <Text style={styles.title}>What brings you here?</Text>
          <Text style={styles.subtitle}>
            Select all that apply — this helps us personalize your experience
          </Text>
        </Animated.View>

        {/* Problem Options */}
        <View style={styles.problemsContainer}>
          {problems.map((problem, index) => (
            <ProblemCard
              key={problem.id}
              problem={problem}
              isSelected={selectedProblems.includes(problem.id)}
              onSelect={() => toggleProblem(problem.id)}
              index={index}
            />
          ))}
        </View>

        {/* Stats - Social Proof Teaser */}
        <Animated.View entering={FadeInUp.delay(600).duration(400)} style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>89%</Text>
            <Text style={styles.statLabel}>remember more dreams</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>50K+</Text>
            <Text style={styles.statLabel}>dreams analyzed</Text>
          </View>
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInUp.delay(700).duration(400)} style={styles.ctaContainer}>
          <Pressable 
            onPress={handleContinue} 
            style={[styles.ctaButton, selectedProblems.length === 0 && styles.ctaButtonDisabled]}
            disabled={selectedProblems.length === 0}
          >
            <LinearGradient
              colors={selectedProblems.length > 0 ? colors.gradients.primary : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>Continue</Text>
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
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  problemsContainer: {
    flex: 1,
    gap: 12,
  },
  problemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  problemCardSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(79, 209, 197, 0.1)',
  },
  problemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  problemIconSelected: {
    backgroundColor: 'rgba(79, 209, 197, 0.2)',
  },
  problemTextContainer: {
    flex: 1,
  },
  problemText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  problemTextSelected: {
    color: colors.primary,
  },
  problemSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  checkmark: {
    marginLeft: 8,
  },
  checkmarkGradient: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  ctaContainer: {
    paddingBottom: 24,
  },
  ctaButton: {
    borderRadius: 16,
    overflow: 'hidden',
    ...colors.shadows.glow,
  },
  ctaButtonDisabled: {
    opacity: 0.6,
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
