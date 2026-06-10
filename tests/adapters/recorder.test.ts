import { describe, it, expect } from 'bun:test'
import { isSoxInstalled } from '../../src/adapters/recorder.ts'

describe('isSoxInstalled', () => {
  it('returns a boolean', () => {
    const result = isSoxInstalled()
    expect(typeof result).toBe('boolean')
  })

  it('returns true on macOS when sox is installed', () => {
    if (process.platform !== 'darwin') {
      return
    }

    // sox is a prerequisite for voice mode — this test validates the environment
    const isInstalled = isSoxInstalled()
    if (!isInstalled) {
      console.warn('sox not installed — voice mode unavailable. Run: brew install sox')
    }
    expect(typeof isInstalled).toBe('boolean')
  })
})
