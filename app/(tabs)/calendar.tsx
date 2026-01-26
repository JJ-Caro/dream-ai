// Dream Calendar View
// Visual calendar showing dreams by date

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDreamsStore } from '@/stores/dreamsStore';
import { GlassCard } from '@/components/ui';
import type { Dream } from '@/types/dream';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const { width } = Dimensions.get('window');
const DAY_SIZE = (width - 48) / 7;

export default function CalendarScreen() {
  const router = useRouter();
  const { dreams } = useDreamsStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Group dreams by date
  const dreamsByDate = useMemo(() => {
    const grouped: Record<string, Dream[]> = {};
    dreams.forEach(dream => {
      const date = new Date(dream.recorded_at).toISOString().split('T')[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(dream);
    });
    return grouped;
  }, [dreams]);

  // Get calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    const days: Array<{ date: string; day: number; isCurrentMonth: boolean }> = [];
    
    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startPadding - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date: d.toISOString().split('T')[0],
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
      });
    }
    
    // Current month
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d.toISOString().split('T')[0],
        day: i,
        isCurrentMonth: true,
      });
    }
    
    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d.toISOString().split('T')[0],
        day: i,
        isCurrentMonth: false,
      });
    }
    
    return days;
  }, [currentDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const selectedDreams = selectedDate ? dreamsByDate[selectedDate] || [] : [];
  const today = new Date().toISOString().split('T')[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Dream Calendar</Text>
      </View>

      {/* Month Navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('prev')}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('next')}
        >
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Day Labels */}
      <View style={styles.dayLabels}>
        {DAYS.map(day => (
          <Text key={day} style={styles.dayLabel}>{day}</Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((day, index) => {
          const dreamCount = dreamsByDate[day.date]?.length || 0;
          const isSelected = day.date === selectedDate;
          const isToday = day.date === today;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                !day.isCurrentMonth && styles.otherMonth,
                isSelected && styles.selectedDay,
                isToday && styles.today,
              ]}
              onPress={() => setSelectedDate(day.date)}
            >
              <Text
                style={[
                  styles.dayNumber,
                  !day.isCurrentMonth && styles.otherMonthText,
                  isSelected && styles.selectedText,
                ]}
              >
                {day.day}
              </Text>
              {dreamCount > 0 && (
                <View style={styles.dreamIndicator}>
                  <Text style={styles.dreamCount}>
                    {dreamCount > 9 ? '9+' : dreamCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Date Dreams */}
      <ScrollView style={styles.dreamsList}>
        {selectedDate && (
          <>
            <Text style={styles.selectedDateTitle}>
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            
            {selectedDreams.length === 0 ? (
              <Text style={styles.noDreams}>No dreams recorded</Text>
            ) : (
              selectedDreams.map(dream => (
                <TouchableOpacity
                  key={dream.id}
                  onPress={() => router.push(`/dream/${dream.id}`)}
                >
                  <GlassCard style={styles.dreamCard}>
                    <Text style={styles.dreamNarrative} numberOfLines={3}>
                      {dream.cleaned_narrative}
                    </Text>
                    <View style={styles.dreamMeta}>
                      <Text style={styles.dreamThemes}>
                        {dream.themes.slice(0, 3).join(' • ')}
                      </Text>
                      {dream.quick_archetype && (
                        <View style={styles.archetypeBadge}>
                          <Text style={styles.archetypeText}>
                            {dream.quick_archetype.likely_archetype.replace('_', '/')}
                          </Text>
                        </View>
                      )}
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  dayLabels: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  dayLabel: {
    width: DAY_SIZE,
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  dayCell: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  otherMonth: {
    opacity: 0.3,
  },
  selectedDay: {
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
  },
  today: {
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  dayNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  otherMonthText: {
    color: '#6b7280',
  },
  selectedText: {
    color: '#fff',
    fontWeight: '700',
  },
  dreamIndicator: {
    position: 'absolute',
    bottom: 4,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  dreamCount: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  dreamsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  noDreams: {
    color: '#6b7280',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 20,
  },
  dreamCard: {
    marginBottom: 12,
  },
  dreamNarrative: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  dreamMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dreamThemes: {
    color: '#9ca3af',
    fontSize: 13,
    flex: 1,
  },
  archetypeBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  archetypeText: {
    color: '#a5b4fc',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
});
