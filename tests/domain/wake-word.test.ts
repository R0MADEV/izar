import { describe, it, expect } from 'bun:test'
import { extractWakeWordCommand } from '../../src/domain/wake-word.ts'

describe('extractWakeWordCommand', () => {
  it('returns the command after a clean wake word', () => {
    expect(extractWakeWordCommand('Izar, qué tengo mañana')).toBe('qué tengo mañana')
  })

  it('detects the wake word case-insensitively', () => {
    expect(extractWakeWordCommand('IZAR busca noticias de Apple')).toBe('busca noticias de Apple')
  })

  it('accepts single-token mis-transcriptions of the name', () => {
    expect(extractWakeWordCommand('Isar, hola')).toBe('hola')
    expect(extractWakeWordCommand('Izard qué hora es')).toBe('qué hora es')
    expect(extractWakeWordCommand('ízar dime algo')).toBe('dime algo')
  })

  it('accepts two-token mis-transcriptions (Whisper splits the name)', () => {
    expect(extractWakeWordCommand('y sal qué hora es')).toBe('qué hora es')
    expect(extractWakeWordCommand('y zar busca noticias')).toBe('busca noticias')
    expect(extractWakeWordCommand('e sar abre safari')).toBe('abre safari')
  })

  it('returns null when nothing sounds like the wake word', () => {
    expect(extractWakeWordCommand('qué tiempo hace hoy')).toBeNull()
    expect(extractWakeWordCommand('hola cómo estás')).toBeNull()
  })

  it('returns null for empty input', () => {
    expect(extractWakeWordCommand('')).toBeNull()
  })

  it('strips leading punctuation after the wake word', () => {
    expect(extractWakeWordCommand('Izar... ¿qué hora es?')).toBe('¿qué hora es?')
  })

  it('returns empty string when only the wake word is said', () => {
    expect(extractWakeWordCommand('Izar')).toBe('')
    expect(extractWakeWordCommand('y sal')).toBe('')
  })

  it('does not match the wake word mid-sentence', () => {
    expect(extractWakeWordCommand('hola izar cómo estás')).toBeNull()
  })

  it('does not false-match unrelated words', () => {
    expect(extractWakeWordCommand('salir del programa')).toBeNull()
    expect(extractWakeWordCommand('sara vino a casa')).toBeNull()
  })
})
