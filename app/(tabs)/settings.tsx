import { View, Text, Pressable, Alert, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuthStore } from '@/stores/authStore';
import { useDreamsStore } from '@/stores/dreamsStore';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/colors';
import { DreamyBackground, GlassCard } from '@/components/ui';
import { haptic } from '@/lib/haptics';

function SettingsItem({
  icon,
  title,
  subtitle,
  onPress,
  danger,
  delay = 0,
}: {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
  delay?: number;
}) {
  const handlePress = () => {
    haptic.light();
    onPress();
  };

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(300)}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.settingsItem,
          pressed && styles.settingsItemPressed,
        ]}
      >
        <LinearGradient
          colors={danger
            ? ['rgba(251, 113, 133, 0.15)', 'rgba(251, 113, 133, 0.08)']
            : colors.gradients.tealToPurple
          }
          style={styles.settingsItemIcon}
        >
          <FontAwesome
            name={icon}
            size={16}
            color={danger ? colors.negative : colors.textPrimary}
          />
        </LinearGradient>
        <View style={styles.settingsItemContent}>
          <Text style={[styles.settingsItemTitle, danger && styles.settingsItemTitleDanger]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>
          )}
        </View>
        <FontAwesome name="chevron-right" size={12} color={colors.textTertiary} />
      </Pressable>
    </Animated.View>
  );
}

function SettingsSection({
  title,
  children,
  delay = 0,
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400).springify()}
      style={styles.section}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      <GlassCard style={styles.sectionCard} noPadding intensity="light">
        {children}
      </GlassCard>
    </Animated.View>
  );
}

function StatItem({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore();
  const { dreams } = useDreamsStore();

  const handleSignOut = () => {
    haptic.warning();
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          haptic.medium();
          signOut();
        },
      },
    ]);
  };

  const handleDeleteAllData = () => {
    haptic.error();
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your dreams. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              if (user) {
                haptic.error();
                await supabase.from('dreams').delete().eq('user_id', user.id);
                useDreamsStore.getState().fetchDreams();
                Alert.alert('Success', 'All your dreams have been deleted.');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    haptic.light();
    Alert.alert(
      'Export Data',
      'Data export will be available in a future update.',
      [{ text: 'OK' }]
    );
  };

  const handlePrivacyPolicy = () => {
    haptic.light();
    Alert.alert(
      'Privacy Policy',
      'Your dreams are stored securely and never shared. Audio recordings are deleted after transcription. You can delete your data at any time.',
      [{ text: 'OK' }]
    );
  };

  const handleAbout = () => {
    haptic.light();
    Alert.alert(
      'About DREAM AI',
      'Version 1.0.0\n\nCapture your dreams in 60 seconds. Discover patterns you\'d never see.\n\nBuilt with love and AI.',
      [{ text: 'OK' }]
    );
  };

  const totalThemes = dreams.reduce((sum, d) => sum + d.themes.length, 0);
  const totalFigures = dreams.reduce((sum, d) => sum + d.figures.length, 0);

  return (
    <DreamyBackground starCount={30} showOrbs={true}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(400)}>
            <GlassCard style={styles.headerCard} intensity="medium">
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Settings</Text>
                <Text style={styles.headerSubtitle}>Manage your dream journal</Text>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Account Section */}
          <SettingsSection title="Account" delay={100}>
            <View style={styles.accountInfo}>
              <LinearGradient colors={colors.gradients.tealToPurple} style={styles.accountAvatar}>
                <FontAwesome name="user" size={20} color={colors.textPrimary} />
              </LinearGradient>
              <View style={styles.accountDetails}>
                <Text style={styles.accountLabel}>Signed in as</Text>
                <Text style={styles.accountEmail} numberOfLines={1}>
                  {user?.email || 'Anonymous User'}
                </Text>
              </View>
            </View>
            <View style={styles.settingsDivider} />
            <SettingsItem
              icon="sign-out"
              title="Sign Out"
              onPress={handleSignOut}
              delay={150}
            />
          </SettingsSection>

          {/* Journey Stats */}
          <Animated.View entering={FadeInUp.delay(200).duration(400).springify()}>
            <Text style={styles.sectionTitle}>Your Journey</Text>
            <GlassCard style={styles.statsCard} intensity="light">
              <View style={styles.statsRow}>
                <StatItem value={dreams.length} label="Dreams" color={colors.primary} />
                <View style={styles.statsDivider} />
                <StatItem value={totalThemes} label="Themes" color={colors.secondary} />
                <View style={styles.statsDivider} />
                <StatItem value={totalFigures} label="Figures" color={colors.positive} />
              </View>
            </GlassCard>
          </Animated.View>

          {/* Data Section */}
          <SettingsSection title="Data" delay={300}>
            <SettingsItem
              icon="download"
              title="Export Data"
              subtitle="Download your dreams as JSON"
              onPress={handleExportData}
              delay={350}
            />
            <View style={styles.settingsDivider} />
            <SettingsItem
              icon="trash"
              title="Delete All Data"
              subtitle="Permanently delete all dreams"
              onPress={handleDeleteAllData}
              danger
              delay={400}
            />
          </SettingsSection>

          {/* About Section */}
          <SettingsSection title="About" delay={450}>
            <SettingsItem
              icon="shield"
              title="Privacy Policy"
              onPress={handlePrivacyPolicy}
              delay={500}
            />
            <View style={styles.settingsDivider} />
            <SettingsItem
              icon="info-circle"
              title="About DREAM AI"
              subtitle="Version 1.0.0"
              onPress={handleAbout}
              delay={550}
            />
          </SettingsSection>

          {/* Disclaimer */}
          <Animated.View entering={FadeIn.delay(600).duration(400)}>
            <GlassCard style={styles.disclaimerCard} intensity="light">
              <FontAwesome name="exclamation-circle" size={16} color={colors.textTertiary} style={styles.disclaimerIcon} />
              <Text style={styles.disclaimerText}>
                DREAM AI is not a substitute for professional psychological advice or therapy. The AI analysis is for reflection and exploration only.
              </Text>
            </GlassCard>
          </Animated.View>

          {/* Footer */}
          <Animated.View entering={FadeIn.delay(700).duration(400)} style={styles.footer}>
            <Text style={styles.footerText}>Made with care for dreamers</Text>
            <View style={styles.footerDots}>
              <View style={[styles.footerDot, { backgroundColor: colors.primary }]} />
              <View style={[styles.footerDot, { backgroundColor: colors.secondary }]} />
              <View style={[styles.footerDot, { backgroundColor: colors.accent }]} />
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </DreamyBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  headerCard: {
    marginBottom: 24,
  },
  headerContent: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 20,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingsItemPressed: {
    opacity: 0.7,
  },
  settingsItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  settingsItemTitleDanger: {
    color: colors.negative,
  },
  settingsItemSubtitle: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 2,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginLeft: 70,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  accountAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  accountDetails: {
    flex: 1,
  },
  accountLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  accountEmail: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  statsCard: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statsDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  disclaimerIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 13,
    color: colors.textTertiary,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 13,
    color: colors.textTertiary,
    marginBottom: 12,
  },
  footerDots: {
    flexDirection: 'row',
    gap: 8,
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
