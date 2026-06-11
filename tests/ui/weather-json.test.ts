import { describe, it, expect } from 'bun:test'
import { parseWttrJson } from '../../src/adapters/weather.ts'

const SAMPLE = JSON.stringify({
  nearest_area: [{ areaName: [{ value: 'Bilbao' }] }],
  current_condition: [{ temp_C: '13', weatherDesc: [{ value: 'Partly cloudy' }] }],
  weather: [
    {
      date: '2026-06-11',
      maxtempC: '18',
      mintempC: '11',
      hourly: [{}, {}, {}, {}, { weatherDesc: [{ value: 'Sunny' }] }],
    },
    {
      date: '2026-06-12',
      maxtempC: '20',
      mintempC: '12',
      hourly: [{}, {}, {}, {}, { weatherDesc: [{ value: 'Rain' }] }],
    },
  ],
})

describe('parseWttrJson', () => {
  it('parses the current conditions', () => {
    const w = parseWttrJson(SAMPLE)
    expect(w?.location).toBe('Bilbao')
    expect(w?.temperature).toBe('13°C')
    expect(w?.condition).toBe('Partly cloudy')
  })

  it('parses the multi-day forecast', () => {
    const w = parseWttrJson(SAMPLE)
    expect(w?.forecast.length).toBe(2)
    expect(w?.forecast[0].max).toBe('18°')
    expect(w?.forecast[0].min).toBe('11°')
    expect(w?.forecast[1].condition).toBe('Rain')
  })

  it('returns null for malformed JSON', () => {
    expect(parseWttrJson('not json')).toBeNull()
    expect(parseWttrJson('{}')).toBeNull()
  })
})
