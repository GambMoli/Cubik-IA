import { createTheme } from '@mui/material/styles'

export type AppThemeMode = 'light' | 'dark'

export const scholarPalette = {
  light: {
    primary: '#1547A1',
    primaryStrong: '#123A84',
    primarySoft: '#E8F0FF',
    background: '#FFFFFF',
    backgroundAlt: '#F8F9FA',
    surface: '#F3F4F5',
    text: '#191C1D',
    textMuted: '#434652',
    success: '#2E7D32',
    error: '#D32F2F',
    border: '#D7DEE7',
    divider: '#E6EAEE',
    shadow: '0 8px 24px rgba(21, 71, 161, 0.08)',
  },
  dark: {
    primary: '#3B82F6',
    primaryStrong: '#60A5FA',
    primarySoft: '#172554',
    background: '#0F172A',
    backgroundAlt: '#111C34',
    surface: '#1E293B',
    text: '#F8FAFC',
    textMuted: '#CBD5E1',
    success: '#4ADE80',
    error: '#F87171',
    border: '#334155',
    divider: '#263244',
    shadow: 'none',
  },
} as const

const bodyFont = ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'].join(',')
const headingFont = ['Manrope', 'Inter', 'sans-serif'].join(',')
const monoFont = ['JetBrains Mono', 'Consolas', 'monospace'].join(',')

const headingStyle = {
  fontFamily: headingFont,
  fontWeight: 800,
  letterSpacing: '-0.02em',
}

export function createAppTheme(mode: AppThemeMode) {
  const colors = scholarPalette[mode]
  const isDark = mode === 'dark'

  return createTheme({
    palette: {
      mode,
      primary: {
        main: colors.primary,
        dark: colors.primaryStrong,
        light: colors.primarySoft,
      },
      background: {
        default: colors.backgroundAlt,
        paper: colors.background,
      },
      text: {
        primary: colors.text,
        secondary: colors.textMuted,
      },
      success: { main: colors.success },
      error: { main: colors.error },
      divider: colors.divider,
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily: bodyFont,
      h1: headingStyle,
      h2: headingStyle,
      h3: headingStyle,
      h4: headingStyle,
      h5: headingStyle,
      h6: headingStyle,
      subtitle1: { fontWeight: 700 },
      button: { fontWeight: 700, textTransform: 'none' },
      body2: { lineHeight: 1.6 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ':root': {
            colorScheme: mode,
          },
          body: {
            backgroundColor: colors.backgroundAlt,
            color: colors.text,
          },
          '*::selection': {
            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.35)' : 'rgba(21, 71, 161, 0.16)',
          },
          'code, pre, kbd, samp': {
            fontFamily: monoFont,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            boxShadow: colors.shadow,
            border: `1px solid ${colors.border}`,
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            minHeight: 44,
            borderRadius: 8,
            paddingInline: 18,
          },
        },
        variants: [
          {
            props: { variant: 'contained', color: 'primary' },
            style: {
              '&:hover': {
                backgroundColor: colors.primaryStrong,
              },
            },
          },
        ],
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: 8,
            fontSize: '0.75rem',
          },
        },
      },
    },
  })
}
