import { execSync } from 'node:child_process'
import { platform } from 'node:os'
import type { TTSPort } from '../ports/tts.ts'

const TTS_COMMAND_BY_PLATFORM: Record<string, (text: string) => string> = {
  darwin: (text) => `say "${text.replace(/"/g, '\\"')}"`,
  linux: (text) => `espeak "${text.replace(/"/g, '\\"')}"`,
  win32: (text) =>
    `powershell -Command "(New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('${text.replace(/'/g, '\'\'')}')"`,
}

export function buildTTSCommand(osPlatform: string, text: string): string | null {
  const commandBuilder = TTS_COMMAND_BY_PLATFORM[osPlatform]
  if (!commandBuilder) {
    return null
  }
  return commandBuilder(text)
}

export function createNativeTTSAdapter(): TTSPort {
  return {
    async speak(text) {
      const command = buildTTSCommand(platform(), text)

      if (!command) {
        return
      }

      execSync(command, { timeout: 30_000 })
    },
  }
}
