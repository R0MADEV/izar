import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { Agent } from '../../src/domain/agent.ts'
import type { LLMPort } from '../../src/ports/llm.ts'
import type { MemoryPort } from '../../src/ports/memory.ts'
import type { Tool } from '../../src/ports/tool.ts'

function makeMockLLM(response = 'test response'): LLMPort {
  return { generate: mock(async () => response) }
}

function makeMockMemory(): MemoryPort {
  return {
    save: mock(async () => {}),
    recall: mock(async () => ''),
  }
}

describe('Agent', () => {
  let mockLLM: LLMPort
  let mockMemory: MemoryPort
  const noTools: Tool[] = []

  beforeEach(() => {
    mockLLM = makeMockLLM()
    mockMemory = makeMockMemory()
  })

  it('returns the LLM response', async () => {
    const agent = new Agent(makeMockLLM('hello from izar'), mockMemory, noTools)
    const response = await agent.chat('hi')
    expect(response).toBe('hello from izar')
  })

  it('saves each conversation turn to memory', async () => {
    const agent = new Agent(mockLLM, mockMemory, noTools)
    await agent.chat('remember this')
    expect(mockMemory.save).toHaveBeenCalledWith('remember this', 'test response')
  })

  it('recalls past context before generating', async () => {
    const memoryWithContext: MemoryPort = {
      save: mock(async () => {}),
      recall: mock(async () => 'past conversation'),
    }
    const agent = new Agent(mockLLM, memoryWithContext, noTools)
    await agent.chat('what did we discuss?')
    expect(memoryWithContext.recall).toHaveBeenCalledWith('what did we discuss?')
  })

  it('includes previous messages in subsequent calls', async () => {
    const agent = new Agent(mockLLM, mockMemory, noTools)
    await agent.chat('first message')
    await agent.chat('second message')

    const secondCallArgs = (mockLLM.generate as ReturnType<typeof mock>).mock.calls[1]
    const conversationMessages = secondCallArgs[1] as { role: string; content: string }[]
    expect(conversationMessages.some((m) => m.content === 'first message')).toBe(true)
  })

  it('trims history when it exceeds 20 messages', async () => {
    const agent = new Agent(mockLLM, mockMemory, noTools)
    for (let i = 0; i < 12; i++) {await agent.chat(`message ${i}`)}

    const lastCallArgs = (mockLLM.generate as ReturnType<typeof mock>).mock.calls[11]
    const conversationMessages = lastCallArgs[1] as { role: string; content: string }[]
    expect(conversationMessages.length).toBeLessThanOrEqual(21)
  })
})
