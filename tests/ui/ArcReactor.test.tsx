import { describe, it, expect } from 'bun:test'
import { render } from 'ink-testing-library'
import { createElement } from 'react'
import { ArcReactor } from '../../src/ui/ArcReactor.tsx'
import { getTheme } from '../../src/ui/themes.ts'

const theme = getTheme('jarvis')

describe('ArcReactor', () => {
  it('renders the reactor core', () => {
    const { lastFrame, unmount } = render(
      createElement(ArcReactor, { active: false, theme }),
    )
    const frame = lastFrame() ?? ''
    // core pulse char is one of ◉ ◎ ⊙
    expect(/[◉◎⊙]/.test(frame)).toBe(true)
    unmount()
  })

  it('renders neuron nodes around the core', () => {
    const { lastFrame, unmount } = render(createElement(ArcReactor, { active: false, theme }))
    const frame = lastFrame() ?? ''
    expect(/[✶✦∘•·]/.test(frame)).toBe(true)
    unmount()
  })
})
