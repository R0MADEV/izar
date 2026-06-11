import { describe, it, expect, mock, beforeEach } from 'bun:test'

mock.module('ai', () => ({
  generateText: mock(async () => ({ text: 'mocked llm response' })),
  tool: (definition: unknown) => definition,
}))

mock.module('ollama-ai-provider', () => ({
  createOllama: () => (_modelName: string) => 'mock-model-instance',
}))

const { createOllamaAdapter } = await import('../../src/adapters/ollama.ts')
const { generateText } = await import('ai')
const generateTextMock = generateText as ReturnType<typeof mock>

beforeEach(() => {
  generateTextMock.mockClear()
})

describe('createOllamaAdapter', () => {
  it('returns the text from the LLM', async () => {
    const llm = createOllamaAdapter('llama3.1:8b', 'http://localhost:11434')
    const result = await llm.generate('system prompt', [], [])
    expect(result).toBe('mocked llm response')
  })

  it('replays the response as word chunks when onToken is given', async () => {
    const llm = createOllamaAdapter('llama3.1:8b', 'http://localhost:11434')
    const received: string[] = []
    const result = await llm.generate('system', [], [], (delta) => received.push(delta))

    expect(received.length).toBeGreaterThan(1)
    expect(received.join('')).toBe('mocked llm response')
    expect(result).toBe('mocked llm response')
  })

  it('passes system prompt and messages to generateText', async () => {
    const llm = createOllamaAdapter('llama3.1:8b', 'http://localhost:11434')
    await llm.generate('you are izar', [{ role: 'user', content: 'hello' }], [])

    const callParams = generateTextMock.mock.calls[0][0] as Record<string, unknown>
    expect(callParams.system).toBe('you are izar')
    expect(callParams.messages).toEqual([{ role: 'user', content: 'hello' }])
  })

  it('converts tools to AI SDK format with correct names', async () => {
    const llm = createOllamaAdapter('llama3.1:8b', 'http://localhost:11434')
    const sampleTool = {
      name: 'test_tool',
      description: 'A test tool',
      parameters: { input: { type: 'string' as const, description: 'Input text' } },
      execute: async () => 'result',
    }

    await llm.generate('system', [], [sampleTool])

    const callParams = generateTextMock.mock.calls[0][0] as Record<string, unknown>
    const toolsMap = callParams.tools as Record<string, unknown>
    expect(toolsMap).toHaveProperty('test_tool')
  })
})
