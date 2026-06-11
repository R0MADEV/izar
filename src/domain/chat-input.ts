export type ChatInput =
  | { type: 'message'; text: string }
  | { type: 'voice' }
  | { type: 'clear' }
  | { type: 'theme'; name: string }
  | { type: 'exit' }
  | { type: 'noop' }

const VOICE_EXIT_PHRASES = ['texto', 'modo texto', 'para', 'basta', 'silencio', 'stop']

export function isVoiceExit(transcript: string): boolean {
  const normalized = transcript
    .trim()
    .toLowerCase()
    .replace(/[.,!?]/g, '')
  return VOICE_EXIT_PHRASES.includes(normalized)
}

const VOICE_COMMANDS = ['/voz', '/voice']
const CLEAR_COMMANDS = ['/clear', '/limpiar', '/cls']
const THEME_COMMANDS = ['/theme', '/tema']
const EXIT_COMMANDS = ['exit', 'quit', 'bye', 'salir', '/salir', '/exit']

export function parseChatInput(raw: string): ChatInput {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { type: 'noop' }
  }

  const [firstWord, ...rest] = trimmed.split(/\s+/)
  const command = firstWord.toLowerCase()

  if (THEME_COMMANDS.includes(command)) {
    return { type: 'theme', name: rest.join(' ').toLowerCase() }
  }

  const lower = trimmed.toLowerCase()

  if (VOICE_COMMANDS.includes(lower)) {
    return { type: 'voice' }
  }
  if (CLEAR_COMMANDS.includes(lower)) {
    return { type: 'clear' }
  }
  if (EXIT_COMMANDS.includes(lower)) {
    return { type: 'exit' }
  }

  return { type: 'message', text: trimmed }
}
