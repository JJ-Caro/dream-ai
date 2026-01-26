# Dream AI — Automated Development Plan

**Created:** January 26, 2026
**Goal:** Fully automate mobile app development using Claude Code task system + agent swarms

---

## The Vision

Instead of manually coding features one by one, we:
1. Define what we want in plain English
2. Break it into a dependency graph
3. Spawn parallel sub-agents to build it
4. Ship in hours, not days

---

## Phase 1: Development Environment Setup

### 1.1 Claude Code Task Persistence
```bash
# Add to shell profile
export CLAUDE_CODE_TASK_LIST_ID="dream-ai"
```

Tasks persist across sessions at `~/.claude/tasks/dream-ai/`

### 1.2 Project Context Files
Create files that every sub-agent reads:

```
dream-ai/
├── CLAUDE.md              # Project context for all agents
├── .cursor/               # Cursor rules if using Cursor
│   └── rules.md
└── docs/
    ├── ARCHITECTURE.md    # How the app is structured
    ├── STYLE_GUIDE.md     # Code conventions
    └── API_CONTRACTS.md   # Supabase function signatures
```

**CLAUDE.md contents:**
- Tech stack (Expo 54, NativeWind, Supabase, Gemini)
- File structure conventions
- Testing requirements
- What NOT to touch (auth, existing user data)

---

## Phase 2: Task Decomposition Patterns

### Pattern A: Feature Addition

When adding a new feature, break into:

```
Feature: Dream Calendar View
├── [1] Design data model (calendar entries)
├── [2] Create Zustand store slice → blockedBy: [1]
├── [3] Build calendar component UI → blockedBy: [1]
├── [4] Wire store to component → blockedBy: [2, 3]
├── [5] Add navigation/routing → blockedBy: [4]
└── [6] Write tests → blockedBy: [4]
```

Sub-agents 2 and 3 run **in parallel** (independent).
Sub-agent 4 waits for both to complete.

### Pattern B: Refactor/Migration

```
Task: Move API keys to Edge Functions
├── [1] Create Supabase Edge Function scaffold
├── [2] Implement analyze-dream function → blockedBy: [1]
├── [3] Implement follow-up function → blockedBy: [1]
├── [4] Update lib/gemini.ts to call functions → blockedBy: [2, 3]
├── [5] Remove EXPO_PUBLIC_GEMINI_API_KEY → blockedBy: [4]
└── [6] Test end-to-end → blockedBy: [5]
```

### Pattern C: UI Overhaul (Onboarding)

```
Task: Build Conversion-Optimized Onboarding
├── [1] Research competitor onboarding (Calm, Headspace)
├── [2] Design screen flow (5-7 screens)
├── [3] Screen 1: Welcome + value prop → blockedBy: [2]
├── [4] Screen 2: Problem awareness → blockedBy: [2]
├── [5] Screen 3: Personalization quiz → blockedBy: [2]
├── [6] Screen 4: Feature preview → blockedBy: [2]
├── [7] Screen 5: Social proof → blockedBy: [2]
├── [8] Paywall screen → blockedBy: [2]
├── [9] Navigation controller → blockedBy: [3-8]
└── [10] A/B test setup → blockedBy: [9]
```

Screens 3-8 build **in parallel** once design is done.

---

## Phase 3: Concrete Implementation Tasks

### Sprint 1: Security (Must-Do Before Launch)

**Task Graph:**
```json
{
  "tasks": [
    {"id": "1", "subject": "Create supabase/functions/analyze-dream Edge Function", "status": "pending"},
    {"id": "2", "subject": "Create supabase/functions/followup-analysis Edge Function", "status": "pending"},
    {"id": "3", "subject": "Add rate limiting middleware to Edge Functions", "blockedBy": ["1", "2"]},
    {"id": "4", "subject": "Refactor lib/gemini.ts to use Edge Functions", "blockedBy": ["1", "2"]},
    {"id": "5", "subject": "Remove EXPO_PUBLIC_GEMINI_API_KEY from .env", "blockedBy": ["4"]},
    {"id": "6", "subject": "Add input sanitization to Edge Functions", "blockedBy": ["1", "2"]},
    {"id": "7", "subject": "Integration test: record dream → analysis", "blockedBy": ["4", "5"]}
  ]
}
```

**Parallelization:** Tasks 1, 2 run in parallel. Tasks 3, 4, 6 run in parallel after.

### Sprint 2: Onboarding (Revenue Critical)

```json
{
  "tasks": [
    {"id": "1", "subject": "Analyze top 3 competitor onboarding flows (screenshots + notes)"},
    {"id": "2", "subject": "Create onboarding screen designs in Figma/code", "blockedBy": ["1"]},
    {"id": "3", "subject": "Build WelcomeScreen component", "blockedBy": ["2"]},
    {"id": "4", "subject": "Build ProblemAwarenessScreen component", "blockedBy": ["2"]},
    {"id": "5", "subject": "Build PersonalizationScreen component", "blockedBy": ["2"]},
    {"id": "6", "subject": "Build FeaturePreviewScreen component", "blockedBy": ["2"]},
    {"id": "7", "subject": "Build SocialProofScreen component", "blockedBy": ["2"]},
    {"id": "8", "subject": "Integrate Superwall/RevenueCat paywall", "blockedBy": ["2"]},
    {"id": "9", "subject": "Build OnboardingNavigator with progress indicator", "blockedBy": ["3","4","5","6","7","8"]},
    {"id": "10", "subject": "Add skip logic and deep linking", "blockedBy": ["9"]},
    {"id": "11", "subject": "Analytics: track onboarding funnel", "blockedBy": ["9"]}
  ]
}
```

**Parallelization:** 6 screen components build simultaneously.

### Sprint 3: Feature Expansion

```json
{
  "tasks": [
    {"id": "1", "subject": "Add Dream Calendar view with react-native-calendars"},
    {"id": "2", "subject": "Implement Personal Symbol Dictionary table + UI"},
    {"id": "3", "subject": "Add archetype color coding to dream cards"},
    {"id": "4", "subject": "Build offline dream queue with pending sync indicator"},
    {"id": "5", "subject": "Add morning notification with expo-notifications"},
    {"id": "6", "subject": "Implement dream search by keyword/symbol"}
  ]
}
```

All 6 features are **independent** — maximum parallelization.

---

## Phase 4: Automation Scripts

### 4.1 Feature Request → Task Graph Generator

Create a script that takes a feature description and outputs task JSON:

```typescript
// scripts/plan-feature.ts
import Anthropic from '@anthropic-ai/sdk';

async function planFeature(description: string) {
  const response = await claude.messages.create({
    model: 'claude-sonnet-4-20250514',
    messages: [{
      role: 'user',
      content: `Given this React Native Expo project structure and feature request, 
      output a task dependency graph in JSON format.
      
      Project: Dream AI (Jungian dream journal)
      Stack: Expo 54, NativeWind, Supabase, Zustand
      
      Feature: ${description}
      
      Output format:
      {
        "tasks": [
          {"id": "1", "subject": "...", "blockedBy": []},
          ...
        ]
      }
      
      Rules:
      - Break into smallest atomic tasks
      - Identify parallel opportunities
      - Include tests as final tasks`
    }]
  });
  
  return JSON.parse(response.content[0].text);
}
```

### 4.2 Task Executor

```bash
# Run from project root
claude --task-list dream-ai "Execute all pending tasks. For each task, create a new sub-agent. Run independent tasks in parallel."
```

### 4.3 PR Generator

Each completed task group → auto-generate PR:
- Conventional commit messages
- Link task IDs
- Auto-request review

---

## Phase 5: Quality Gates

### Pre-Merge Checks (Automated)
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] ESLint passes (`npx eslint .`)
- [ ] Tests pass (`npm test`)
- [ ] Expo builds (`eas build --platform ios --profile preview --local`)

### Human Checkpoints
- [ ] Review UI changes visually (screenshot diff)
- [ ] Test on physical device before App Store submit
- [ ] Approve any external API integrations

---

## Phase 6: Full Automation Loop

```
┌─────────────────────────────────────────────────────────────┐
│  1. Human: "Add dream sharing to Twitter"                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Claude: Generate task graph with dependencies           │
│     - Research Twitter API requirements                     │
│     - Create ShareService                                   │
│     - Build ShareSheet UI                                   │
│     - Add share button to DreamDetail                       │
│     - Test flow                                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Claude: Spawn sub-agents for independent tasks          │
│     Agent A: Research (Haiku)                               │
│     Agent B: ShareService (Sonnet)                          │
│     Agent C: ShareSheet UI (Sonnet)                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Dependencies unblock → next wave of agents              │
│     Agent D: Wire button (depends on B, C)                  │
│     Agent E: Tests (depends on D)                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  5. All tasks complete → Auto PR → Human review             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  6. Merge → EAS Build → TestFlight                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Immediate Next Steps

### Today
1. [x] Create this plan
2. [ ] Set `CLAUDE_CODE_TASK_LIST_ID=dream-ai` in shell
3. [ ] Create `CLAUDE.md` project context file
4. [ ] Test task system with Sprint 1 (security fixes)

### This Week
1. [ ] Complete Sprint 1 (security)
2. [ ] Start Sprint 2 (onboarding) with parallel agents
3. [ ] Set up EAS Build for automated preview builds

### Validation
- Time a manual feature implementation
- Time the same scope with task system
- Target: 3-5x faster with higher consistency

---

## Notes

**Cost consideration:** Parallel agents burn credits fast. For Dream AI:
- Use Haiku for research/simple tasks
- Use Sonnet for implementation
- Reserve Opus for complex architecture decisions

**Context files are critical:** Sub-agents don't share memory. Everything they need must be in project files (CLAUDE.md, ARCHITECTURE.md, etc.)

**Human stays in the loop for:**
- Initial feature definition
- Visual review
- App Store submission
- Anything touching payments

---

*Plan by Alf | January 26, 2026*
