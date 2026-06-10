import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createVectraAdapter } from '../../src/adapters/vectra.ts'

const TEST_MEMORY_DIR = path.join(os.tmpdir(), 'izar-vectra-test')
const FAKE_OLLAMA_URL = 'http://localhost:11434'
const FAKE_EMBEDDING = new Array(768).fill(0.1)

function mockEmbeddingEndpoint() {
  global.fetch = mock(async () => ({
    json: async () => ({ embedding: FAKE_EMBEDDING }),
  })) as typeof fetch
}

beforeEach(() => {
  mockEmbeddingEndpoint()
  if (fs.existsSync(TEST_MEMORY_DIR)) fs.rmSync(TEST_MEMORY_DIR, { recursive: true })
})

afterEach(() => {
  if (fs.existsSync(TEST_MEMORY_DIR)) fs.rmSync(TEST_MEMORY_DIR, { recursive: true })
})

describe('createVectraAdapter', () => {
  it('creates the storage directory if it does not exist', () => {
    const nestedDir = path.join(TEST_MEMORY_DIR, 'deep/nested')
    createVectraAdapter(nestedDir, FAKE_OLLAMA_URL)
    expect(fs.existsSync(nestedDir)).toBe(true)
  })

  it('returns empty string when memory is empty', async () => {
    const memory = createVectraAdapter(TEST_MEMORY_DIR, FAKE_OLLAMA_URL)
    const recalled = await memory.recall('anything')
    expect(recalled).toBe('')
  })

  it('saves a conversation and recalls it', async () => {
    const memory = createVectraAdapter(TEST_MEMORY_DIR, FAKE_OLLAMA_URL)
    await memory.save('what is the weather?', 'It is sunny today')
    const recalled = await memory.recall('weather')
    expect(recalled).toContain('what is the weather?')
    expect(recalled).toContain('It is sunny today')
  })

  it('sends embedding requests to the correct Ollama endpoint', async () => {
    const memory = createVectraAdapter(TEST_MEMORY_DIR, FAKE_OLLAMA_URL)
    await memory.save('test input', 'test output')

    const fetchMock = global.fetch as ReturnType<typeof mock>
    const firstCallUrl = fetchMock.mock.calls[0][0] as string
    const firstCallBody = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)

    expect(firstCallUrl).toBe(`${FAKE_OLLAMA_URL}/api/embeddings`)
    expect(firstCallBody.model).toBe('nomic-embed-text')
  })

  it('returns multiple past conversations separated by ---', async () => {
    const memory = createVectraAdapter(TEST_MEMORY_DIR, FAKE_OLLAMA_URL)
    await memory.save('first question', 'first answer')
    await memory.save('second question', 'second answer')
    const recalled = await memory.recall('question')
    expect(recalled).toContain('---')
  })
})
