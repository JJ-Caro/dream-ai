# Dream AI

A modern React Native/Expo mobile application for dream journaling and AI-powered dream analysis. Record your dreams through voice or text, receive intelligent interpretations, and discover patterns in your subconscious mind.

## Features

- **Voice Recording** - Record dreams using voice input with automatic speech-to-text transcription
- **AI Dream Analysis** - Get intelligent dream interpretations powered by Google Gemini AI
- **Dream Journal** - Browse and search your complete dream history
- **Pattern Recognition** - Discover recurring themes, symbols, and patterns across your dreams
- **AI Chat** - Engage in conversations about your dreams with an AI assistant
- **Text-to-Speech** - Listen to your dream analysis read aloud
- **Push Notifications** - Receive reminders to record your dreams
- **Weekly Reports** - Get weekly insights and summaries of your dream patterns
- **Cross-Platform** - Works on iOS, Android, and Web

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Expo](https://expo.dev/) | React Native development framework |
| [React Native](https://reactnative.dev/) | Cross-platform mobile development |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe JavaScript |
| [Supabase](https://supabase.com/) | Backend (authentication & database) |
| [Google Gemini AI](https://ai.google.dev/) | Dream analysis and interpretation |
| [OpenAI](https://openai.com/) | Speech-to-text transcription |
| [NativeWind](https://www.nativewind.dev/) | TailwindCSS for React Native |
| [Zustand](https://zustand-demo.pmnd.rs/) | State management |
| [Expo Router](https://docs.expo.dev/router/introduction/) | File-based routing |

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.0 or higher
- **npm** or **yarn** package manager
- **Expo CLI** - Install globally: `npm install -g expo-cli`
- **EAS CLI** - Install globally: `npm install -g eas-cli`
- **Expo Go** app (for mobile testing) - Available on [iOS App Store](https://apps.apple.com/app/expo-go/id982107779) and [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Services
EXPO_PUBLIC_GEMINI_API_KEY=your_google_gemini_api_key
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key
```

### Obtaining API Keys

1. **Supabase**: Create a project at [supabase.com](https://supabase.com) and find your URL and anon key in Project Settings > API
2. **Google Gemini**: Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
3. **OpenAI**: Create an API key at [platform.openai.com](https://platform.openai.com/api-keys)

## Getting Started

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/dream-ai.git
   cd dream-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual API keys
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

### Running on Different Platforms

```bash
# Web (default, runs on port 5000)
npm run dev

# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Start Expo development server
npm start
```

## Database Setup

Dream AI uses Supabase as its backend. Follow these steps to set up your database:

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned

### 2. Set Up Database Tables

Run the following SQL in your Supabase SQL Editor to create the required tables:

```sql
-- Dreams table
CREATE TABLE dreams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  analysis TEXT,
  mood TEXT,
  themes TEXT[],
  symbols TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Enable Row Level Security (RLS)

```sql
-- Enable RLS on dreams table
ALTER TABLE dreams ENABLE ROW LEVEL SECURITY;

-- Users can only access their own dreams
CREATE POLICY "Users can view own dreams" ON dreams
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dreams" ON dreams
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dreams" ON dreams
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own dreams" ON dreams
  FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### 4. Enable Authentication

In your Supabase dashboard, go to Authentication > Providers and enable your preferred authentication methods (Email, Google, Apple, etc.).

## Deployment

Dream AI uses Expo Application Services (EAS) for building and deploying to app stores.

### Initial Setup

1. **Login to EAS**
   ```bash
   eas login
   ```

2. **Configure your project**
   ```bash
   eas build:configure
   ```

3. **Update `eas.json`** with your project settings

### Building for Production

```bash
# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Build for both platforms
eas build --platform all --profile production
```

### Submitting to App Stores

```bash
# Submit to Apple App Store
eas submit --platform ios

# Submit to Google Play Store
eas submit --platform android
```

### Web Deployment

For web deployment, build the static output:

```bash
npx expo export --platform web
```

The output in the `dist` folder can be deployed to any static hosting service (Vercel, Netlify, etc.).

## Project Structure

```
dream-ai/
├── app/                        # Expo Router screens
│   ├── (tabs)/                 # Tab navigation screens
│   │   ├── _layout.tsx         # Tab navigator configuration
│   │   ├── index.tsx           # Record tab (home)
│   │   ├── dreams.tsx          # Dreams list/journal
│   │   ├── patterns.tsx        # Insights and patterns
│   │   └── settings.tsx        # User settings
│   ├── dream/
│   │   └── [id].tsx            # Dream detail view
│   ├── _layout.tsx             # Root layout
│   ├── about-you.tsx           # User profile setup
│   └── chat.tsx                # AI chat interface
├── assets/
│   ├── fonts/                  # Custom fonts
│   └── images/                 # App icons and images
├── components/
│   └── ui/                     # Reusable UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── GlassCard.tsx
│       └── ...
├── constants/
│   ├── colors.ts               # Color palette
│   └── prompts.ts              # AI prompt templates
├── lib/
│   ├── supabase.ts             # Supabase client configuration
│   ├── gemini.ts               # Google Gemini AI integration
│   ├── speech.ts               # Text-to-speech functionality
│   ├── audio.ts                # Audio recording utilities
│   ├── deepAnalysis.ts         # Dream analysis logic
│   ├── haptics.ts              # Haptic feedback
│   ├── notifications.ts        # Push notifications
│   ├── storage.ts              # Local storage utilities
│   └── streak.ts               # Dream journaling streak tracking
├── stores/
│   ├── authStore.ts            # Authentication state
│   ├── chatStore.ts            # Chat/conversation state
│   ├── dreamsStore.ts          # Dreams data state
│   ├── recordingStore.ts       # Audio recording state
│   ├── userContextStore.ts     # User preferences state
│   └── weeklyReportsStore.ts   # Weekly reports state
├── types/
│   └── dream.ts                # TypeScript type definitions
├── app.json                    # Expo configuration
├── eas.json                    # EAS Build configuration
├── tailwind.config.js          # TailwindCSS configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies and scripts
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository** and create your branch from `main`
2. **Install dependencies** and ensure the app runs locally
3. **Make your changes** following the existing code style
4. **Test your changes** on multiple platforms (iOS, Android, Web)
5. **Write meaningful commit messages**
6. **Submit a pull request** with a clear description of your changes

### Code Style

- Use TypeScript for all new code
- Follow the existing component patterns
- Use NativeWind/TailwindCSS for styling
- Keep components small and focused
- Add proper TypeScript types

### Reporting Issues

When reporting issues, please include:
- Device/platform information
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

## License

This project is licensed under the [MIT License](LICENSE).

---

Built with ❤️ using Expo and React Native
