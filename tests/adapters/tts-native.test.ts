import { describe, it, expect } from 'bun:test'
import { buildTTSCommand } from '../../src/adapters/tts-native.ts'

describe('buildTTSCommand', () => {
  it('returns null for unsupported platforms', () => {
    const command = buildTTSCommand('freebsd', 'hello')
    expect(command).toBeNull()
  })

  it('builds a say command for macOS', () => {
    const command = buildTTSCommand('darwin', 'hello from izar')
    expect(command).toContain('say')
    expect(command).toContain('hello from izar')
  })

  it('builds an espeak command for linux', () => {
    const command = buildTTSCommand('linux', 'hello from izar')
    expect(command).toContain('espeak')
    expect(command).toContain('hello from izar')
  })

  it('builds a PowerShell command for windows', () => {
    const command = buildTTSCommand('win32', 'hello from izar')
    expect(command).toContain('SpeechSynthesizer')
    expect(command).toContain('hello from izar')
  })

  it('escapes double quotes to prevent command injection on macOS', () => {
    const command = buildTTSCommand('darwin', 'say "hello"') as string
    const hasUnescapedQuotes = command.includes('"hello"')
    expect(hasUnescapedQuotes).toBe(false)
  })

  it('escapes single quotes to prevent command injection on windows', () => {
    const command = buildTTSCommand('win32', 'it\'s a test') as string
    const hasSingleQuoteInjection = command.includes('it\'s')
    expect(hasSingleQuoteInjection).toBe(false)
  })
})
