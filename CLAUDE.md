# CLAUDE.md — Dream AI Project Context

Read this file before making any changes to the codebase.

## What This App Does

Dream AI is a Jungian dream journal iOS app. Users:
1. Record dreams via voice or text
2. Get AI-powered analysis (archetypes, symbols, themes)
3. Track patterns over time
4. Build a personal dream dictionary

## Tech Stack

- **Framework:** Expo SDK 54 (React Native)
- **Styling:** NativeWind (Tailwind for RN)
- **Navigation:** expo-router (file-based)
- **State:** Zustand
- **Backend:** Supabase (auth, database, edge functions)
- **AI:** Google Gemini 2.0 Flash
- **Audio:** expo-av for voice recording

## File Structure

```
app/                    # expo-router pages
├── (tabs)/            # Tab navigator screens
├── dream/[id].tsx     # Dream detail page
├── record.tsx         # Recording screen
└── _layout.tsx        # Root layout

components/            # Reusable UI components
lib/                   # Business logic & API clients
├── gemini.ts         # AI analysis functions
├── supabase.ts       # Supabase client
└── prompts.ts        # Jungian analysis prompts

stores/               # Zustand state stores
├── dreamStore.ts
├── userStore.ts
└── settingsStore.ts

supabase/
├── functions/        # Edge Functions (server-side)
└── migrations/       # Database schema
```

## Code Conventions

1. **Components:** Functional components with TypeScript
2. **Styling:** Use NativeWind classes, no inline styles
3. **State:** Zustand for global, useState for local
4. **Async:** Use React Query patterns where possible
5. **Errors:** Always handle errors, show user feedback

## DO NOT

- ❌ Modify auth flow without explicit approval
- ❌ Delete user data or migration files
- ❌ Expose API keys in client code (use Edge Functions)
- ❌ Skip TypeScript types
- ❌ Install dependencies without checking bundle size

## Testing

```bash
# Type check
npx tsc --noEmit

# Lint
npx eslint . --ext .ts,.tsx

# Run on simulator
npx expo start --ios
```

## Building

```bash
# Preview build (internal testing)
eas build --platform ios --profile preview

# Production build
eas build --platform ios --profile production
```

## Current Priorities

1. **Security:** Move Gemini API calls to Edge Functions
2. **Monetization:** Add Superwall paywall with proper onboarding
3. **Engagement:** Personal symbol dictionary, dream calendar

## Useful Context

- Target audience: People interested in self-discovery, therapy-curious
- Tone: Warm, insightful, not clinical
- Jung's key concepts: Shadow, Anima/Animus, Archetypes, Collective Unconscious
- Competitor apps: Dreamwell, Capture, Day One (for journaling UX)
