import type { Dream } from '@/types/dream';

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastDreamDate: Date | null;
  isActiveToday: boolean;
  streakAtRisk: boolean; // True if no dream recorded today but streak is active
}

/**
 * Calculate dream streak from a list of dreams
 * A streak is consecutive days where at least one dream was recorded
 */
export function calculateStreak(dreams: Dream[]): StreakInfo {
  if (dreams.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastDreamDate: null,
      isActiveToday: false,
      streakAtRisk: false,
    };
  }

  // Get unique dates (normalized to start of day)
  const dreamDates = dreams.map(d => {
    const date = new Date(d.recorded_at);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  });

  // Get unique dates sorted descending (most recent first)
  const uniqueDates = [...new Set(dreamDates)].sort((a, b) => b - a);

  const today = new Date();
  const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const yesterdayNormalized = todayNormalized - 24 * 60 * 60 * 1000;

  const lastDreamDate = new Date(uniqueDates[0]);
  const isActiveToday = uniqueDates[0] === todayNormalized;
  const wasActiveYesterday = uniqueDates[0] === yesterdayNormalized;

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = isActiveToday ? todayNormalized : (wasActiveYesterday ? yesterdayNormalized : null);

  if (checkDate !== null) {
    for (const date of uniqueDates) {
      if (date === checkDate) {
        currentStreak++;
        checkDate -= 24 * 60 * 60 * 1000; // Go back one day
      } else if (date < checkDate) {
        break; // Gap in streak
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;

  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const diff = uniqueDates[i] - uniqueDates[i + 1];
    if (diff === 24 * 60 * 60 * 1000) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Streak is at risk if last dream was yesterday (not today) and streak > 0
  const streakAtRisk = !isActiveToday && wasActiveYesterday && currentStreak > 0;

  return {
    currentStreak,
    longestStreak,
    lastDreamDate,
    isActiveToday,
    streakAtRisk,
  };
}

/**
 * Get motivational message based on streak
 */
export function getStreakMessage(streak: StreakInfo): string {
  if (streak.streakAtRisk) {
    return `Record a dream to keep your ${streak.currentStreak} day streak!`;
  }

  if (streak.currentStreak === 0) {
    return 'Start your dream journey today';
  }

  if (streak.currentStreak === 1) {
    return 'Great start! Keep it going tomorrow';
  }

  if (streak.currentStreak < 7) {
    return `${streak.currentStreak} days strong! 🔥`;
  }

  if (streak.currentStreak < 30) {
    return `${streak.currentStreak} day streak! You're on fire! 🔥`;
  }

  return `Incredible ${streak.currentStreak} day streak! 🔥🔥🔥`;
}
