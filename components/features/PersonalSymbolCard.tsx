// Personal Symbol Card Component
// Display and edit personal symbol meanings

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PersonalSymbol } from '@/types/dream';

interface Props {
  symbol: PersonalSymbol;
  onUpdate: (id: string, updates: Partial<PersonalSymbol>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function PersonalSymbolCard({ symbol, onUpdate, onDelete }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMeaning, setEditedMeaning] = useState(symbol.personal_meaning);
  const [editedNotes, setEditedNotes] = useState(symbol.notes || '');

  const handleSave = async () => {
    await onUpdate(symbol.id, {
      personal_meaning: editedMeaning,
      notes: editedNotes || undefined,
    });
    setIsEditing(false);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.symbolBadge}>
          <Text style={styles.symbolText}>{symbol.symbol}</Text>
        </View>
        <View style={styles.stats}>
          <Text style={styles.occurrences}>
            {symbol.occurrences}× in dreams
          </Text>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Ionicons
            name={isEditing ? 'close' : 'pencil'}
            size={18}
            color="#9ca3af"
          />
        </TouchableOpacity>
      </View>

      {isEditing ? (
        <View style={styles.editContainer}>
          <Text style={styles.label}>Personal Meaning</Text>
          <TextInput
            style={styles.input}
            value={editedMeaning}
            onChangeText={setEditedMeaning}
            placeholder="What does this symbol mean to you?"
            placeholderTextColor="#6b7280"
            multiline
          />
          
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={styles.input}
            value={editedNotes}
            onChangeText={setEditedNotes}
            placeholder="Additional context or memories..."
            placeholderTextColor="#6b7280"
            multiline
          />
          
          <View style={styles.editActions}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => onDelete(symbol.id)}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <Text style={styles.meaning}>{symbol.personal_meaning}</Text>
          
          {symbol.associated_emotions.length > 0 && (
            <View style={styles.emotions}>
              <Text style={styles.emotionsLabel}>Associated emotions:</Text>
              <Text style={styles.emotionsList}>
                {symbol.associated_emotions.join(', ')}
              </Text>
            </View>
          )}
          
          {symbol.notes && (
            <Text style={styles.notes}>{symbol.notes}</Text>
          )}
          
          <Text style={styles.firstSeen}>
            First appeared: {new Date(symbol.first_appeared).toLocaleDateString()}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  symbolBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  symbolText: {
    color: '#a5b4fc',
    fontSize: 16,
    fontWeight: '600',
  },
  stats: {
    flex: 1,
    marginLeft: 12,
  },
  occurrences: {
    color: '#9ca3af',
    fontSize: 14,
  },
  editButton: {
    padding: 8,
  },
  meaning: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  emotions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  emotionsLabel: {
    color: '#6b7280',
    fontSize: 13,
    marginRight: 4,
  },
  emotionsList: {
    color: '#a5b4fc',
    fontSize: 13,
  },
  notes: {
    color: '#9ca3af',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  firstSeen: {
    color: '#6b7280',
    fontSize: 12,
  },
  editContainer: {
    marginTop: 8,
  },
  label: {
    color: '#9ca3af',
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 15,
    marginBottom: 12,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  deleteText: {
    color: '#ef4444',
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default PersonalSymbolCard;
