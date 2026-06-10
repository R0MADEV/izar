import { describe, it, expect, mock } from 'bun:test'

mock.module('duck-duck-scrape', () => ({
  search: mock(async () => ({
    results: [
      { title: 'Result 1', url: 'https://example.com', description: 'Description one' },
      { title: 'Result 2', url: 'https://example.org', description: 'Description two' },
      { title: 'Result 3', url: 'https://example.net', description: 'Description three' },
      { title: 'Result 4', url: 'https://result4.com', description: 'Description four' },
      { title: 'Result 5', url: 'https://result5.com', description: 'Description five' },
      { title: 'Result 6', url: 'https://result6.com', description: 'Should be excluded' },
    ],
  })),
}))

const { webSearchTool } = await import('../../../src/adapters/tools/web.ts')

describe('webSearchTool', () => {
  it('returns formatted search results', async () => {
    const result = await webSearchTool.execute({ query: 'bun javascript' })
    expect(result).toContain('Result 1')
    expect(result).toContain('https://example.com')
    expect(result).toContain('Description one')
  })

  it('limits results to 5 entries', async () => {
    const result = await webSearchTool.execute({ query: 'anything' })
    expect(result).not.toContain('Should be excluded')
    expect(result).toContain('Result 5')
  })

  it('separates results with blank lines', async () => {
    const result = await webSearchTool.execute({ query: 'test' })
    expect(result).toContain('\n\n')
  })
})
