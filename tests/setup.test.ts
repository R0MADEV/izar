import { describe, it, expect, afterEach } from 'bun:test'
import fs from 'node:fs'
import { ensureEnvFile } from '../src/setup.ts'

const ORIGINAL_CWD = process.cwd()

afterEach(() => {
  process.chdir(ORIGINAL_CWD)
})

describe('ensureEnvFile', () => {
  it('creates a .env file when none exists', () => {
    const tmpDir = fs.mkdtempSync('/tmp/izar-setup-')
    process.chdir(tmpDir)

    expect(fs.existsSync('.env')).toBe(false)
    ensureEnvFile()
    expect(fs.existsSync('.env')).toBe(true)

    const content = fs.readFileSync('.env', 'utf-8')
    expect(content).toContain('OLLAMA_MODEL')
    expect(content).toContain('SMTP_USER')

    fs.rmSync(tmpDir, { recursive: true })
  })

  it('does not overwrite an existing .env file', () => {
    const tmpDir = fs.mkdtempSync('/tmp/izar-setup-')
    process.chdir(tmpDir)

    fs.writeFileSync('.env', 'EXISTING=value')
    ensureEnvFile()

    expect(fs.readFileSync('.env', 'utf-8')).toBe('EXISTING=value')

    fs.rmSync(tmpDir, { recursive: true })
  })
})
