import { describe, it, expect } from 'bun:test'
import { parseChatInput, isVoiceExit } from '../../src/domain/chat-input.ts'

describe('isVoiceExit', () => {
  it('detects phrases that end voice mode', () => {
    expect(isVoiceExit('texto')).toBe(true)
    expect(isVoiceExit('modo texto')).toBe(true)
    expect(isVoiceExit('para')).toBe(true)
    expect(isVoiceExit('basta')).toBe(true)
    expect(isVoiceExit('silencio')).toBe(true)
  })

  it('is case-insensitive and ignores surrounding noise', () => {
    expect(isVoiceExit('  Texto.  ')).toBe(true)
    expect(isVoiceExit('PARA')).toBe(true)
  })

  it('returns false for normal questions', () => {
    expect(isVoiceExit('qué hora es')).toBe(false)
    expect(isVoiceExit('busca noticias')).toBe(false)
  })
})

describe('parseChatInput', () => {
  it('treats plain text as a message', () => {
    expect(parseChatInput('qué hora es')).toEqual({ type: 'message', text: 'qué hora es' })
  })

  it('detects /voz as a voice trigger', () => {
    expect(parseChatInput('/voz')).toEqual({ type: 'voice' })
  })

  it('detects /voice as a voice trigger too', () => {
    expect(parseChatInput('/voice')).toEqual({ type: 'voice' })
  })

  it('detects exit commands', () => {
    expect(parseChatInput('exit')).toEqual({ type: 'exit' })
    expect(parseChatInput('salir')).toEqual({ type: 'exit' })
    expect(parseChatInput('/salir')).toEqual({ type: 'exit' })
  })

  it('detects /clear to reset the screen', () => {
    expect(parseChatInput('/clear')).toEqual({ type: 'clear' })
    expect(parseChatInput('/limpiar')).toEqual({ type: 'clear' })
  })

  it('detects /theme with a name argument', () => {
    expect(parseChatInput('/theme matrix')).toEqual({ type: 'theme', name: 'matrix' })
    expect(parseChatInput('/tema synthwave')).toEqual({ type: 'theme', name: 'synthwave' })
  })

  it('detects /theme with no argument to list themes', () => {
    expect(parseChatInput('/theme')).toEqual({ type: 'theme', name: '' })
  })

  it('treats empty or whitespace input as noop', () => {
    expect(parseChatInput('')).toEqual({ type: 'noop' })
    expect(parseChatInput('   ')).toEqual({ type: 'noop' })
  })

  it('trims whitespace around messages and commands', () => {
    expect(parseChatInput('  /voz  ')).toEqual({ type: 'voice' })
    expect(parseChatInput('  hola  ')).toEqual({ type: 'message', text: 'hola' })
  })

  it('is case-insensitive for commands', () => {
    expect(parseChatInput('/VOZ')).toEqual({ type: 'voice' })
    expect(parseChatInput('EXIT')).toEqual({ type: 'exit' })
  })
})
