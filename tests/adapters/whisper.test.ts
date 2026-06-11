import { describe, it, expect, mock } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { WaveFile } from 'wavefile'

let lastAudioArg: unknown = null

const pipelineMock = mock(async () => {
  const transcriber = async (audio: unknown) => {
    lastAudioArg = audio
    return { text: '  hola que tal  ' }
  }
  return transcriber
})

mock.module('@huggingface/transformers', () => ({
  pipeline: pipelineMock,
}))

const { createWhisperAdapter } = await import('../../src/adapters/whisper.ts')

function writeTestWav(): string {
  const samples = new Float32Array(16000).fill(0.05)
  const wav = new WaveFile()
  wav.fromScratch(1, 16000, '32f', samples)
  const filePath = path.join(os.tmpdir(), `izar-whisper-test-${samples.length}.wav`)
  fs.writeFileSync(filePath, wav.toBuffer())
  return filePath
}

describe('createWhisperAdapter', () => {
  it('loads an automatic-speech-recognition pipeline', async () => {
    pipelineMock.mockClear()
    await createWhisperAdapter()
    expect(pipelineMock.mock.calls[0][0]).toBe('automatic-speech-recognition')
  })

  it('uses a multilingual model by default (not English-only)', async () => {
    pipelineMock.mockClear()
    await createWhisperAdapter()
    const modelName = pipelineMock.mock.calls[0][1] as string
    expect(modelName.endsWith('.en')).toBe(false)
  })

  it('accepts a custom model name', async () => {
    pipelineMock.mockClear()
    await createWhisperAdapter('spanish', 'Xenova/whisper-small')
    const modelName = pipelineMock.mock.calls[0][1] as string
    expect(modelName).toBe('Xenova/whisper-small')
  })

  it('decodes the WAV file into a Float32Array before transcribing', async () => {
    const wavPath = writeTestWav()
    const stt = await createWhisperAdapter()
    await stt.transcribe(wavPath)

    expect(lastAudioArg).toBeInstanceOf(Float32Array)
    fs.unlinkSync(wavPath)
  })

  it('transcribes audio and trims whitespace', async () => {
    const wavPath = writeTestWav()
    const stt = await createWhisperAdapter()
    const text = await stt.transcribe(wavPath)
    expect(text).toBe('hola que tal')
    fs.unlinkSync(wavPath)
  })
})
