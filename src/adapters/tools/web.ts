import type { Tool } from '../../ports/tool.ts'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const NEWS_KEYWORDS = ['noticias', 'news', 'últimas', 'ultimas', 'hoy', 'reciente', 'novedad']

function isNewsQuery(query: string): boolean {
  const lowerQuery = query.toLowerCase()
  return NEWS_KEYWORDS.some((keyword) => lowerQuery.includes(keyword))
}

function stripHtml(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/g, '\'')
    .replace(/\s+/g, ' ')
    .trim()
}

async function searchGoogleNewsRSS(query: string): Promise<string> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=es-ES&gl=ES&ceid=ES:es`
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  const xml = await response.text()

  const items = xml.match(/<item>[\s\S]*?<\/item>/g)?.slice(0, 6) ?? []

  const results = items.map((item) => {
    const title =
      item.match(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/)?.[1] ??
      item.match(/<title>([^<]+)<\/title>/)?.[1] ??
      ''
    const source = item.match(/<source[^>]*>([^<]+)<\/source>/)?.[1] ?? ''
    const pubDate = item.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1]?.split(' ').slice(0, 4).join(' ') ?? ''
    return `• ${title}${source ? ` — ${source}` : ''}${pubDate ? ` (${pubDate})` : ''}`
  })

  return results.length > 0 ? results.join('\n') : ''
}

async function searchDDGHtml(query: string): Promise<string> {
  const params = new URLSearchParams({ q: query, ia: 'web' })
  const response = await fetch(`https://html.duckduckgo.com/html/?${params}`, {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8' },
  })

  const html = await response.text()

  const titleMatches = [...html.matchAll(/class="result__a"[^>]*>([\s\S]*?)<\/a>/g)]
  const snippetMatches = [...html.matchAll(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g)]

  const results = titleMatches.slice(0, 5).map((match, i) => {
    const title = stripHtml(match[1])
    const snippet = snippetMatches[i] ? stripHtml(snippetMatches[i][1]) : ''
    return snippet ? `${title}\n${snippet}` : title
  })

  return results.filter((r) => r.length > 10).join('\n\n')
}

export const webSearchTool: Tool = {
  name: 'web_search',
  description: 'Search the web for current information, news, or facts.',
  parameters: {
    query: { type: 'string', description: 'The search query' },
  },
  async execute({ query }) {
    const queryString = String(query)

    if (isNewsQuery(queryString)) {
      const newsResult = await searchGoogleNewsRSS(queryString).catch(() => '')
      if (newsResult) {
        return newsResult
      }
    }

    const ddgResult = await searchDDGHtml(queryString).catch(() => '')
    if (ddgResult) {
      return ddgResult
    }

    const fallbackNews = await searchGoogleNewsRSS(queryString).catch(() => '')
    return fallbackNews || 'Search unavailable right now. Try rephrasing the query.'
  },
}
