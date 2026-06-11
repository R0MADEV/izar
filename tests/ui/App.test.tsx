import { describe, it, expect, mock } from 'bun:test'
import { render } from 'ink-testing-library'
import { createElement } from 'react'
import { App } from '../../src/ui/App.tsx'
import type { Agent } from '../../src/domain/agent.ts'

function makeAgent(reply = 'respuesta'): Agent {
  return { chat: mock(async () => reply) } as unknown as Agent
}

const noopVoice = async () => ''
const fakeTelemetry = {
  read: async () => ({
    cpuPercent: 10,
    ramUsedGB: 8,
    ramTotalGB: 16,
    gpuPercent: null,
    batteryPercent: 80,
    charging: false, netDownKB: 12, netUpKB: 3,
  }),
}
const fakeWeather = {
  read: async () => ({ location: 'Bilbao', temperature: '+13°C', condition: 'Cloudy', icon: '☁' }),
}

describe('App (Ink HUD)', () => {
  it('renders the HUD with the input prompt', () => {
    const { lastFrame } = render(
      createElement(App, { agent: makeAgent(), captureVoice: noopVoice, speak: async () => {}, telemetry: fakeTelemetry, weather: fakeWeather, initialTheme: 'jarvis' }),
    )
    expect(lastFrame() ?? '').toContain('/voz')
  })

  it('shows the input placeholder', () => {
    const { lastFrame } = render(
      createElement(App, { agent: makeAgent(), captureVoice: noopVoice, speak: async () => {}, telemetry: fakeTelemetry, weather: fakeWeather, initialTheme: 'jarvis' }),
    )
    expect(lastFrame() ?? '').toContain('/voz')
  })

  it('renders without crashing on a different theme', () => {
    const { lastFrame } = render(
      createElement(App, { agent: makeAgent(), captureVoice: noopVoice, speak: async () => {}, telemetry: fakeTelemetry, weather: fakeWeather, initialTheme: 'matrix' }),
    )
    expect((lastFrame() ?? '').length).toBeGreaterThan(0)
  })

  it('sends a typed message to the agent and shows the reply', async () => {
    const agent = makeAgent('son las 9')
    const { stdin, lastFrame } = render(
      createElement(App, { agent, captureVoice: noopVoice, speak: async () => {}, telemetry: fakeTelemetry, weather: fakeWeather, initialTheme: 'jarvis' }),
    )

    await new Promise((resolve) => setTimeout(resolve, 20))
    stdin.write('qué hora es')
    await new Promise((resolve) => setTimeout(resolve, 20))
    stdin.write('\r')
    await new Promise((resolve) => setTimeout(resolve, 80))

    expect((agent.chat as ReturnType<typeof mock>).mock.calls[0][0]).toBe('qué hora es')
    expect(lastFrame() ?? '').toContain('son las 9')
  })
})
