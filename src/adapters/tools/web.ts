import { search } from 'duck-duck-scrape'
import type { Tool } from '../../ports/tool.ts'

export const webSearchTool: Tool = {
  name: 'web_search',
  description: 'Search the web for current information, news, or facts.',
  parameters: {
    query: { type: 'string', description: 'The search query' },
  },
  async execute({ query }) {
    const results = await search(String(query), { safeSearch: 0 })
    return results.results
      .slice(0, 5)
      .map(r => `${r.title}\n${r.url}\n${r.description}`)
      .join('\n\n')
  },
}
