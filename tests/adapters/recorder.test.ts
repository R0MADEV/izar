import { describe, it, expect } from 'bun:test'
import { isSoxInstalled, buildRecordArgs } from '../../src/adapters/recorder.ts'

describe('isSoxInstalled', () => {
  it('returns a boolean', () => {
    const result = isSoxInstalled()
    expect(typeof result).toBe('boolean')
  })
})

describe('buildRecordArgs', () => {
  const args = buildRecordArgs('/tmp/out.wav')

  it('records at 16kHz mono 16-bit (whisper-friendly format)', () => {
    expect(args).toContain('-r')
    expect(args).toContain('16000')
    expect(args).toContain('-c')
    expect(args).toContain('1')
  })

  it('includes the output file path', () => {
    expect(args).toContain('/tmp/out.wav')
  })

  it('enables silence detection to auto-stop recording', () => {
    expect(args).toContain('silence')
  })

  it('caps the recording length with a trim', () => {
    const trimIndex = args.indexOf('trim')
    expect(trimIndex).toBeGreaterThan(-1)
  })
})
