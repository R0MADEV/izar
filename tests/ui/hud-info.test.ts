import { describe, it, expect } from 'bun:test'
import { formatClock } from '../../src/ui/hud-info.ts'
import { parseWttr, conditionIcon } from '../../src/adapters/weather.ts'

describe('formatClock', () => {
  it('formats time as HH:MM', () => {
    const date = new Date('2026-06-11T14:32:05')
    expect(formatClock(date).time).toBe('14:32')
  })

  it('formats the date in Spanish (day, number, month)', () => {
    const date = new Date('2026-06-11T14:32:05')
    const { date: dateStr } = formatClock(date)
    expect(dateStr.toLowerCase()).toContain('jun')
    expect(dateStr).toContain('11')
  })
})

describe('parseWttr', () => {
  it('parses a location|temp|condition response', () => {
    const w = parseWttr('Bilbao|+13°C|Partly cloudy')
    expect(w?.location).toBe('Bilbao')
    expect(w?.temperature).toBe('+13°C')
    expect(w?.condition).toBe('Partly cloudy')
  })

  it('shortens a long location to just the city', () => {
    const w = parseWttr('Bilbao, Basque Country, ES|+13°C|Cloudy')
    expect(w?.location).toBe('Bilbao')
  })

  it('returns null for malformed input', () => {
    expect(parseWttr('')).toBeNull()
    expect(parseWttr('garbage')).toBeNull()
  })

  it('assigns an icon based on the condition', () => {
    const sunny = parseWttr('X|+20°C|Sunny')
    expect(sunny?.icon.length).toBeGreaterThan(0)
  })
})

describe('conditionIcon', () => {
  it('maps clear/sunny to a sun', () => {
    expect(conditionIcon('Sunny')).toBe('☀')
    expect(conditionIcon('Clear')).toBe('☀')
  })

  it('maps rain to a rain icon', () => {
    expect(conditionIcon('Light rain')).toBe('🌧')
  })

  it('falls back to a cloud for unknown conditions', () => {
    expect(conditionIcon('Whatever')).toBe('☁')
  })
})
