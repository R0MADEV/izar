import { useState, useEffect } from 'react'
import { Box, Text } from 'ink'
import type { Theme } from './themes.ts'

const ACTIVE_INTERVAL_MS = 80
const IDLE_INTERVAL_MS = 200

const CORE_PULSE = ['◉', '◎', '⊙', '◍']

type Cell = { char: string; color: string; bold: boolean }
type RingSpec = { rxFactor: number; ryFactor: number; glyph: string; dir: number; speed: number; arc: number }

const RING_SPECS: RingSpec[] = [
  { rxFactor: 1.0, ryFactor: 1.0, glyph: '·', dir: 1, speed: 0.14, arc: Math.PI / 5 },
  { rxFactor: 0.78, ryFactor: 0.78, glyph: '∘', dir: -1, speed: 0.19, arc: Math.PI / 5 },
  { rxFactor: 0.54, ryFactor: 0.54, glyph: '·', dir: 1, speed: 0.25, arc: Math.PI / 5 },
  { rxFactor: 0.3, ryFactor: 0.3, glyph: '∙', dir: -1, speed: 0.31, arc: Math.PI / 4 },
]

// Midpoint ellipse: returns each cell on the outline exactly once, evenly.
function ellipseCells(cx: number, cy: number, rx: number, ry: number): { y: number; x: number }[] {
  const cells: { y: number; x: number }[] = []
  const seen = new Set<string>()
  const push = (x: number, y: number) => {
    const yi = Math.round(y)
    const xi = Math.round(x)
    const key = `${yi},${xi}`
    if (!seen.has(key)) {
      seen.add(key)
      cells.push({ y: yi, x: xi })
    }
  }

  const rx2 = rx * rx
  const ry2 = ry * ry
  let x = 0
  let y = ry
  let dx = 0
  let dy = 2 * rx2 * y
  let d1 = ry2 - rx2 * ry + 0.25 * rx2

  while (dx < dy) {
    push(cx + x, cy + y)
    push(cx - x, cy + y)
    push(cx + x, cy - y)
    push(cx - x, cy - y)
    if (d1 < 0) {
      x++
      dx += 2 * ry2
      d1 += dx + ry2
    } else {
      x++
      y--
      dx += 2 * ry2
      dy -= 2 * rx2
      d1 += dx - dy + ry2
    }
  }

  let d2 = ry2 * (x + 0.5) ** 2 + rx2 * (y - 1) ** 2 - rx2 * ry2
  while (y >= 0) {
    push(cx + x, cy + y)
    push(cx - x, cy + y)
    push(cx + x, cy - y)
    push(cx - x, cy - y)
    if (d2 > 0) {
      y--
      dy -= 2 * rx2
      d2 += rx2 - dy
    } else {
      y--
      x++
      dx += 2 * ry2
      dy -= 2 * rx2
      d2 += dx - dy + rx2
    }
  }

  return cells
}

function angularDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % (Math.PI * 2)
  return Math.min(diff, Math.PI * 2 - diff)
}

export function ArcReactor({ active, theme, width = 23 }: { active: boolean; theme: Theme; width?: number }) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const interval = setInterval(
      () => setFrame((f) => f + 1),
      active ? ACTIVE_INTERVAL_MS : IDLE_INTERVAL_MS,
    )
    return () => clearInterval(interval)
  }, [active])

  const cols = Math.max(15, width % 2 === 0 ? width - 1 : width)
  const rows = Math.max(7, Math.round(cols * 0.5) | 1)
  const cy = Math.floor(rows / 2)
  const cx = Math.floor(cols / 2)
  const baseRx = (cols - 1) / 2
  const baseRy = (rows - 1) / 2

  const grid: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ char: ' ', color: theme.dim, bold: false })),
  )

  for (const ring of RING_SPECS) {
    const rx = baseRx * ring.rxFactor
    const ry = baseRy * ring.ryFactor
    const litAngle = active ? (frame * ring.speed * ring.dir) % (Math.PI * 2) : null

    for (const { y, x } of ellipseCells(cx, cy, rx, ry)) {
      if (y < 0 || y >= rows || x < 0 || x >= cols) {
        continue
      }
      const angle = Math.atan2((y - cy) / (ry || 1), (x - cx) / (rx || 1))
      const normAngle = angle < 0 ? angle + Math.PI * 2 : angle
      const isLit = litAngle !== null && angularDistance(normAngle, litAngle) < ring.arc
      grid[y][x] = {
        char: isLit ? '●' : ring.glyph,
        color: isLit ? theme.accent : theme.primary,
        bold: isLit,
      }
    }
  }

  // Glowing core — a bright cluster, bigger than a single char.
  const coreChar = CORE_PULSE[frame % CORE_PULSE.length]
  const corePlots: { dy: number; dx: number; char: string }[] = [
    { dy: -1, dx: 0, char: '▁' },
    { dy: 0, dx: -2, char: '⟨' },
    { dy: 0, dx: -1, char: '◗' },
    { dy: 0, dx: 0, char: coreChar },
    { dy: 0, dx: 1, char: '◖' },
    { dy: 0, dx: 2, char: '⟩' },
    { dy: 1, dx: 0, char: '▔' },
  ]
  for (const p of corePlots) {
    const y = cy + p.dy
    const x = cx + p.dx
    if (y >= 0 && y < rows && x >= 0 && x < cols) {
      grid[y][x] = { char: p.char, color: theme.accent, bold: true }
    }
  }

  return (
    <Box flexDirection="column" alignItems="center">
      {grid.map((row, y) => (
        <Box key={y}>
          {row.map((cell, x) => (
            <Text key={x} color={cell.color} bold={cell.bold}>
              {cell.char}
            </Text>
          ))}
        </Box>
      ))}
    </Box>
  )
}
