// Dream Incubation Screen
// Set intentions before sleep to guide dreams

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useIncubationStore, INCUBATION_TEMPLATES } from '@/stores/incubationStore';
import { GlassCard } from '@/components/ui';

export default function IncubationScreen() {
  const {
    incubations,
    activeIncubation,
    fetchIncubations,
    createIncubation,
    resolveIncubation,
  } = useIncubationStore();

  const [question, setQuestion] = useState('');
  const [intention, setIntention] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showResolve, setShowResolve] = useState(false);

  useEffect(() => {
    fetchIncubations();
  }, []);

  const handleCreate = async () => {
    if (!question.trim()) return;
    await createIncubation(question.trim(), intention.trim());
    setQuestion('');
    setIntention('');
  };

  const handleResolve = async () => {
    if (!activeIncubation) return;
    await resolveIncubation(activeIncubation.id, resolutionNotes.trim());
    setResolutionNotes('');
    setShowResolve(false);
  };

  const selectTemplate = (template: string) => {
    setQuestion(template);
    setShowTemplates(false);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Dream Incubation',
          headerStyle: { backgroundColor: '#0a0a0f' },
          headerTintColor: '#fff',
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView style={styles.content}>
          {/* Intro */}
          <View style={styles.intro}>
            <Text style={styles.introTitle}>🌙 Dream Incubation</Text>
            <Text style={styles.introText}>
              An ancient practice of asking your dreams for guidance. Set an intention
              before sleep, and your unconscious may respond with insight.
            </Text>
          </View>

          {/* Active Incubation */}
          {activeIncubation && (
            <GlassCard style={styles.activeCard}>
              <View style={styles.activeHeader}>
                <Ionicons name="moon" size={20} color="#a5b4fc" />
                <Text style={styles.activeLabel}>Active Incubation</Text>
              </View>
              <Text style={styles.activeQuestion}>{activeIncubation.question}</Text>
              {activeIncubation.intention && (
                <Text style={styles.activeIntention}>{activeIncubation.intention}</Text>
              )}
              <Text style={styles.activeDate}>
                Set {new Date(activeIncubation.set_at).toLocaleDateString()}
              </Text>

              {showResolve ? (
                <View style={styles.resolveSection}>
                  <TextInput
                    style={styles.resolveInput}
                    value={resolutionNotes}
                    onChangeText={setResolutionNotes}
                    placeholder="What did you learn? Any dreams that answered?"
                    placeholderTextColor="#6b7280"
                    multiline
                  />
                  <View style={styles.resolveActions}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setShowResolve(false)}
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.resolveButton}
                      onPress={handleResolve}
                    >
                      <Text style={styles.resolveText}>Complete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.markResolvedButton}
                  onPress={() => setShowResolve(true)}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color="#10b981" />
                  <Text style={styles.markResolvedText}>Mark as Resolved</Text>
                </TouchableOpacity>
              )}
            </GlassCard>
          )}

          {/* New Incubation Form */}
          {!activeIncubation && (
            <GlassCard style={styles.formCard}>
              <Text style={styles.formTitle}>Set Your Intention</Text>

              <View style={styles.questionRow}>
                <TextInput
                  style={[styles.input, styles.questionInput]}
                  value={question}
                  onChangeText={setQuestion}
                  placeholder="What question do you want answered?"
                  placeholderTextColor="#6b7280"
                  multiline
                />
                <TouchableOpacity
                  style={styles.templateButton}
                  onPress={() => setShowTemplates(!showTemplates)}
                >
                  <Ionicons name="list" size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              {showTemplates && (
                <View style={styles.templateList}>
                  {INCUBATION_TEMPLATES.map(category => (
                    <View key={category.category} style={styles.templateCategory}>
                      <Text style={styles.categoryTitle}>{category.category}</Text>
                      {category.prompts.map((prompt, i) => (
                        <TouchableOpacity
                          key={i}
                          style={styles.templateItem}
                          onPress={() => selectTemplate(prompt)}
                        >
                          <Text style={styles.templateText}>{prompt}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ))}
                </View>
              )}

              <TextInput
                style={[styles.input, styles.intentionInput]}
                value={intention}
                onChangeText={setIntention}
                placeholder="Optional: Your intention or affirmation (e.g., 'I will remember my dreams')"
                placeholderTextColor="#6b7280"
                multiline
              />

              <TouchableOpacity
                style={[styles.createButton, !question.trim() && styles.disabledButton]}
                onPress={handleCreate}
                disabled={!question.trim()}
              >
                <Text style={styles.createText}>Set Incubation</Text>
              </TouchableOpacity>
            </GlassCard>
          )}

          {/* Bedtime Ritual */}
          <View style={styles.ritualSection}>
            <Text style={styles.ritualTitle}>🛏️ Bedtime Ritual</Text>
            <View style={styles.ritualStep}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>
                Before bed, read your question aloud or write it down
              </Text>
            </View>
            <View style={styles.ritualStep}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>
                As you fall asleep, hold the question gently in mind
              </Text>
            </View>
            <View style={styles.ritualStep}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>
                Upon waking, record any dreams immediately
              </Text>
            </View>
            <View style={styles.ritualStep}>
              <Text style={styles.stepNumber}>4</Text>
              <Text style={styles.stepText}>
                Look for answers that may come symbolically
              </Text>
            </View>
          </View>

          {/* Past Incubations */}
          {incubations.filter(i => !i.active).length > 0 && (
            <View style={styles.pastSection}>
              <Text style={styles.pastTitle}>Past Incubations</Text>
              {incubations.filter(i => !i.active).slice(0, 5).map(inc => (
                <View key={inc.id} style={styles.pastItem}>
                  <Text style={styles.pastQuestion}>{inc.question}</Text>
                  {inc.resolution_notes && (
                    <Text style={styles.pastResolution}>
                      ✓ {inc.resolution_notes}
                    </Text>
                  )}
                  <Text style={styles.pastDate}>
                    {new Date(inc.set_at).toLocaleDateString()}
                    {inc.resolved_at && ` → ${new Date(inc.resolved_at).toLocaleDateString()}`}
                  </Text>
                </View>
              ))}
            </View>
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
    marginBottom: 24,
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
  activeCard: {
    marginBottom: 24,
    borderColor: 'rgba(165, 180, 252, 0.3)',
    borderWidth: 1,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  activeLabel: {
    color: '#a5b4fc',
    fontSize: 14,
    fontWeight: '600',
  },
  activeQuestion: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    marginBottom: 8,
  },
  activeIntention: {
    color: '#9ca3af',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  activeDate: {
    color: '#6b7280',
    fontSize: 13,
    marginBottom: 16,
  },
  markResolvedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  markResolvedText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '500',
  },
  resolveSection: {
    marginTop: 8,
  },
  resolveInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  resolveActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  resolveButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  resolveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  formCard: {
    marginBottom: 24,
  },
  formTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  questionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 15,
  },
  questionInput: {
    flex: 1,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  templateButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateList: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  templateCategory: {
    marginBottom: 12,
  },
  categoryTitle: {
    color: '#a5b4fc',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  templateItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    marginBottom: 4,
  },
  templateText: {
    color: '#d1d5db',
    fontSize: 14,
  },
  intentionInput: {
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  createText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  ritualSection: {
    marginBottom: 24,
  },
  ritualTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  ritualStep: {
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
  pastSection: {
    marginBottom: 40,
  },
  pastTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  pastItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  pastQuestion: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
  pastResolution: {
    color: '#10b981',
    fontSize: 13,
    marginBottom: 4,
  },
  pastDate: {
    color: '#6b7280',
    fontSize: 12,
  },
});
