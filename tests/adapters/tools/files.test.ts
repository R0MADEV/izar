import { describe, it, expect, afterEach } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { readFileTool, writeFileTool, listDirTool } from '../../../src/adapters/tools/files.ts'

const TEST_DIR = path.join(os.tmpdir(), 'izar-files-test')

afterEach(() => {
  if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true })
})

describe('readFileTool', () => {
  it('returns file contents', async () => {
    fs.mkdirSync(TEST_DIR, { recursive: true })
    const filePath = path.join(TEST_DIR, 'test.txt')
    fs.writeFileSync(filePath, 'hello izar')
    const result = await readFileTool.execute({ path: filePath })
    expect(result).toBe('hello izar')
  })

  it('returns error message when file does not exist', async () => {
    const result = await readFileTool.execute({ path: '/nonexistent/file.txt' })
    expect(result).toContain('not found')
  })
})

describe('writeFileTool', () => {
  it('writes content to a file', async () => {
    const filePath = path.join(TEST_DIR, 'output.txt')
    await writeFileTool.execute({ path: filePath, content: 'written by izar' })
    expect(fs.readFileSync(filePath, 'utf-8')).toBe('written by izar')
  })

  it('creates parent directories if they do not exist', async () => {
    const filePath = path.join(TEST_DIR, 'deep/nested/file.txt')
    await writeFileTool.execute({ path: filePath, content: 'nested' })
    expect(fs.existsSync(filePath)).toBe(true)
  })
})

describe('listDirTool', () => {
  it('lists files and directories', async () => {
    fs.mkdirSync(path.join(TEST_DIR, 'subdir'), { recursive: true })
    fs.writeFileSync(path.join(TEST_DIR, 'file.txt'), '')
    const result = await listDirTool.execute({ path: TEST_DIR })
    expect(result).toContain('[file] file.txt')
    expect(result).toContain('[dir] subdir')
  })

  it('returns error message when directory does not exist', async () => {
    const result = await listDirTool.execute({ path: '/nonexistent/dir' })
    expect(result).toContain('not found')
  })
})
