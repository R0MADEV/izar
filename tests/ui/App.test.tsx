import { describe, it, expect, mock } from 'bun:test'
import { render } from 'ink-testing-library'
import { createElement } from 'react'
import { App } from '../../src/ui/App.tsx'
import type { Agent } from '../../src/domain/agent.ts'

function makeAgent(reply = 'respuesta'): Agent {
  return { chat: mock(async () => reply) } as unknown as Agent
}

const noopVoice = async () => ''

describe('App (Ink HUD)', () => {
  it('renders the IZAR banner and online status', () => {
    const { lastFrame } = render(
      createElement(App, { agent: makeAgent(), captureVoice: noopVoice, speak: async () => {}, initialTheme: 'jarvis' }),
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('online')
    expect(frame.toLowerCase()).toContain('jarvis')
  })

  it('shows the input placeholder', () => {
    const { lastFrame } = render(
      createElement(App, { agent: makeAgent(), captureVoice: noopVoice, speak: async () => {}, initialTheme: 'jarvis' }),
    )
    expect(lastFrame() ?? '').toContain('/voz')
  })

  it('renders with a different theme name in the header', () => {
    const { lastFrame } = render(
      createElement(App, { agent: makeAgent(), captureVoice: noopVoice, speak: async () => {}, initialTheme: 'matrix' }),
    )
    expect((lastFrame() ?? '').toLowerCase()).toContain('matrix')
  })

  it('sends a typed message to the agent and shows the reply', async () => {
    const agent = makeAgent('son las 9')
    const { stdin, lastFrame } = render(
      createElement(App, { agent, captureVoice: noopVoice, speak: async () => {}, initialTheme: 'jarvis' }),
    )

    await new Promise((resolve) => setTimeout(resolve, 20))
    stdin.write('qué hora es')
    await new Promise((resolve) => setTimeout(resolve, 20))
    stdin.write('\r')
    await new Promise((resolve) => setTimeout(resolve, 80))

    expect(agent.chat).toHaveBeenCalledWith('qué hora es')
    expect(lastFrame() ?? '').toContain('son las 9')
  })
})
