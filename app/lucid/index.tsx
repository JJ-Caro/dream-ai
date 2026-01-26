// Lucid Dreaming Tools Screen
// Reality checks, dream signs, and lucid practice

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useLucidDreamingStore,
  REALITY_CHECK_DESCRIPTIONS,
} from '@/stores/lucidDreamingStore';
import { useDreamsStore } from '@/stores/dreamsStore';
import { GlassCard } from '@/components/ui';
import type { RealityCheck, DreamSign } from '@/types/dream';

export default function LucidDreamingScreen() {
  const {
    realityChecks,
    dreamSigns,
    loadRealityChecks,
    updateRealityCheck,
    fetchDreamSigns,
    detectDreamSigns,
    addDreamSign,
  } = useLucidDreamingStore();
  const { dreams } = useDreamsStore();

  const [suggestedSigns, setSuggestedSigns] = useState<DreamSign[]>([]);
  const [activeTab, setActiveTab] = useState<'checks' | 'signs'>('checks');

  useEffect(() => {
    loadRealityChecks();
    fetchDreamSigns();
  }, []);

  useEffect(() => {
    // Detect potential dream signs from dreams
    if (dreams.length >= 5) {
      detectDreamSigns(dreams).then(setSuggestedSigns);
    }
  }, [dreams]);

  const toggleRealityCheck = async (id: string, enabled: boolean) => {
    await updateRealityCheck(id, { enabled });
  };

  const addSuggestedSign = async (sign: DreamSign) => {
    await addDreamSign({
      description: sign.description,
      category: sign.category,
      occurrences: sign.occurrences,
      first_seen: sign.first_seen,
      dreams: sign.dreams,
    });
    setSuggestedSigns(prev => prev.filter(s => s.description !== sign.description));
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Lucid Dreaming',
          headerStyle: { backgroundColor: '#0a0a0f' },
          headerTintColor: '#fff',
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView style={styles.content}>
          {/* Intro */}
          <View style={styles.intro}>
            <Text style={styles.introTitle}>✨ Lucid Dreaming</Text>
            <Text style={styles.introText}>
              Become aware that you're dreaming while in a dream. Use reality
              checks throughout the day and learn your personal dream signs.
            </Text>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'checks' && styles.activeTab]}
              onPress={() => setActiveTab('checks')}
            >
              <Text style={[styles.tabText, activeTab === 'checks' && styles.activeTabText]}>
                Reality Checks
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'signs' && styles.activeTab]}
              onPress={() => setActiveTab('signs')}
            >
              <Text style={[styles.tabText, activeTab === 'signs' && styles.activeTabText]}>
                Dream Signs
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'checks' ? (
            <>
              {/* Reality Checks List */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Reality Checks</Text>
                <Text style={styles.sectionSubtitle}>
                  Enable reminders to practice throughout the day
                </Text>

                {realityChecks.map(check => {
                  const desc = REALITY_CHECK_DESCRIPTIONS[check.type];
                  return (
                    <GlassCard key={check.id} style={styles.checkCard}>
                      <View style={styles.checkHeader}>
                        <View style={styles.checkInfo}>
                          <Text style={styles.checkTitle}>{desc.title}</Text>
                          <Text style={styles.checkTimes}>
                            {check.reminder_times.join(', ')}
                          </Text>
                        </View>
                        <Switch
                          value={check.enabled}
                          onValueChange={(value) => toggleRealityCheck(check.id, value)}
                          trackColor={{ false: '#374151', true: '#6366f1' }}
                          thumbColor="#fff"
                        />
                      </View>
                      <Text style={styles.checkInstruction}>{desc.instruction}</Text>
                    </GlassCard>
                  );
                })}
              </View>

              {/* How To Section */}
              <View style={styles.howTo}>
                <Text style={styles.howToTitle}>💡 How to Reality Check</Text>
                <View style={styles.howToStep}>
                  <Text style={styles.stepNumber}>1</Text>
                  <Text style={styles.stepText}>
                    Pause and genuinely ask: "Am I dreaming right now?"
                  </Text>
                </View>
                <View style={styles.howToStep}>
                  <Text style={styles.stepNumber}>2</Text>
                  <Text style={styles.stepText}>
                    Perform the check (count fingers, read text, etc.)
                  </Text>
                </View>
                <View style={styles.howToStep}>
                  <Text style={styles.stepNumber}>3</Text>
                  <Text style={styles.stepText}>
                    Look around and notice your environment in detail
                  </Text>
                </View>
                <View style={styles.howToStep}>
                  <Text style={styles.stepNumber}>4</Text>
                  <Text style={styles.stepText}>
                    If in a dream, stay calm and remember your intention
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <>
              {/* Dream Signs */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Dream Signs</Text>
                <Text style={styles.sectionSubtitle}>
                  Recurring elements that appear in your dreams
                </Text>

                {dreamSigns.length === 0 && suggestedSigns.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="search" size={48} color="#6b7280" />
                    <Text style={styles.emptyText}>
                      Record more dreams to discover your dream signs
                    </Text>
                  </View>
                ) : (
                  <>
                    {dreamSigns.map(sign => (
                      <GlassCard key={sign.id} style={styles.signCard}>
                        <View style={styles.signHeader}>
                          <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{sign.category}</Text>
                          </View>
                          <Text style={styles.signCount}>{sign.occurrences}× in dreams</Text>
                        </View>
                        <Text style={styles.signDescription}>{sign.description}</Text>
                      </GlassCard>
                    ))}
                  </>
                )}

                {/* Suggested Dream Signs */}
                {suggestedSigns.length > 0 && (
                  <View style={styles.suggestedSection}>
                    <Text style={styles.suggestedTitle}>📍 Potential Dream Signs</Text>
                    <Text style={styles.suggestedSubtitle}>
                      These elements appear frequently in your dreams
                    </Text>

                    {suggestedSigns.map(sign => (
                      <View key={sign.description} style={styles.suggestedCard}>
                        <View style={styles.suggestedInfo}>
                          <Text style={styles.suggestedCategory}>{sign.category}</Text>
                          <Text style={styles.suggestedDesc}>{sign.description}</Text>
                          <Text style={styles.suggestedCount}>
                            Appears in {sign.occurrences} dreams
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.addButton}
                          onPress={() => addSuggestedSign(sign)}
                        >
                          <Ionicons name="add" size={20} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Dream Sign Categories */}
              <View style={styles.categoriesSection}>
                <Text style={styles.categoriesTitle}>Dream Sign Categories</Text>
                <View style={styles.categoryItem}>
                  <Text style={styles.categoryEmoji}>👤</Text>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>Characters</Text>
                    <Text style={styles.categoryDesc}>
                      People who appear repeatedly (family, strangers, archetypes)
                    </Text>
                  </View>
                </View>
                <View style={styles.categoryItem}>
                  <Text style={styles.categoryEmoji}>📍</Text>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>Locations</Text>
                    <Text style={styles.categoryDesc}>
                      Places you visit often (childhood home, school, unknown buildings)
                    </Text>
                  </View>
                </View>
                <View style={styles.categoryItem}>
                  <Text style={styles.categoryEmoji}>🎭</Text>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>Actions</Text>
                    <Text style={styles.categoryDesc}>
                      Recurring activities (flying, falling, being chased)
                    </Text>
                  </View>
                </View>
                <View style={styles.categoryItem}>
                  <Text style={styles.categoryEmoji}>🔮</Text>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>Objects</Text>
                    <Text style={styles.categoryDesc}>
                      Things that appear often (water, vehicles, animals)
                    </Text>
                  </View>
                </View>
                <View style={styles.categoryItem}>
                  <Text style={styles.categoryEmoji}>💭</Text>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>Emotions</Text>
                    <Text style={styles.categoryDesc}>
                      Feelings that recur (anxiety, euphoria, confusion)
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  intro: {
    marginBottom: 20,
  },
  introTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  introText: {
    fontSize: 15,
    color: '#9ca3af',
    lineHeight: 22,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
  },
  tabText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 16,
  },
  checkCard: {
    marginBottom: 12,
  },
  checkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkInfo: {
    flex: 1,
  },
  checkTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  checkTimes: {
    color: '#9ca3af',
    fontSize: 13,
  },
  checkInstruction: {
    color: '#9ca3af',
    fontSize: 14,
    lineHeight: 20,
  },
  howTo: {
    marginBottom: 40,
  },
  howToTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  howToStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    color: '#a5b4fc',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    color: '#9ca3af',
    fontSize: 15,
    lineHeight: 22,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 12,
  },
  signCard: {
    marginBottom: 12,
  },
  signHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#a5b4fc',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  signCount: {
    color: '#6b7280',
    fontSize: 13,
  },
  signDescription: {
    color: '#fff',
    fontSize: 15,
    textTransform: 'capitalize',
  },
  suggestedSection: {
    marginTop: 24,
  },
  suggestedTitle: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  suggestedSubtitle: {
    color: '#6b7280',
    fontSize: 13,
    marginBottom: 12,
  },
  suggestedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  suggestedInfo: {
    flex: 1,
  },
  suggestedCategory: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  suggestedDesc: {
    color: '#fff',
    fontSize: 14,
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  suggestedCount: {
    color: '#9ca3af',
    fontSize: 12,
  },
  addButton: {
    backgroundColor: '#fbbf24',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesSection: {
    marginBottom: 40,
  },
  categoriesTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  categoryEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  categoryDesc: {
    color: '#9ca3af',
    fontSize: 13,
    lineHeight: 18,
  },
});
