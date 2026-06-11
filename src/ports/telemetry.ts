export type Telemetry = {
  cpuPercent: number
  ramUsedGB: number
  ramTotalGB: number
  gpuPercent: number | null
  batteryPercent: number | null
  charging: boolean
  netDownKB: number
  netUpKB: number
}

export type TelemetryPort = {
  read(): Promise<Telemetry>
}
