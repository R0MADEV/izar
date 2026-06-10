import { LocalIndex } from 'vectra'
import fs from 'node:fs'
import type { MemoryPort } from '../ports/memory.ts'

async function fetchOllamaEmbedding(text: string, ollamaBaseUrl: string): Promise<number[]> {
  const response = await fetch(`${ollamaBaseUrl}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'nomic-embed-text', prompt: text }),
  })
  const responseBody = (await response.json()) as { embedding: number[] }
  return responseBody.embedding
}

export function createVectraAdapter(memoryStorageDir: string, ollamaBaseUrl: string): MemoryPort {
  fs.mkdirSync(memoryStorageDir, { recursive: true })
  const vectorIndex = new LocalIndex(memoryStorageDir)

  return {
    async save(userInput, agentResponse) {
      if (!(await vectorIndex.isIndexCreated())) {
        await vectorIndex.createIndex()
      }

      const conversationText = `User: ${userInput}\nIZAR: ${agentResponse}`
      const embeddingVector = await fetchOllamaEmbedding(conversationText, ollamaBaseUrl)

      await vectorIndex.insertItem({
        vector: embeddingVector,
        metadata: { text: conversationText },
      })
    },

    async recall(searchQuery) {
      if (!(await vectorIndex.isIndexCreated())) {
        return ''
      }

      const queryVector = await fetchOllamaEmbedding(searchQuery, ollamaBaseUrl)
      const nearestResults = await vectorIndex.queryItems(queryVector, searchQuery, 3)

      return nearestResults.map((result) => result.item.metadata.text as string).join('\n---\n')
    },
  }
}
