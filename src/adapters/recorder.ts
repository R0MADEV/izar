import { spawn } from 'node:child_process'
import { execSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import path from 'node:path'

const RECORDING_SAMPLE_RATE = '16000'
const SILENCE_DURATION = '2.0'
const SILENCE_THRESHOLD = '3%'
const MAX_RECORDING_SECONDS = '30'

export function isSoxInstalled(): boolean {
  try {
    execSync('which rec', { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

export function buildRecordArgs(outputFile: string): string[] {
  return [
    '-r', RECORDING_SAMPLE_RATE,
    '-c', '1',
    '-b', '16',
    outputFile,
    'silence', '1', '0.1', SILENCE_THRESHOLD,
    '1', SILENCE_DURATION, SILENCE_THRESHOLD,
    'trim', '0', MAX_RECORDING_SECONDS,
  ]
}

export function recordWithSilenceDetection(): Promise<string> {
  const outputFile = path.join(tmpdir(), `izar-voice-${Date.now()}.wav`)

  return new Promise((resolve, reject) => {
    const recProcess = spawn('rec', buildRecordArgs(outputFile))

    recProcess.on('close', (exitCode) => {
      const isNormalExit = exitCode === 0 || exitCode === null
      if (isNormalExit) {
        resolve(outputFile)
      } else {
        reject(new Error(`rec exited with code ${exitCode}`))
      }
    })

    recProcess.on('error', (err) => {
      reject(new Error(`Failed to start recorder: ${err.message}`))
    })
  })
}
