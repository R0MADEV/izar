import { describe, it, expect, mock } from 'bun:test'
import { createSendEmailTool, createGetEmailsTool } from '../../../src/adapters/tools/email.ts'
import type { MailerPort, MailReaderPort } from '../../../src/ports/mailer.ts'

function makeMockMailer(): MailerPort {
  return { send: mock(async () => 'Email sent to dest@x.com') }
}

function makeMockReader(result: unknown): MailReaderPort {
  return { read: mock(async () => result) as MailReaderPort['read'] }
}

describe('createSendEmailTool', () => {
  it('has the correct name and parameters', () => {
    const tool = createSendEmailTool(makeMockMailer())
    expect(tool.name).toBe('send_email')
    expect(tool.parameters).toHaveProperty('to')
    expect(tool.parameters).toHaveProperty('subject')
    expect(tool.parameters).toHaveProperty('body')
  })

  it('forwards the email fields to the mailer', async () => {
    const mailer = makeMockMailer()
    const tool = createSendEmailTool(mailer)

    await tool.execute({ to: 'dest@x.com', subject: 'hi', body: 'hello', cc: 'cc@x.com' })

    expect(mailer.send).toHaveBeenCalledWith({
      to: 'dest@x.com',
      subject: 'hi',
      body: 'hello',
      cc: 'cc@x.com',
    })
  })

  it('returns the mailer result', async () => {
    const tool = createSendEmailTool(makeMockMailer())
    const result = await tool.execute({ to: 'dest@x.com', subject: 's', body: 'b' })
    expect(result).toContain('Email sent')
  })

  it('passes undefined cc when not provided', async () => {
    const mailer = makeMockMailer()
    const tool = createSendEmailTool(mailer)

    await tool.execute({ to: 'dest@x.com', subject: 's', body: 'b' })

    const sentEmail = (mailer.send as ReturnType<typeof mock>).mock.calls[0][0]
    expect(sentEmail.cc).toBeUndefined()
  })
})

describe('createGetEmailsTool', () => {
  it('has the correct name and parameters', () => {
    const tool = createGetEmailsTool(makeMockReader([]))
    expect(tool.name).toBe('get_emails')
    expect(tool.parameters).toHaveProperty('count')
    expect(tool.parameters).toHaveProperty('unread_only')
  })

  it('formats inbox messages into readable text', async () => {
    const reader = makeMockReader([
      { from: 'Juan <juan@x.com>', subject: 'Hola', date: '2026-06-10', preview: 'texto' },
    ])
    const tool = createGetEmailsTool(reader)
    const result = await tool.execute({ count: 5, unread_only: true })

    expect(result).toContain('DE: Juan <juan@x.com>')
    expect(result).toContain('ASUNTO: Hola')
    expect(result).toContain('PREVIEW: texto')
  })

  it('returns "No emails found." for an empty inbox', async () => {
    const tool = createGetEmailsTool(makeMockReader([]))
    const result = await tool.execute({ count: 5, unread_only: true })
    expect(result).toBe('No emails found.')
  })

  it('passes through a string error from the reader', async () => {
    const tool = createGetEmailsTool(makeMockReader('Could not read email: auth failed'))
    const result = await tool.execute({ count: 5, unread_only: true })
    expect(result).toContain('auth failed')
  })
})
