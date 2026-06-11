import { describe, it, expect } from 'bun:test'
import { bar, formatTelemetry } from '../../src/ui/telemetry-format.ts'
import type { Telemetry } from '../../src/ports/telemetry.ts'

describe('bar', () => {
  it('renders an empty bar at 0%', () => {
    expect(bar(0, 10)).toBe('░░░░░░░░░░')
  })

  it('renders a full bar at 100%', () => {
    expect(bar(100, 10)).toBe('▓▓▓▓▓▓▓▓▓▓')
  })

  it('renders a half bar at 50%', () => {
    expect(bar(50, 10)).toBe('▓▓▓▓▓░░░░░')
  })

  it('clamps values out of range', () => {
    expect(bar(150, 4)).toBe('▓▓▓▓')
    expect(bar(-20, 4)).toBe('░░░░')
  })
})

describe('formatTelemetry', () => {
  const base: Telemetry = {
    cpuPercent: 23,
    ramUsedGB: 8,
    ramTotalGB: 16,
    gpuPercent: 41,
    batteryPercent: 87,
    charging: true,
  }

  it('formats CPU as a rounded percentage', () => {
    const rows = formatTelemetry(base)
    const cpu = rows.find((r) => r.label === 'CPU')
    expect(cpu?.value).toBe('23%')
  })

  it('formats RAM as used/total GB', () => {
    const rows = formatTelemetry(base)
    const ram = rows.find((r) => r.label === 'RAM')
    expect(ram?.value).toBe('8/16GB')
  })

  it('shows a charging bolt when charging', () => {
    const rows = formatTelemetry(base)
    const bat = rows.find((r) => r.label === 'BAT')
    expect(bat?.value).toContain('⚡')
  })

  it('omits the bolt when not charging', () => {
    const rows = formatTelemetry({ ...base, charging: false })
    const bat = rows.find((r) => r.label === 'BAT')
    expect(bat?.value).not.toContain('⚡')
  })

  it('shows a dash for unavailable GPU or battery', () => {
    const rows = formatTelemetry({ ...base, gpuPercent: null, batteryPercent: null })
    expect(rows.find((r) => r.label === 'GPU')?.value).toBe('—')
    expect(rows.find((r) => r.label === 'BAT')?.value).toBe('—')
  })

  it('includes a percent number for each available metric', () => {
    const rows = formatTelemetry(base)
    expect(rows.map((r) => r.label)).toEqual(['CPU', 'GPU', 'RAM', 'BAT'])
    expect(typeof rows[0].percent).toBe('number')
  })
})
