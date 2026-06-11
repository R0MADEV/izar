import { describe, it, expect } from 'bun:test'
import { parseCommand } from '../src/cli-router.ts'

describe('parseCommand', () => {
  it('defaults to chat when no subcommand is given', () => {
    expect(parseCommand(['node', 'izar'])).toBe('chat')
  })

  it('returns voice for the voice subcommand', () => {
    expect(parseCommand(['node', 'izar', 'voice'])).toBe('voice')
  })

  it('returns chat for the chat subcommand', () => {
    expect(parseCommand(['node', 'izar', 'chat'])).toBe('chat')
  })

  it('returns help for --help and -h', () => {
    expect(parseCommand(['node', 'izar', '--help'])).toBe('help')
    expect(parseCommand(['node', 'izar', '-h'])).toBe('help')
    expect(parseCommand(['node', 'izar', 'help'])).toBe('help')
  })

  it('returns help for an unknown subcommand', () => {
    expect(parseCommand(['node', 'izar', 'bogus'])).toBe('help')
  })

  it('is case-insensitive for subcommands', () => {
    expect(parseCommand(['node', 'izar', 'VOICE'])).toBe('voice')
  })
})
