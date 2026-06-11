export type Clock = { time: string; date: string }

export function formatClock(now: Date): Clock {
  const time = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  const date = now.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  return { time, date }
}
