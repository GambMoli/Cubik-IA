import { describe, expect, it } from 'vitest'

import { createAppTheme, scholarPalette } from './theme'

function luminance(hex: string) {
  const channels = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrast(foreground: string, background: string) {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (lighter + 0.05) / (darker + 0.05)
}

describe('createAppTheme', () => {
  it('uses the light palette for light mode', () => {
    const theme = createAppTheme('light')

    expect(theme.palette.mode).toBe('light')
    expect(theme.palette.primary.main).toBe(scholarPalette.light.primary)
    expect(theme.palette.background.paper).toBe(scholarPalette.light.background)
    expect(theme.palette.divider).toBe(scholarPalette.light.divider)
  })

  it('uses the dark palette for dark mode', () => {
    const theme = createAppTheme('dark')

    expect(theme.palette.mode).toBe('dark')
    expect(theme.palette.primary.main).toBe(scholarPalette.dark.primary)
    expect(theme.palette.background.paper).toBe(scholarPalette.dark.background)
    expect(theme.palette.divider).toBe(scholarPalette.dark.divider)
  })

  it.each(['light', 'dark'] as const)('separates page and container surfaces in %s mode', (mode) => {
    const theme = createAppTheme(mode)

    expect(theme.palette.background.default).not.toBe(theme.palette.background.paper)
  })

  it('gives Paper a 1px border in both modes', () => {
    for (const mode of ['light', 'dark'] as const) {
      const paper = createAppTheme(mode).components?.MuiPaper?.styleOverrides?.root as { border?: string }

      expect(paper.border).toBe(`1px solid ${scholarPalette[mode].border}`)
    }
  })

  it('removes the Paper shadow in dark mode', () => {
    const paper = createAppTheme('dark').components?.MuiPaper?.styleOverrides?.root as { boxShadow?: string }

    expect(paper.boxShadow).toBe('none')
  })

  it.each(['light', 'dark'] as const)('keeps text readable on every surface in %s mode', (mode) => {
    const colors = scholarPalette[mode]

    for (const background of [colors.background, colors.backgroundAlt, colors.surface]) {
      expect(contrast(colors.text, background)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(colors.textMuted, background)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('uses Inter for body text, Manrope for headings and a monospace font for code', () => {
    const theme = createAppTheme('light')

    expect(theme.typography.fontFamily).toMatch(/^Inter,/)
    expect(theme.typography.h1.fontFamily).toMatch(/^Manrope,/)
    const baseline = theme.components?.MuiCssBaseline?.styleOverrides as Record<string, Record<string, string>>
    expect(baseline['code, pre, kbd, samp'].fontFamily).toMatch(/^JetBrains Mono,/)
  })
})
