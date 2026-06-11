import { useState, useEffect } from 'react'
import { Box, Text } from 'ink'
import { bar, formatTelemetry } from './telemetry-format.ts'
import type { Theme } from './themes.ts'
import type { Telemetry as TelemetryData, TelemetryPort } from '../ports/telemetry.ts'

const POLL_INTERVAL_MS = 2000
const BAR_WIDTH = 6

function colorForLoad(percent: number, theme: Theme): string {
  if (percent >= 85) {
    return theme.error
  }
  if (percent >= 60) {
    return theme.accent
  }
  return theme.primary
}

export function Telemetry({ source, theme }: { source: TelemetryPort; theme: Theme }) {
  const [data, setData] = useState<TelemetryData | null>(null)

  useEffect(() => {
    let alive = true
    const poll = async () => {
      const reading = await source.read().catch(() => null)
      if (alive && reading) {
        setData(reading)
      }
    }
    poll()
    const interval = setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      alive = false
      clearInterval(interval)
    }
  }, [source])

  if (!data) {
    return (
      <Box>
        <Text color={theme.dim}>cargando telemetría…</Text>
      </Box>
    )
  }

  const rows = formatTelemetry(data)

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color={theme.dim}>┤ SISTEMA ├</Text>
      </Box>
      {rows.map((row) => (
        <Box key={row.label} marginBottom={1}>
          <Text color={theme.dim}>{row.label} </Text>
          <Text color={colorForLoad(row.percent, theme)}>{bar(row.percent, BAR_WIDTH)}</Text>
          <Text color={colorForLoad(row.percent, theme)}> {row.value}</Text>
        </Box>
      ))}
    </Box>
  )
}
