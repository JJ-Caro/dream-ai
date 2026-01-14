# Dream AI

A React Native/Expo mobile app for dream journaling and analysis using AI.

## Overview

Dream AI is a dream journaling application that allows users to record their dreams via voice, get AI-powered analysis, and track patterns over time.

## Tech Stack

- **Framework**: Expo (React Native) with web support
- **Language**: TypeScript
- **Styling**: NativeWind (TailwindCSS for React Native)
- **State Management**: Zustand
- **Backend**: Supabase (authentication, database)
- **AI**: Google Gemini (dream analysis), OpenAI (speech-to-text)

## Project Structure

```
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Record tab
│   │   ├── dreams.tsx     # Dreams list
│   │   ├── patterns.tsx   # Insights/patterns
│   │   └── settings.tsx   # Settings
│   ├── dream/[id].tsx     # Dream detail view
│   ├── chat.tsx           # AI chat
│   └── about-you.tsx      # User profile
├── components/            # Reusable components
├── constants/             # Colors, prompts, etc.
├── lib/                   # Utility libraries
│   ├── supabase.ts       # Supabase client
│   ├── gemini.ts         # Gemini AI integration
│   ├── speech.ts         # OpenAI TTS
│   └── ...
├── stores/                # Zustand state stores
└── types/                 # TypeScript types
```

## Environment Variables Required

- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `EXPO_PUBLIC_OPENAI_API_KEY` - OpenAI API key (for TTS)
- `EXPO_PUBLIC_GEMINI_API_KEY` - Google Gemini API key

## Running the App

The app runs on port 5000 in web mode:

```bash
npm run dev
```

## Deployment

The app uses Expo's static web output and can be deployed as a static site.
