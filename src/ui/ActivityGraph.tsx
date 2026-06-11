import { useState, useEffect, useRef } from 'react'
import { Box, Text } from 'ink'
import { sparkline } from './sparkline.ts'
import type { Theme } from './themes.ts'
import type { TelemetryPort } from '../ports/telemetry.ts'

const POLL_INTERVAL_MS = 1000
const HISTORY = 18

export function ActivityGraph({ source, theme }: { source: TelemetryPort; theme: Theme }) {
  const cpuHistory = useRef<number[]>([])
  const downHistory = useRef<number[]>([])
  const upHistory = useRef<number[]>([])
  const [, setTick] = useState(0)

  useEffect(() => {
    let alive = true
    const poll = async () => {
      const reading = await source.read().catch(() => null)
      if (!alive || !reading) {
        return
      }
      cpuHistory.current = [...cpuHistory.current, reading.cpuPercent].slice(-HISTORY)
      downHistory.current = [...downHistory.current, reading.netDownKB].slice(-HISTORY)
      upHistory.current = [...upHistory.current, reading.netUpKB].slice(-HISTORY)
      setTick((t) => t + 1)
    }
    poll()
    const interval = setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      alive = false
      clearInterval(interval)
    }
  }, [source])

  return (
    <Box flexDirection="column" alignItems="center">
      <Box marginBottom={1}>
        <Text color={theme.dim}>┤ ACTIVIDAD ├</Text>
      </Box>
      <Box marginBottom={1}>
        <Text color={theme.dim}>CPU  </Text>
        <Text color={theme.primary}>{sparkline(cpuHistory.current, HISTORY)}</Text>
      </Box>
      <Box marginBottom={1}>
        <Text color={theme.dim}>BAJA </Text>
        <Text color={theme.accent}>{sparkline(downHistory.current, HISTORY)}</Text>
      </Box>
      <Box>
        <Text color={theme.dim}>SUBE </Text>
        <Text color={theme.success}>{sparkline(upHistory.current, HISTORY)}</Text>
      </Box>
    </Box>
  )
}
