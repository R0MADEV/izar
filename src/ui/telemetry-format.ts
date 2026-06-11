import type { Telemetry } from '../ports/telemetry.ts'

export type TelemetryRow = {
  label: string
  value: string
  percent: number
}

export function bar(percent: number, width: number): string {
  const clamped = Math.max(0, Math.min(100, percent))
  const filled = Math.round((clamped / 100) * width)
  return '▓'.repeat(filled) + '░'.repeat(width - filled)
}

export function formatTelemetry(t: Telemetry): TelemetryRow[] {
  const ramPercent = t.ramTotalGB > 0 ? (t.ramUsedGB / t.ramTotalGB) * 100 : 0

  const batteryValue =
    t.batteryPercent === null
      ? '—'
      : `${Math.round(t.batteryPercent)}%${t.charging ? ' ⚡' : ''}`

  return [
    { label: 'CPU', value: `${Math.round(t.cpuPercent)}%`, percent: t.cpuPercent },
    {
      label: 'GPU',
      value: t.gpuPercent === null ? '—' : `${Math.round(t.gpuPercent)}%`,
      percent: t.gpuPercent ?? 0,
    },
    {
      label: 'RAM',
      value: `${Math.round(t.ramUsedGB)}/${Math.round(t.ramTotalGB)}GB`,
      percent: ramPercent,
    },
    { label: 'BAT', value: batteryValue, percent: t.batteryPercent ?? 0 },
  ]
}
