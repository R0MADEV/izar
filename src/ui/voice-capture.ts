import fs from 'node:fs'
import { config } from '../config.ts'
import { createWhisperAdapter } from '../adapters/whisper.ts'
import { isSoxInstalled, recordWithSilenceDetection } from '../adapters/recorder.ts'
import type { STTPort } from '../ports/stt.ts'

export type VoiceStage = 'loading' | 'listening' | 'transcribing'

// Lazy: Whisper (~250MB) only loads the first time the user actually speaks.
export function createVoiceCapture(): (onStage?: (stage: VoiceStage) => void) => Promise<string> {
  let stt: STTPort | null = null

  return async (onStage) => {
    if (!isSoxInstalled()) {
      throw new Error('sox no está instalado. macOS: brew install sox · Linux: apt install sox')
    }

    if (!stt) {
      onStage?.('loading')
      stt = await createWhisperAdapter(config.whisperLanguage, config.whisperModel)
    }

    onStage?.('listening')
    const audioFile = await recordWithSilenceDetection()

    try {
      onStage?.('transcribing')
      return await stt.transcribe(audioFile)
    } finally {
      fs.unlinkSync(audioFile)
    }
  }
}
