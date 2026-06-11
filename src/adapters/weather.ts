import type { ForecastDay, Weather, WeatherPort } from '../ports/weather.ts'

// wttr.in needs no API key and auto-detects location by IP. j1 = full JSON.
const WTTR_JSON_URL = 'https://wttr.in/?format=j1'
const WTTR_TEXT_URL = 'https://wttr.in/?format=%l|%t|%C'

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

function dayLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`)
  return date.toLocaleDateString('es-ES', { weekday: 'short' })
}

type WttrJson = {
  nearest_area?: { areaName?: { value: string }[] }[]
  current_condition?: { temp_C?: string; weatherDesc?: { value: string }[] }[]
  weather?: {
    date?: string
    maxtempC?: string
    mintempC?: string
    hourly?: { weatherDesc?: { value: string }[] }[]
  }[]
}

export function parseWttrJson(raw: string): Weather | null {
  let data: WttrJson
  try {
    data = JSON.parse(raw) as WttrJson
  } catch {
    return null
  }

  const current = data.current_condition?.[0]
  const location = data.nearest_area?.[0]?.areaName?.[0]?.value
  if (!current?.temp_C || !location) {
    return null
  }

  const condition = current.weatherDesc?.[0]?.value ?? '—'

  const forecast: ForecastDay[] = (data.weather ?? []).slice(0, 3).map((day) => {
    const midday = day.hourly?.[4]?.weatherDesc?.[0]?.value ?? day.hourly?.[0]?.weatherDesc?.[0]?.value ?? '—'
    return {
      label: day.date ? dayLabel(day.date) : '—',
      max: `${day.maxtempC ?? '?'}°`,
      min: `${day.mintempC ?? '?'}°`,
      condition: midday,
    }
  })

  return {
    location: location.split(',')[0].trim(),
    temperature: `${current.temp_C}°C`,
    condition,
    icon: conditionIcon(condition),
    forecast,
  }
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

  return {
    location: rawLocation.split(',')[0].trim(),
    temperature,
    condition,
    icon: conditionIcon(condition),
    forecast: [],
  }
}

export function createWeatherAdapter(): WeatherPort {
  return {
    async read(): Promise<Weather | null> {
      try {
        const response = await fetch(WTTR_JSON_URL, {
          headers: { 'User-Agent': 'curl/8.0' },
          signal: AbortSignal.timeout(10000),
        })
        const fromJson = parseWttrJson(await response.text())
        if (fromJson) {
          return fromJson
        }
      } catch {
        // fall through to the text endpoint
      }

      try {
        const response = await fetch(WTTR_TEXT_URL, {
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
