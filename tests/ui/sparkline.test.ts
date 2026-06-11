import { describe, it, expect } from 'bun:test'
import { sparkline } from '../../src/ui/sparkline.ts'

describe('sparkline', () => {
  it('returns a string of the requested width', () => {
    expect(sparkline([1, 2, 3], 3).length).toBe(3)
  })

  it('pads with the lowest block when there are fewer values than width', () => {
    const line = sparkline([5], 4)
    expect(line.length).toBe(4)
    expect(line.startsWith('▁▁▁')).toBe(true)
  })

  it('uses the tallest block for the maximum value', () => {
    const line = sparkline([0, 10], 2)
    expect(line[1]).toBe('█')
  })

  it('uses the lowest block for the minimum value', () => {
    const line = sparkline([0, 10], 2)
    expect(line[0]).toBe('▁')
  })

  it('keeps only the most recent values when more than width', () => {
    const line = sparkline([0, 0, 0, 100], 2)
    expect(line[1]).toBe('█')
  })

  it('renders flat input as the lowest block', () => {
    expect(sparkline([5, 5, 5], 3)).toBe('▁▁▁')
  })

  it('returns an empty-ish bar for no data', () => {
    expect(sparkline([], 3)).toBe('▁▁▁')
  })
})
