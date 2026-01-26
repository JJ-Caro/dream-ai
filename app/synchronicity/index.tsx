// Synchronicity Tracker Screen
// Track meaningful coincidences between dreams and waking life

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
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSynchronicityStore } from '@/stores/synchronicityStore';
import { useDreamsStore } from '@/stores/dreamsStore';
import { GlassCard } from '@/components/ui';
import type { Synchronicity } from '@/types/dream';

export default function SynchronicityScreen() {
  const params = useLocalSearchParams<{ dreamId?: string }>();
  const {
    synchronicities,
    fetchSynchronicities,
    addSynchronicity,
    deleteSynchronicity,
  } = useSynchronicityStore();
  const { dreams } = useDreamsStore();

  const [showForm, setShowForm] = useState(false);
  const [wakingEvent, setWakingEvent] = useState('');
  const [dreamConnection, setDreamConnection] = useState('');
  const [description, setDescription] = useState('');
  const [significance, setSignificance] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [selectedDreamId, setSelectedDreamId] = useState<string | undefined>(
    params.dreamId
  );

  useEffect(() => {
    fetchSynchronicities();
  }, []);

  const handleSubmit = async () => {
    if (!wakingEvent.trim() || !dreamConnection.trim()) return;

    await addSynchronicity({
      dream_id: selectedDreamId,
      description: description.trim() || `${dreamConnection.trim()} ↔ ${wakingEvent.trim()}`,
      waking_event: wakingEvent.trim(),
      dream_connection: dreamConnection.trim(),
      significance,
      occurred_at: new Date().toISOString(),
    });

    // Reset form
    setWakingEvent('');
    setDreamConnection('');
    setDescription('');
    setSignificance(3);
    setSelectedDreamId(undefined);
    setShowForm(false);
  };

  const renderSignificanceStars = (value: number, editable = false) => {
    return (
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity
            key={star}
            onPress={() => editable && setSignificance(star as 1 | 2 | 3 | 4 | 5)}
            disabled={!editable}
          >
            <Ionicons
              name={star <= value ? 'star' : 'star-outline'}
              size={editable ? 28 : 16}
              color={star <= value ? '#fbbf24' : '#6b7280'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const selectedDream = selectedDreamId
    ? dreams.find(d => d.id === selectedDreamId)
    : undefined;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Synchronicities',
          headerStyle: { backgroundColor: '#0a0a0f' },
          headerTintColor: '#fff',
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView style={styles.content}>
          {/* Intro */}
          <View style={styles.intro}>
            <Text style={styles.introTitle}>🔗 Synchronicity</Text>
            <Text style={styles.introText}>
              "Meaningful coincidences" — Jung's term for when inner experiences
              (dreams, thoughts) align with outer events in ways that feel significant.
            </Text>
          </View>

          {/* Add Button */}
          {!showForm && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowForm(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Record Synchronicity</Text>
            </TouchableOpacity>
          )}

          {/* Form */}
          {showForm && (
            <GlassCard style={styles.formCard}>
              <Text style={styles.formTitle}>Record a Synchronicity</Text>

              {/* Dream selector */}
              <Text style={styles.label}>Related Dream (optional)</Text>
              {selectedDream ? (
                <TouchableOpacity
                  style={styles.selectedDream}
                  onPress={() => setSelectedDreamId(undefined)}
                >
                  <Text style={styles.selectedDreamText} numberOfLines={2}>
                    {selectedDream.cleaned_narrative.slice(0, 100)}...
                  </Text>
                  <Ionicons name="close-circle" size={20} color="#9ca3af" />
                </TouchableOpacity>
              ) : (
                <ScrollView horizontal style={styles.dreamScroller} showsHorizontalScrollIndicator={false}>
                  {dreams.slice(0, 10).map(dream => (
                    <TouchableOpacity
                      key={dream.id}
                      style={styles.dreamOption}
                      onPress={() => setSelectedDreamId(dream.id)}
                    >
                      <Text style={styles.dreamOptionDate}>
                        {new Date(dream.recorded_at).toLocaleDateString()}
                      </Text>
                      <Text style={styles.dreamOptionText} numberOfLines={2}>
                        {dream.themes.slice(0, 2).join(', ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <Text style={styles.label}>What appeared in your dream?</Text>
              <TextInput
                style={styles.input}
                value={dreamConnection}
                onChangeText={setDreamConnection}
                placeholder="Symbol, theme, event, or feeling from the dream"
                placeholderTextColor="#6b7280"
                multiline
              />

              <Text style={styles.label}>What happened in waking life?</Text>
              <TextInput
                style={styles.input}
                value={wakingEvent}
                onChangeText={setWakingEvent}
                placeholder="The outer event that mirrored the dream"
                placeholderTextColor="#6b7280"
                multiline
              />

              <Text style={styles.label}>Additional notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={description}
                onChangeText={setDescription}
                placeholder="Your reflections on the connection..."
                placeholderTextColor="#6b7280"
                multiline
              />

              <Text style={styles.label}>How significant does this feel?</Text>
              {renderSignificanceStars(significance, true)}

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowForm(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (!wakingEvent.trim() || !dreamConnection.trim()) && styles.disabledButton,
                  ]}
                  onPress={handleSubmit}
                  disabled={!wakingEvent.trim() || !dreamConnection.trim()}
                >
                  <Text style={styles.submitText}>Save</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          )}

          {/* Synchronicities List */}
          {synchronicities.length > 0 ? (
            <View style={styles.listSection}>
              <Text style={styles.listTitle}>Your Synchronicities</Text>
              {synchronicities.map(sync => (
                <GlassCard key={sync.id} style={styles.syncCard}>
                  <View style={styles.syncHeader}>
                    {renderSignificanceStars(sync.significance)}
                    <Text style={styles.syncDate}>
                      {new Date(sync.occurred_at).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={styles.connectionSection}>
                    <View style={styles.connectionItem}>
                      <Ionicons name="moon-outline" size={16} color="#a5b4fc" />
                      <Text style={styles.connectionLabel}>Dream:</Text>
                      <Text style={styles.connectionText}>{sync.dream_connection}</Text>
                    </View>
                    <View style={styles.connectionDivider}>
                      <Ionicons name="swap-horizontal" size={20} color="#6b7280" />
                    </View>
                    <View style={styles.connectionItem}>
                      <Ionicons name="sunny-outline" size={16} color="#fbbf24" />
                      <Text style={styles.connectionLabel}>Waking:</Text>
                      <Text style={styles.connectionText}>{sync.waking_event}</Text>
                    </View>
                  </View>

                  {sync.description && sync.description !== `${sync.dream_connection} ↔ ${sync.waking_event}` && (
                    <Text style={styles.syncDescription}>{sync.description}</Text>
                  )}

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteSynchronicity(sync.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </GlassCard>
              ))}
            </View>
          ) : (
            !showForm && (
              <View style={styles.emptyState}>
                <Ionicons name="infinite" size={64} color="#6b7280" />
                <Text style={styles.emptyTitle}>No synchronicities yet</Text>
                <Text style={styles.emptyText}>
                  When you notice a meaningful connection between a dream and
                  waking life, record it here.
                </Text>
              </View>
            )
          )}

          {/* About Section */}
          <View style={styles.aboutSection}>
            <Text style={styles.aboutTitle}>What is Synchronicity?</Text>
            <Text style={styles.aboutText}>
              Carl Jung coined this term for events that are meaningfully related
              but not causally connected. Examples include:
            </Text>
            <View style={styles.exampleList}>
              <Text style={styles.exampleItem}>
                • Dreaming of a friend, then unexpectedly hearing from them
              </Text>
              <Text style={styles.exampleItem}>
                • A dream symbol appearing in waking life the next day
              </Text>
              <Text style={styles.exampleItem}>
                • Thinking about a song, then hearing it on the radio
              </Text>
              <Text style={styles.exampleItem}>
                • A dream that seems to predict or reflect real events
              </Text>
            </View>
            <Text style={styles.aboutText}>
              Tracking synchronicities can reveal patterns between your inner
              and outer worlds.
            </Text>
          </View>
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
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
  label: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  dreamScroller: {
    marginBottom: 16,
    marginHorizontal: -4,
  },
  dreamOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 4,
    width: 120,
  },
  dreamOptionDate: {
    color: '#a5b4fc',
    fontSize: 11,
    marginBottom: 4,
  },
  dreamOptionText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  selectedDream: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  selectedDreamText: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 15,
    marginBottom: 16,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  notesInput: {
    minHeight: 80,
  },
  stars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 16,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  cancelText: {
    color: '#9ca3af',
    fontSize: 15,
  },
  submitButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  listSection: {
    marginBottom: 24,
  },
  listTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  syncCard: {
    marginBottom: 12,
    position: 'relative',
  },
  syncHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  syncDate: {
    color: '#6b7280',
    fontSize: 13,
  },
  connectionSection: {
    gap: 8,
  },
  connectionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  connectionLabel: {
    color: '#6b7280',
    fontSize: 13,
    width: 50,
  },
  connectionText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  connectionDivider: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  syncDescription: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 12,
    fontStyle: 'italic',
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  aboutSection: {
    marginBottom: 40,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
  },
  aboutTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  aboutText: {
    color: '#9ca3af',
    fontSize: 14,
    lineHeight: 20,
  },
  exampleList: {
    marginVertical: 12,
  },
  exampleItem: {
    color: '#9ca3af',
    fontSize: 14,
    lineHeight: 24,
  },
});
