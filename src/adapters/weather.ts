import type { Weather, WeatherPort } from '../ports/weather.ts'

// wttr.in needs no API key and auto-detects location by IP.
const WTTR_URL = 'https://wttr.in/?format=%l|%t|%C'

export function conditionIcon(condition: string): string {
  const c = condition.toLowerCase()
  if (c.includes('sun') || c.includes('clear')) {
    return '☀'
  }
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) {
    return '🌧'
  }
  if (c.includes('snow') || c.includes('sleet')) {
    return '❄'
  }
  if (c.includes('thunder') || c.includes('storm')) {
    return '⛈'
  }
  if (c.includes('fog') || c.includes('mist')) {
    return '🌫'
  }
  return '☁'
}

export function parseWttr(raw: string): Weather | null {
  const parts = raw.trim().split('|')
  if (parts.length !== 3) {
    return null
  }

  const [rawLocation, temperature, condition] = parts.map((p) => p.trim())
  if (!rawLocation || !temperature || !condition) {
    return null
  }

  const location = rawLocation.split(',')[0].trim()
  return { location, temperature, condition, icon: conditionIcon(condition) }
}

export function createWeatherAdapter(): WeatherPort {
  return {
    async read(): Promise<Weather | null> {
      try {
        const response = await fetch(WTTR_URL, {
          headers: { 'User-Agent': 'curl/8.0' },
          signal: AbortSignal.timeout(8000),
        })
        return parseWttr(await response.text())
      } catch {
        return null
      }
    },
  }
}
