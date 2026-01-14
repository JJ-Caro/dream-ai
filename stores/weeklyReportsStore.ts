import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { generateWeeklyReportInsight, aggregateJungianAnalysis } from '@/lib/gemini';
import type { Dream, WeeklyReport, WeeklyReportInsert } from '@/types/dream';

interface WeeklyReportsState {
  reports: WeeklyReport[];
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  lastCheckedWeek: string | null;

  fetchReports: () => Promise<void>;
  checkAndGenerateReport: (dreams: Dream[]) => Promise<void>;
}

// Get week bounds (Monday-Sunday)
function getWeekBounds(date: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function getPreviousWeekBounds(): { start: Date; end: Date } {
  const now = new Date();
  now.setDate(now.getDate() - 7);
  return getWeekBounds(now);
}

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

export const useWeeklyReportsStore = create<WeeklyReportsState>((set, get) => ({
  reports: [],
  isLoading: false,
  isGenerating: false,
  error: null,
  lastCheckedWeek: null,

  fetchReports: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('weekly_reports')
        .select('*')
        .order('week_start', { ascending: false });

      if (error) throw error;
      set({ reports: (data as WeeklyReport[]) || [] });
    } catch (error) {
      console.error('Failed to fetch weekly reports:', error);
      set({ error: 'Failed to load reports' });
    } finally {
      set({ isLoading: false });
    }
  },

  checkAndGenerateReport: async (dreams: Dream[]) => {
    const { lastCheckedWeek, reports, isGenerating } = get();

    // Prevent concurrent generation
    if (isGenerating) return;

    const { start: prevStart, end: prevEnd } = getPreviousWeekBounds();
    const prevWeekKey = formatDateKey(prevStart);

    // Check if we already checked this week
    if (lastCheckedWeek === prevWeekKey) return;

    set({ lastCheckedWeek: prevWeekKey });

    // Check if previous week is complete (current time > prev week end)
    const now = new Date();
    if (now <= prevEnd) return;

    // Check if report already exists
    const existingReport = reports.find(r => r.week_start === prevWeekKey);
    if (existingReport) return;

    // Get dreams from previous week
    const weekDreams = dreams.filter(d => {
      const dreamDate = new Date(d.recorded_at);
      return dreamDate >= prevStart && dreamDate <= prevEnd;
    });

    // Need at least 1 dream to generate report
    if (weekDreams.length === 0) return;

    // Generate report
    set({ isGenerating: true, error: null });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Calculate aggregated data
      const themeCounts: Record<string, number> = {};
      const symbolCounts: Record<string, number> = {};

      weekDreams.forEach(dream => {
        dream.themes.forEach(t => {
          themeCounts[t] = (themeCounts[t] || 0) + 1;
        });
        dream.symbols.forEach(s => {
          symbolCounts[s.symbol] = (symbolCounts[s.symbol] || 0) + 1;
        });
      });

      const top_themes = Object.entries(themeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([theme, count]) => ({ theme, count }));

      const key_symbols = Object.entries(symbolCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([symbol, count]) => ({ symbol, count }));

      // Get AI-generated insights
      const aiResponse = await generateWeeklyReportInsight(weekDreams);

      // Aggregate Jungian data
      const jungianAgg = aggregateJungianAnalysis(weekDreams);

      const reportData: WeeklyReportInsert = {
        user_id: user.id,
        week_start: prevWeekKey,
        week_end: formatDateKey(prevEnd),
        dream_count: weekDreams.length,
        top_themes,
        emotional_journey: aiResponse.emotional_journey,
        key_symbols,
        jungian_summary: {
          // Map to remove avgConfidence for storage
          dominant_archetypes: jungianAgg.dominant_archetypes.map(a => ({
            archetype: a.archetype,
            count: a.count,
          })),
          shadow_work_themes: jungianAgg.shadow_themes,
        },
        ai_insight: aiResponse.ai_insight,
      };

      const { data, error } = await supabase
        .from('weekly_reports')
        .insert(reportData)
        .select()
        .single();

      if (error) throw error;

      const newReport = data as WeeklyReport;
      set(state => ({
        reports: [newReport, ...state.reports],
      }));
    } catch (error) {
      console.error('Failed to generate weekly report:', error);
      set({ error: 'Failed to generate weekly report' });
    } finally {
      set({ isGenerating: false });
    }
  },
}));
