export const colors = {
  // Backgrounds - Deep midnight/navy theme
  background: '#0A1628',
  backgroundDark: '#060F1D',
  backgroundLight: '#0F1E36',

  // Gradient backgrounds
  gradientStart: '#0A1628',
  gradientMid: '#12203A',
  gradientEnd: '#1A1040',

  // Surface colors - Frosted glass effect bases
  surface: 'rgba(15, 30, 54, 0.8)',
  surfaceGlass: 'rgba(22, 42, 74, 0.6)',
  surfaceElevated: 'rgba(30, 50, 85, 0.7)',
  surfaceHighlight: 'rgba(45, 70, 110, 0.5)',

  // Primary - Soft teal/cyan
  primary: '#4FD1C5',
  primaryMuted: '#38A89D',
  primaryDark: '#2C8A80',
  primarySubtle: 'rgba(79, 209, 197, 0.15)',
  primaryGlow: 'rgba(79, 209, 197, 0.4)',

  // Secondary - Warm gold
  secondary: '#F6C177',
  secondaryMuted: '#D4A55A',
  secondarySubtle: 'rgba(246, 193, 119, 0.15)',
  secondaryGlow: 'rgba(246, 193, 119, 0.4)',

  // Accent - Soft purple for variety
  accent: '#A78BFA',
  accentSubtle: 'rgba(167, 139, 250, 0.15)',

  // Text - Warm whites
  textPrimary: '#F7F7F7',
  textSecondary: '#B8C5D6',
  textTertiary: '#7A8BA3',
  textMuted: '#4A5B73',

  // Semantic colors
  positive: '#4ADE80',
  positiveSubtle: 'rgba(74, 222, 128, 0.15)',
  negative: '#FB7185',
  negativeSubtle: 'rgba(251, 113, 133, 0.15)',
  warning: '#FBBF24',
  warningSubtle: 'rgba(251, 191, 36, 0.15)',

  // Borders
  border: 'rgba(79, 209, 197, 0.15)',
  borderGlass: 'rgba(255, 255, 255, 0.08)',
  borderSubtle: 'rgba(255, 255, 255, 0.04)',

  // Overlay
  overlay: 'rgba(6, 15, 29, 0.7)',
  overlayHeavy: 'rgba(6, 15, 29, 0.9)',

  // Stars/particles
  starDim: 'rgba(255, 255, 255, 0.3)',
  starBright: 'rgba(255, 255, 255, 0.8)',

  // Gradients for LinearGradient
  gradients: {
    background: ['#0A1628', '#12203A', '#1A1040'],
    backgroundAlt: ['#0A1628', '#0F1E36', '#12203A'],
    card: ['rgba(22, 42, 74, 0.6)', 'rgba(15, 30, 54, 0.8)'],
    cardHover: ['rgba(30, 50, 85, 0.7)', 'rgba(22, 42, 74, 0.6)'],
    primary: ['#4FD1C5', '#38A89D'],
    primarySoft: ['rgba(79, 209, 197, 0.8)', 'rgba(56, 168, 157, 0.6)'],
    secondary: ['#F6C177', '#D4A55A'],
    tealToPurple: ['#4FD1C5', '#A78BFA'],
    goldToTeal: ['#F6C177', '#4FD1C5'],
    recordButton: ['#4FD1C5', '#38A89D', '#2C8A80'],
    recordButtonActive: ['#FB7185', '#F43F5E', '#E11D48'],
    emotionBadge: ['rgba(79, 209, 197, 0.3)', 'rgba(99, 102, 241, 0.3)'],
    emotionHigh: ['#FB7185', '#F43F5E'],
    emotionMedium: ['#A78BFA', '#8B5CF6'],
    emotionLow: ['#4FD1C5', '#38A89D'],
    glass: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.02)'],
  },

  // Shadows with glow effects
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    },
    glow: {
      shadowColor: '#4FD1C5',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 10,
    },
    glowIntense: {
      shadowColor: '#4FD1C5',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.7,
      shadowRadius: 35,
      elevation: 15,
    },
    glowGold: {
      shadowColor: '#F6C177',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 10,
    },
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 8,
    },
  },
} as const;

export type ColorKey = keyof typeof colors;
