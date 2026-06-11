import fs from 'node:fs'
import { WaveFile } from 'wavefile'
import type { STTPort } from '../ports/stt.ts'

const DEFAULT_WHISPER_MODEL = 'Xenova/whisper-small'
const WHISPER_SAMPLE_RATE = 16000

type WhisperResult = { text: string }
type Transcriber = (audio: Float32Array, options?: Record<string, unknown>) => Promise<WhisperResult>

function decodeWavToSamples(audioFilePath: string): Float32Array {
  const buffer = fs.readFileSync(audioFilePath)
  const wav = new WaveFile(buffer)
  wav.toBitDepth('32f')
  wav.toSampleRate(WHISPER_SAMPLE_RATE)

  const samples = wav.getSamples()
  const channel = Array.isArray(samples) ? samples[0] : samples
  return Float32Array.from(channel as ArrayLike<number>)
}

export async function createWhisperAdapter(
  language = 'spanish',
  model = DEFAULT_WHISPER_MODEL,
): Promise<STTPort> {
  const { pipeline } = await import('@huggingface/transformers')
  const transcriber = (await pipeline(
    'automatic-speech-recognition',
    model,
  )) as unknown as Transcriber

  return {
    async transcribe(audioFilePath) {
      const samples = decodeWavToSamples(audioFilePath)
      const result = await transcriber(samples, { language, task: 'transcribe' })
      return result.text.trim()
    },
  }
}
