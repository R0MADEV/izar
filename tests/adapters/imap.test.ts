import { describe, it, expect, mock } from 'bun:test'

const connectMock = mock(async () => {})
const logoutMock = mock(async () => {})
const lockReleaseMock = mock(() => {})
const getMailboxLockMock = mock(async () => ({ release: lockReleaseMock }))
const searchMock = mock(async () => [1, 2, 3])

const RAW_EMAIL = [
  'From: Juan <juan@x.com>',
  'Subject: Hola',
  'Content-Type: text/plain; charset=utf-8',
  '',
  'cuerpo del mensaje',
].join('\r\n')

async function* fakeFetch() {
  yield {
    envelope: {
      from: [{ name: 'Juan', address: 'juan@x.com' }],
      subject: 'Hola',
      date: new Date('2026-06-10T10:00:00Z'),
    },
    source: Buffer.from(RAW_EMAIL),
  }
}

const fetchMock = mock(() => fakeFetch())

mock.module('imapflow', () => ({
  ImapFlow: class {
    connect = connectMock
    logout = logoutMock
    getMailboxLock = getMailboxLockMock
    search = searchMock
    fetch = fetchMock
  },
}))

const { createIMAPReader } = await import('../../src/adapters/imap.ts')

const VALID_CONFIG = { host: 'imap.gmail.com', port: 993, user: 'me@gmail.com', pass: 'pw' }

describe('createIMAPReader', () => {
  it('returns a not-configured message without credentials', async () => {
    const reader = createIMAPReader({ host: 'imap.gmail.com', port: 993, user: '', pass: '' })
    const result = await reader.read(10, true)
    expect(result).toContain('not configured')
  })

  it('reads inbox and returns structured messages', async () => {
    const reader = createIMAPReader(VALID_CONFIG)
    const result = await reader.read(10, true)

    expect(Array.isArray(result)).toBe(true)
    const messages = result as { from: string; subject: string; preview: string }[]
    expect(messages[0].subject).toBe('Hola')
    expect(messages[0].from).toContain('juan@x.com')
    expect(messages[0].preview).toBe('cuerpo del mensaje')
  })

  it('connects and logs out cleanly', async () => {
    connectMock.mockClear()
    logoutMock.mockClear()
    const reader = createIMAPReader(VALID_CONFIG)
    await reader.read(5, false)

    expect(connectMock).toHaveBeenCalled()
    expect(logoutMock).toHaveBeenCalled()
  })
})
