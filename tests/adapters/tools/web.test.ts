import { describe, it, expect, mock, beforeEach } from 'bun:test'

const MOCK_DDG_HTML = `
  <div class="result">
    <a class="result__a" href="#">Apple iPhone 17 announced</a>
    <div class="result__snippet">Apple unveils new iPhone model</div>
  </div>
  <div class="result">
    <a class="result__a" href="#">Apple stock hits record</a>
    <div class="result__snippet">Apple shares reach all time high</div>
  </div>
`

function mockFetchWith(html: string) {
  global.fetch = mock(async () => ({
    text: async () => html,
    json: async () => ({}),
  })) as typeof fetch
}

beforeEach(() => {
  mockFetchWith(MOCK_DDG_HTML)
})

const { webSearchTool } = await import('../../../src/adapters/tools/web.ts')

describe('webSearchTool', () => {
  it('returns formatted search results from DDG HTML', async () => {
    const result = await webSearchTool.execute({ query: 'Apple news' })
    expect(result).toContain('Apple iPhone 17 announced')
  })

  it('includes snippets in results', async () => {
    const result = await webSearchTool.execute({ query: 'Apple news' })
    expect(result).toContain('Apple unveils new iPhone model')
  })

  it('falls back to Google News RSS when DDG returns nothing', async () => {
    const MOCK_RSS = `
      <item>
        <title><![CDATA[Apple lanza nuevo producto]]></title>
        <pubDate>Wed, 11 Jun 2026 10:00:00 GMT</pubDate>
      </item>`

    global.fetch = mock(async (url: string) => {
      const isRSS = String(url).includes('news.google.com')
      return {
        text: async () => (isRSS ? MOCK_RSS : ''),
        json: async () => ({}),
      }
    }) as typeof fetch

    const result = await webSearchTool.execute({ query: 'Apple' })
    expect(result).toContain('Apple lanza nuevo producto')
  })

  it('returns unavailable message when all sources fail', async () => {
    global.fetch = mock(async () => {
      throw new Error('network error')
    }) as typeof fetch

    const result = await webSearchTool.execute({ query: 'test' })
    expect(result).toContain('unavailable')
  })
})
