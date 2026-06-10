import { describe, it, expect, mock } from 'bun:test'
import { createSendEmailTool } from '../../../src/adapters/tools/email.ts'
import type { MailerPort } from '../../../src/ports/mailer.ts'

function makeMockMailer(): MailerPort {
  return { send: mock(async () => 'Email sent to dest@x.com') }
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
