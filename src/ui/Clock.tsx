import { useState, useEffect } from 'react'
import { Box, Text } from 'ink'
import { formatClock } from './hud-info.ts'
import type { Theme } from './themes.ts'

const TICK_MS = 1000

export function Clock({ theme }: { theme: Theme }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), TICK_MS)
    return () => clearInterval(interval)
  }, [])

  const { time, date } = formatClock(now)

  return (
    <Box>
      <Text color={theme.primary} bold>
        {time}
      </Text>
      <Text color={theme.dim}> · {date}</Text>
    </Box>
  )
}
