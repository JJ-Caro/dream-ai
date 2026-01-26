// Analytics Module
// Track app usage and dream patterns for insights

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logError } from '@/lib/errorLogger';
import type { Dream, JungianArchetype } from '@/types/dream';

const ANALYTICS_KEY = 'dream_analytics';

export interface AnalyticsData {
  totalDreams: number;
  totalWordCount: number;
  avgWordsPerDream: number;
  streakDays: number;
  longestStreak: number;
  archetypeFrequency: Record<JungianArchetype, number>;
  themeFrequency: Record<string, number>;
  emotionFrequency: Record<string, number>;
  symbolFrequency: Record<string, number>;
  weekdayDistribution: number[]; // Sunday = 0
  hourDistribution: number[]; // 0-23
  dreamsPerMonth: Record<string, number>; // YYYY-MM -> count
  avgEmotionalIntensity: number;
  deepAnalysisCount: number;
  lastUpdated: string;
}

const DEFAULT_ANALYTICS: AnalyticsData = {
  totalDreams: 0,
  totalWordCount: 0,
  avgWordsPerDream: 0,
  streakDays: 0,
  longestStreak: 0,
  archetypeFrequency: {} as Record<JungianArchetype, number>,
  themeFrequency: {},
  emotionFrequency: {},
  symbolFrequency: {},
  weekdayDistribution: [0, 0, 0, 0, 0, 0, 0],
  hourDistribution: new Array(24).fill(0),
  dreamsPerMonth: {},
  avgEmotionalIntensity: 0,
  deepAnalysisCount: 0,
  lastUpdated: new Date().toISOString(),
};

export async function getAnalytics(): Promise<AnalyticsData> {
  try {
    const stored = await AsyncStorage.getItem(ANALYTICS_KEY);
    if (stored) {
      return { ...DEFAULT_ANALYTICS, ...JSON.parse(stored) };
    }
    return DEFAULT_ANALYTICS;
  } catch (error) {
    logError('getAnalytics', error);
    return DEFAULT_ANALYTICS;
  }
}

export async function computeAnalytics(dreams: Dream[]): Promise<AnalyticsData> {
  const analytics: AnalyticsData = { ...DEFAULT_ANALYTICS };
  
  if (dreams.length === 0) {
    await AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify(analytics));
    return analytics;
  }

  // Basic counts
  analytics.totalDreams = dreams.length;
  analytics.totalWordCount = dreams.reduce((sum, d) => sum + (d.word_count || 0), 0);
  analytics.avgWordsPerDream = Math.round(analytics.totalWordCount / dreams.length);
  analytics.deepAnalysisCount = dreams.filter(d => d.deep_analysis).length;

  // Streak calculation
  const sortedDates = [...new Set(
    dreams.map(d => new Date(d.recorded_at).toISOString().split('T')[0])
  )].sort().reverse();
  
  let currentStreak = 0;
  let maxStreak = 0;
  const today = new Date().toISOString().split('T')[0];
  
  for (let i = 0; i < sortedDates.length; i++) {
    const date = new Date(sortedDates[i]);
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    
    if (date.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  // Calculate longest streak
  let tempStreak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const curr = new Date(sortedDates[i]);
    const prev = new Date(sortedDates[i - 1]);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      tempStreak++;
      maxStreak = Math.max(maxStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }
  
  analytics.streakDays = currentStreak;
  analytics.longestStreak = Math.max(maxStreak, currentStreak);

  // Frequency maps
  let totalEmotionalIntensity = 0;
  let emotionCount = 0;

  for (const dream of dreams) {
    // Archetypes
    const archetype = dream.quick_archetype?.likely_archetype || 
                     dream.deep_analysis?.primary_archetype?.type;
    if (archetype) {
      analytics.archetypeFrequency[archetype] = (analytics.archetypeFrequency[archetype] || 0) + 1;
    }

    // Themes
    dream.themes?.forEach(theme => {
      analytics.themeFrequency[theme] = (analytics.themeFrequency[theme] || 0) + 1;
    });

    // Emotions
    dream.emotions?.forEach(e => {
      analytics.emotionFrequency[e.emotion] = (analytics.emotionFrequency[e.emotion] || 0) + 1;
      totalEmotionalIntensity += e.intensity;
      emotionCount++;
    });

    // Symbols
    dream.symbols?.forEach(s => {
      analytics.symbolFrequency[s.symbol] = (analytics.symbolFrequency[s.symbol] || 0) + 1;
    });

    // Time distributions
    const recordedAt = new Date(dream.recorded_at);
    analytics.weekdayDistribution[recordedAt.getDay()]++;
    analytics.hourDistribution[recordedAt.getHours()]++;

    // Monthly
    const monthKey = recordedAt.toISOString().slice(0, 7);
    analytics.dreamsPerMonth[monthKey] = (analytics.dreamsPerMonth[monthKey] || 0) + 1;
  }

  analytics.avgEmotionalIntensity = emotionCount > 0 
    ? Math.round((totalEmotionalIntensity / emotionCount) * 10) / 10 
    : 0;

  analytics.lastUpdated = new Date().toISOString();

  // Save
  try {
    await AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify(analytics));
  } catch (error) {
    logError('saveAnalytics', error);
  }

  return analytics;
}

// Get insights based on analytics
export function generateInsights(analytics: AnalyticsData): string[] {
  const insights: string[] = [];

  // Streak insights
  if (analytics.streakDays >= 7) {
    insights.push(`🔥 You're on a ${analytics.streakDays}-day recording streak!`);
  }
  if (analytics.longestStreak > analytics.streakDays && analytics.longestStreak >= 7) {
    insights.push(`📊 Your longest streak was ${analytics.longestStreak} days`);
  }

  // Archetype insights
  const topArchetypes = Object.entries(analytics.archetypeFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  if (topArchetypes.length > 0) {
    const [topArchetype, count] = topArchetypes[0];
    const percentage = Math.round((count / analytics.totalDreams) * 100);
    insights.push(
      `🎭 Your most common archetype is ${topArchetype.replace('_', '/')} (${percentage}% of dreams)`
    );
  }

  // Theme insights
  const topThemes = Object.entries(analytics.themeFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  if (topThemes.length >= 3) {
    insights.push(
      `🏷️ Top themes: ${topThemes.slice(0, 3).map(([t]) => t).join(', ')}`
    );
  }

  // Time insights
  const peakHour = analytics.hourDistribution.indexOf(
    Math.max(...analytics.hourDistribution)
  );
  if (analytics.hourDistribution[peakHour] >= 3) {
    const period = peakHour < 12 ? 'morning' : peakHour < 17 ? 'afternoon' : 'evening';
    insights.push(`⏰ You record most dreams in the ${period}`);
  }

  // Emotional insights
  if (analytics.avgEmotionalIntensity >= 4) {
    insights.push(`💭 Your dreams tend to be emotionally intense (avg ${analytics.avgEmotionalIntensity}/5)`);
  }

  // Volume insights
  if (analytics.totalDreams >= 30) {
    insights.push(`📝 You've recorded ${analytics.totalDreams} dreams — great for pattern recognition!`);
  }

  if (analytics.avgWordsPerDream >= 100) {
    insights.push(`✍️ Your average dream has ${analytics.avgWordsPerDream} words — rich detail!`);
  }

  return insights;
}

// Track specific events
export async function trackEvent(eventName: string, properties?: Record<string, any>) {
  // For now, just log. In production, send to analytics service
  console.log(`[Analytics] ${eventName}`, properties);
}
