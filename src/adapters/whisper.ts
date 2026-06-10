import type { STTPort } from '../ports/stt.ts'

const WHISPER_MODEL = 'Xenova/whisper-tiny.en'

type WhisperResult = { text: string }

export async function createWhisperAdapter(): Promise<STTPort> {
  const { pipeline } = await import('@huggingface/transformers')
  const transcriber = await pipeline('automatic-speech-recognition', WHISPER_MODEL)

  return {
    async transcribe(audioFilePath) {
      const result = (await transcriber(audioFilePath)) as WhisperResult
      return result.text.trim()
    },
  }
}
