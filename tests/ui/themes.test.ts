import { describe, it, expect } from 'bun:test'
import { getTheme, themeNames, DEFAULT_THEME } from '../../src/ui/themes.ts'

describe('getTheme', () => {
  it('returns the requested theme by name', () => {
    const matrix = getTheme('matrix')
    expect(matrix.name).toBe('matrix')
  })

  it('is case-insensitive', () => {
    expect(getTheme('MATRIX').name).toBe('matrix')
  })

  it('falls back to the default theme for unknown names', () => {
    expect(getTheme('nope').name).toBe(DEFAULT_THEME)
  })

  it('falls back to the default theme for empty input', () => {
    expect(getTheme('').name).toBe(DEFAULT_THEME)
  })

  it('every theme exposes the full color palette', () => {
    for (const name of themeNames) {
      const t = getTheme(name)
      expect(typeof t.primary).toBe('string')
      expect(typeof t.accent).toBe('string')
      expect(typeof t.dim).toBe('string')
      expect(typeof t.text).toBe('string')
      expect(typeof t.user).toBe('string')
      expect(typeof t.success).toBe('string')
      expect(typeof t.error).toBe('string')
      expect(Array.isArray(t.gradient)).toBe(true)
      expect(t.gradient.length).toBe(2)
    }
  })

  it('lists at least four themes', () => {
    expect(themeNames.length).toBeGreaterThanOrEqual(4)
  })
})
