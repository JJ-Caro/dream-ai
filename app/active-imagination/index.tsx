// Active Imagination Screen
// Dialogue with dream figures using Jung's technique

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useActiveImaginationStore } from '@/stores/activeImaginationStore';
import { useDreamsStore } from '@/stores/dreamsStore';
import { GlassCard } from '@/components/ui';

export default function ActiveImaginationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dreamId?: string; figureIndex?: string }>();
  const { dreams } = useDreamsStore();
  const {
    currentSession,
    startSession,
    addMessage,
    addInsight,
    endSession,
  } = useActiveImaginationStore();

  const [figureName, setFigureName] = useState('');
  const [figureDescription, setFigureDescription] = useState('');
  const [message, setMessage] = useState('');
  const [currentInsight, setCurrentInsight] = useState('');
  const [showInsightInput, setShowInsightInput] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);

  // Pre-fill from dream figure if provided
  useEffect(() => {
    if (params.dreamId && params.figureIndex !== undefined) {
      const dream = dreams.find(d => d.id === params.dreamId);
      const figure = dream?.figures?.[parseInt(params.figureIndex)];
      if (figure) {
        setFigureName(figure.relationship || figure.description.split(' ')[0]);
        setFigureDescription(figure.description);
      }
    }
  }, [params.dreamId, params.figureIndex, dreams]);

  const handleStartSession = async () => {
    if (!figureName.trim() || !figureDescription.trim()) return;
    await startSession(params.dreamId, figureName.trim(), figureDescription.trim());
  };

  const handleSendMessage = async (speaker: 'self' | 'figure') => {
    if (!message.trim() || !currentSession) return;
    await addMessage(currentSession.id, speaker, message.trim());
    setMessage('');
    
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleAddInsight = async () => {
    if (!currentInsight.trim() || !currentSession) return;
    await addInsight(currentSession.id, currentInsight.trim());
    setCurrentInsight('');
    setShowInsightInput(false);
  };

  const handleEndSession = async () => {
    if (!currentSession) return;
    await endSession(currentSession.id);
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Active Imagination',
          headerStyle: { backgroundColor: '#0a0a0f' },
          headerTintColor: '#fff',
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {!currentSession ? (
          // Setup screen
          <ScrollView style={styles.setupContainer}>
            <View style={styles.intro}>
              <Text style={styles.introTitle}>🌀 Active Imagination</Text>
              <Text style={styles.introText}>
                Jung's technique for dialoguing with figures from your dreams or unconscious.
                Choose a figure and begin a written conversation with them.
              </Text>
            </View>

            <GlassCard style={styles.setupCard}>
              <Text style={styles.label}>Figure Name</Text>
              <TextInput
                style={styles.input}
                value={figureName}
                onChangeText={setFigureName}
                placeholder="e.g., The Shadow, The Guide, My Mother"
                placeholderTextColor="#6b7280"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={figureDescription}
                onChangeText={setFigureDescription}
                placeholder="Describe how this figure appeared in your dream..."
                placeholderTextColor="#6b7280"
                multiline
              />

              <TouchableOpacity
                style={[
                  styles.startButton,
                  (!figureName.trim() || !figureDescription.trim()) && styles.disabledButton,
                ]}
                onPress={handleStartSession}
                disabled={!figureName.trim() || !figureDescription.trim()}
              >
                <Text style={styles.startButtonText}>Begin Dialogue</Text>
              </TouchableOpacity>
            </GlassCard>

            <View style={styles.tips}>
              <Text style={styles.tipsTitle}>💡 Tips</Text>
              <Text style={styles.tipText}>• Approach with curiosity, not judgment</Text>
              <Text style={styles.tipText}>• Let the figure surprise you - don't script their responses</Text>
              <Text style={styles.tipText}>• Write as the figure intuitively, without overthinking</Text>
              <Text style={styles.tipText}>• Note any insights that arise during the dialogue</Text>
            </View>
          </ScrollView>
        ) : (
          // Active session
          <KeyboardAvoidingView
            style={styles.sessionContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={100}
          >
            {/* Session header */}
            <View style={styles.sessionHeader}>
              <View>
                <Text style={styles.figureNameDisplay}>{currentSession.figure_name}</Text>
                <Text style={styles.figureDescDisplay} numberOfLines={1}>
                  {currentSession.figure_description}
                </Text>
              </View>
              <TouchableOpacity style={styles.endButton} onPress={handleEndSession}>
                <Text style={styles.endButtonText}>End Session</Text>
              </TouchableOpacity>
            </View>

            {/* Dialogue */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.dialogue}
              contentContainerStyle={styles.dialogueContent}
            >
              {currentSession.dialogue.map((entry, index) => (
                <View
                  key={index}
                  style={[
                    styles.messageBubble,
                    entry.speaker === 'self' ? styles.selfMessage : styles.figureMessage,
                  ]}
                >
                  <Text style={styles.speakerLabel}>
                    {entry.speaker === 'self' ? 'Me' : currentSession.figure_name}
                  </Text>
                  <Text style={styles.messageText}>{entry.message}</Text>
                </View>
              ))}

              {/* Insights */}
              {currentSession.insights.length > 0 && (
                <View style={styles.insightsSection}>
                  <Text style={styles.insightsTitle}>✨ Insights</Text>
                  {currentSession.insights.map((insight, index) => (
                    <Text key={index} style={styles.insightText}>• {insight}</Text>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Insight input */}
            {showInsightInput && (
              <View style={styles.insightInputContainer}>
                <TextInput
                  style={styles.insightInput}
                  value={currentInsight}
                  onChangeText={setCurrentInsight}
                  placeholder="Record an insight..."
                  placeholderTextColor="#6b7280"
                />
                <TouchableOpacity style={styles.insightButton} onPress={handleAddInsight}>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {/* Message input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.messageInput}
                value={message}
                onChangeText={setMessage}
                placeholder="Write a message..."
                placeholderTextColor="#6b7280"
                multiline
              />
              <View style={styles.sendButtons}>
                <TouchableOpacity
                  style={styles.insightToggle}
                  onPress={() => setShowInsightInput(!showInsightInput)}
                >
                  <Ionicons name="bulb-outline" size={20} color="#fbbf24" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sendButton, styles.selfSend]}
                  onPress={() => handleSendMessage('self')}
                  disabled={!message.trim()}
                >
                  <Text style={styles.sendLabel}>As Me</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sendButton, styles.figureSend]}
                  onPress={() => handleSendMessage('figure')}
                  disabled={!message.trim()}
                >
                  <Text style={styles.sendLabel}>As {currentSession.figure_name.split(' ')[0]}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  setupContainer: {
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
  setupCard: {
    marginBottom: 24,
  },
  label: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  startButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tips: {
    padding: 16,
  },
  tipsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tipText: {
    color: '#9ca3af',
    fontSize: 14,
    lineHeight: 22,
  },
  sessionContainer: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  figureNameDisplay: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  figureDescDisplay: {
    color: '#9ca3af',
    fontSize: 13,
    maxWidth: 200,
  },
  endButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 8,
  },
  endButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
  },
  dialogue: {
    flex: 1,
  },
  dialogueContent: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  selfMessage: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderBottomRightRadius: 4,
  },
  figureMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomLeftRadius: 4,
  },
  speakerLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  messageText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
  },
  insightsSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 12,
  },
  insightsTitle: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  insightText: {
    color: '#fef3c7',
    fontSize: 14,
    lineHeight: 20,
  },
  insightInputContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  insightInput: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    fontSize: 14,
  },
  insightButton: {
    backgroundColor: '#fbbf24',
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  messageInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 15,
    maxHeight: 100,
    marginBottom: 8,
  },
  sendButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  insightToggle: {
    padding: 10,
    marginRight: 'auto',
  },
  sendButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  selfSend: {
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
  },
  figureSend: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  sendLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
