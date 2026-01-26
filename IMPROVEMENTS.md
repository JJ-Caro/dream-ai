# Dream AI — Improvement & Vulnerability Analysis

**Reviewed by:** Alf (AI Executive Assistant)  
**Date:** January 25, 2026  
**Repo:** JJ-Caro/dream-ai

---

## Executive Summary

Dream AI is a **solid, well-architected** React Native app for Jungian dream analysis. The prompts are thoughtful, the UX flow makes sense, and the tech stack is modern. Below are vulnerabilities to fix and ideas to make it even better.

---

## 🔴 Security Vulnerabilities

### 1. API Keys Exposed in Client Bundle
**Severity: HIGH**

```typescript
// Current: Keys are in client-side code
const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY!);
```

**Problem:** `EXPO_PUBLIC_*` variables are bundled into the client app and can be extracted from the APK/IPA.

**Fix:** Route all AI calls through your Supabase Edge Functions:

```typescript
// lib/gemini.ts - Updated
export async function analyzeDreamAudio(audioUri: string) {
  const { data, error } = await supabase.functions.invoke('analyze-dream', {
    body: { audioBase64, mimeType }
  });
  return data;
}
```

```typescript
// supabase/functions/analyze-dream/index.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);

Deno.serve(async (req) => {
  // Verify user is authenticated
  const authHeader = req.headers.get('Authorization');
  // ... validate JWT
  
  const { audioBase64, mimeType } = await req.json();
  // ... call Gemini
  return new Response(JSON.stringify(result));
});
```

### 2. No Rate Limiting
**Severity: MEDIUM**

A malicious user could spam the AI endpoints and rack up your Gemini/OpenAI bills.

**Fix:** Add rate limiting in Supabase Edge Functions:
```typescript
// Simple in-memory rate limit (use Redis for production)
const rateLimits = new Map<string, number[]>();

function checkRateLimit(userId: string, limit = 20, windowMs = 60000) {
  const now = Date.now();
  const userCalls = rateLimits.get(userId) || [];
  const recentCalls = userCalls.filter(t => now - t < windowMs);
  
  if (recentCalls.length >= limit) {
    throw new Error('Rate limit exceeded');
  }
  
  recentCalls.push(now);
  rateLimits.set(userId, recentCalls);
}
```

### 3. No Input Sanitization
**Severity: LOW**

Dream narratives are sent directly to AI without sanitization. Unlikely to be exploited, but good hygiene.

**Fix:** Basic sanitization before AI calls:
```typescript
function sanitizeInput(text: string): string {
  return text
    .slice(0, 10000) // Limit length
    .replace(/[<>]/g, '') // Remove potential HTML
    .trim();
}
```

---

## 🟡 Jungian Analysis Improvements

### 1. Expand Archetype Coverage

**Current archetypes:** Shadow, Anima/Animus, Self, Persona, Hero

**Missing archetypes to add:**
- **Mother** (Great Mother, Devouring Mother)
- **Father** (Wise Old Man, Terrible Father)
- **Child** (Divine Child, Eternal Youth, Wounded Child)
- **Trickster** (Shapeshifter, Boundary-crosser)
- **Sage/Senex** (Wisdom, knowledge)
- **Maiden/Kore** (Innocence, potential)

**Update to prompts.ts:**
```typescript
ARCHETYPE QUICK REFERENCE:
- SHADOW: Antagonists, monsters, being chased, dark figures
- HERO: Quests, battles, transformation, finding treasures
- ANIMA/ANIMUS: Mysterious opposite-gender figures, soul guides
- PERSONA: Clothing, masks, public performances, being judged
- SELF: Mandalas, wise elders, divine imagery, wholeness
- MOTHER: Nurturing figures, nature, containers, caves, the sea
- FATHER: Authority figures, sky, order, judgment, protection
- CHILD: Children, small animals, new beginnings, vulnerability
- TRICKSTER: Shapeshifters, jesters, chaos, boundary violations
```

### 2. Add Personal Symbol Dictionary

Dreams use personal symbols that differ from universal ones. Build a learning system:

```typescript
// New table: user_symbols
CREATE TABLE user_symbols (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  symbol TEXT NOT NULL,
  personal_meaning TEXT,
  occurrences INTEGER DEFAULT 1,
  first_seen TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP DEFAULT NOW()
);

// Track symbols across dreams
// "For you, water consistently appears with anxiety - 
//  this differs from the universal meaning of the unconscious"
```

### 3. Active Imagination Guidance

Add a feature for Jungian "active imagination" — consciously dialoguing with dream figures:

```typescript
// New prompt for active imagination sessions
export const ACTIVE_IMAGINATION_PROMPT = `Guide the user through active imagination with a dream figure.

1. Have them visualize the figure clearly
2. Ask them to notice how the figure feels/appears
3. Encourage them to ask the figure a question
4. Help them stay with whatever arises
5. Don't interpret - let the unconscious speak

Keep responses short. This is their inner work, not yours.`;
```

### 4. Dream Incubation

Help users "incubate" dreams on specific topics:

```typescript
// New feature: Dream Incubation
interface DreamIncubation {
  id: string;
  user_id: string;
  question: string; // "What should I do about my career?"
  incubation_date: string;
  resulting_dream_id?: string;
  reflection?: string;
}

// Evening prompt: "Focus on this question as you fall asleep..."
// Morning prompt: "Did you dream about your question?"
```

---

## 🟢 Feature Ideas

### 1. Sleep Data Integration
Connect to Apple HealthKit / Google Fit:
- Correlate dream vividness with sleep quality
- Track which sleep stages produce most memorable dreams
- Show patterns (e.g., "Your shadow dreams happen on poor sleep nights")

```typescript
// expo-health-kit integration
import * as HealthKit from 'expo-health-kit';

async function getSleepData(date: Date) {
  const sleep = await HealthKit.querySleepAnalysis({
    startDate: startOfDay(date),
    endDate: endOfDay(date),
  });
  return sleep;
}
```

### 2. Lucid Dreaming Features
- Reality check reminders throughout the day
- Dream sign identification (recurring elements that could trigger lucidity)
- Lucid dream journaling with specific fields
- MILD/WILD technique guides

### 3. Synchronicity Tracker
Jung's concept of meaningful coincidences:
- Log synchronicities alongside dreams
- AI identifies potential connections
- "Your dream about birds preceded seeing three unusual bird encounters this week"

### 4. Anonymous Dream Sharing
Community features (optional):
- Share dreams anonymously
- See how others interpreted similar symbols
- "47 other dreamers had flying dreams this week"

### 5. Dream Calendar View
Visual calendar showing:
- Dreams per day (color intensity)
- Dominant archetypes (color coding)
- Emotional patterns over time
- Moon phases correlation

---

## 🔧 Technical Improvements

### 1. Offline Mode
Dreams should be recordable offline:

```typescript
// stores/offlineStore.ts
interface PendingDream {
  id: string;
  audioUri: string;
  recordedAt: string;
  synced: boolean;
}

// Queue dreams when offline
export const useOfflineStore = create<OfflineState>((set, get) => ({
  pendingDreams: [],
  
  addPendingDream: (dream) => {
    set({ pendingDreams: [...get().pendingDreams, dream] });
    // Attempt sync when back online
  },
  
  syncPendingDreams: async () => {
    // Called when connectivity restored
  }
}));
```

### 2. Better Error Boundaries

```typescript
// components/ErrorBoundary.tsx
class DreamErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      return <DreamErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### 3. Analytics Integration
Track user engagement (privacy-respecting):

```typescript
// lib/analytics.ts
import * as Amplitude from '@amplitude/analytics-react-native';

export function trackDreamRecorded(metadata: {
  durationSeconds: number;
  hasAudio: boolean;
  archetype?: string;
}) {
  Amplitude.track('Dream Recorded', metadata);
}
```

### 4. Performance: Lazy Load Analysis

Don't generate deep analysis on every dream immediately:

```typescript
// Only trigger deep analysis when user views the dream
// or after N dreams (for patterns)
export async function getDeepAnalysis(dreamId: string) {
  const dream = await getDream(dreamId);
  
  if (!dream.deep_analysis) {
    // Generate on-demand
    return await generateDeepAnalysis(dream);
  }
  
  return dream.deep_analysis;
}
```

---

## 📱 UX Improvements

### 1. Onboarding Flow
Add a brief Jungian primer:
- What are archetypes?
- Why journal dreams?
- How to use the app effectively

### 2. Morning Notification
Smart notification in the morning:
- "Did you dream last night?"
- Time it based on when user typically wakes (learn from usage)

### 3. Voice Journaling Improvements
- Background recording (start before fully awake)
- Whisper mode (for not waking partner)
- Pause/resume mid-recording

### 4. Dream Detail Page
Add:
- Related dreams (by symbol/theme)
- "Dreams from this time last year"
- Share to therapist (encrypted export)

---

## 🚀 Recommended Priority

### Immediate (This Week)
1. ⚠️ Move API keys to Supabase Edge Functions
2. ⚠️ Add basic rate limiting
3. Add offline dream queuing

### Short-term (Next 2 Weeks)
1. Personal symbol dictionary
2. Expand archetype coverage
3. Dream calendar view
4. Better error handling

### Medium-term (Next Month)
1. Active imagination feature
2. Sleep data integration
3. Lucid dreaming tools
4. Anonymous community sharing

---

## Summary

Dream AI is already impressive — the Jungian prompts show real understanding of the framework. The main priorities are:

1. **Security:** Get those API keys out of the client
2. **Depth:** More archetypes + personal symbol learning
3. **Engagement:** Lucid dreaming, active imagination, dream incubation

Happy to help implement any of these. Which direction interests you most?

---

*Analysis by Alf | January 25, 2026*
