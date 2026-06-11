import { useState, useEffect } from 'react'
import { Box, Text } from 'ink'
import type { Theme } from './themes.ts'
import type { Weather, WeatherPort } from '../ports/weather.ts'

const REFRESH_MS = 15 * 60 * 1000 // 15 min

export function WeatherWidget({ source, theme }: { source: WeatherPort; theme: Theme }) {
  const [weather, setWeather] = useState<Weather | null>(null)

  useEffect(() => {
    let alive = true
    const load = async () => {
      const w = await source.read()
      if (alive && w) {
        setWeather(w)
      }
    }
    load()
    const interval = setInterval(load, REFRESH_MS)
    return () => {
      alive = false
      clearInterval(interval)
    }
  }, [source])

  if (!weather) {
    return (
      <Box>
        <Text color={theme.dim}>clima…</Text>
      </Box>
    )
  }

  return (
    <Box>
      <Text color={theme.accent} bold>
        {weather.temperature} {weather.location}
      </Text>
      <Text color={theme.dim}> · {weather.condition}</Text>
    </Box>
  )
}
