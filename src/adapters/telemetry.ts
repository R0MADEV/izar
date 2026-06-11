import si from 'systeminformation'
import type { Telemetry, TelemetryPort } from '../ports/telemetry.ts'

const BYTES_PER_GB = 1024 ** 3

export function createTelemetryAdapter(): TelemetryPort {
  return {
    async read(): Promise<Telemetry> {
      const [load, mem, graphics, battery, net] = await Promise.all([
        si.currentLoad().catch(() => null),
        si.mem().catch(() => null),
        si.graphics().catch(() => null),
        si.battery().catch(() => null),
        si.networkStats().catch(() => null),
      ])

      const gpuController = graphics?.controllers?.find(
        (c) => typeof c.utilizationGpu === 'number',
      )
      const primaryNet = net?.[0]
      const safeRate = (value: number | undefined): number =>
        typeof value === 'number' && value > 0 ? value / 1024 : 0

      return {
        cpuPercent: load?.currentLoad ?? 0,
        ramUsedGB: mem ? (mem.total - mem.available) / BYTES_PER_GB : 0,
        ramTotalGB: mem ? mem.total / BYTES_PER_GB : 0,
        gpuPercent: gpuController?.utilizationGpu ?? null,
        batteryPercent: battery && battery.hasBattery ? battery.percent : null,
        charging: battery?.isCharging ?? false,
        netDownKB: safeRate(primaryNet?.rx_sec),
        netUpKB: safeRate(primaryNet?.tx_sec),
      }
    },
  }
}
