// "Izar" is a coined name, so Whisper transcribes it many ways:
// "izar", "isar", "izard", "y sal", "y zar", "e sar"...
// We match phonetically: an optional leading vowel + an s/z sound + "a" + r/l.
const WAKE_PATTERN = /^[iyeh]?[szc]a[rl]d?$/

function normalize(token: string): string {
  return token
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '')
}

function soundsLikeWakeWord(token: string): boolean {
  return WAKE_PATTERN.test(token)
}

function stripLeadingPunctuation(text: string): string {
  return text.replace(/^[\s,.…]+/, '').trim()
}

export function extractWakeWordCommand(transcript: string): string | null {
  const trimmed = transcript.trim()
  if (!trimmed) {
    return null
  }

  const tokens = trimmed.split(/\s+/)
  const firstToken = normalize(tokens[0])

  // Case 1: the name came through as a single token ("izar qué hora").
  if (soundsLikeWakeWord(firstToken)) {
    return stripLeadingPunctuation(tokens.slice(1).join(' '))
  }

  // Case 2: Whisper split the name in two ("y sal qué hora").
  const firstTwoJoined = firstToken + normalize(tokens[1] ?? '')
  if (tokens.length >= 2 && soundsLikeWakeWord(firstTwoJoined)) {
    return stripLeadingPunctuation(tokens.slice(2).join(' '))
  }

  return null
}
