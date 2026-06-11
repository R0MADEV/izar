const BLOCKS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']

export function sparkline(values: number[], width: number): string {
  if (width <= 0) {
    return ''
  }

  const recent = values.slice(-width)
  const padded = [...Array(Math.max(0, width - recent.length)).fill(0), ...recent]

  const max = Math.max(...padded)
  const min = Math.min(...padded)
  const range = max - min

  return padded
    .map((value) => {
      if (range === 0) {
        return BLOCKS[0]
      }
      const level = Math.round(((value - min) / range) * (BLOCKS.length - 1))
      return BLOCKS[level]
    })
    .join('')
}
