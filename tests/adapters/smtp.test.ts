import { describe, it, expect, mock } from 'bun:test'

const sendMailMock = mock(async () => ({ messageId: '<test-id@local>' }))

mock.module('nodemailer', () => ({
  default: {
    createTransport: mock(() => ({ sendMail: sendMailMock })),
  },
}))

const { createSMTPMailer } = await import('../../src/adapters/smtp.ts')

const VALID_CONFIG = {
  host: 'smtp.gmail.com',
  port: 465,
  user: 'me@gmail.com',
  pass: 'app-password',
}

describe('createSMTPMailer', () => {
  it('returns a not-configured message when user and pass are missing', async () => {
    const mailer = createSMTPMailer({ host: 'smtp.gmail.com', port: 465, user: '', pass: '' })
    const result = await mailer.send({ to: 'x@y.com', subject: 's', body: 'b' })
    expect(result).toContain('not configured')
  })

  it('sends email and returns the message id when configured', async () => {
    const mailer = createSMTPMailer(VALID_CONFIG)
    const result = await mailer.send({ to: 'dest@gmail.com', subject: 'hi', body: 'hello' })
    expect(result).toContain('Email sent to dest@gmail.com')
    expect(result).toContain('test-id@local')
  })

  it('passes the correct fields to nodemailer', async () => {
    sendMailMock.mockClear()
    const mailer = createSMTPMailer(VALID_CONFIG)
    await mailer.send({ to: 'dest@gmail.com', subject: 'subj', body: 'body text', cc: 'cc@x.com' })

    const sentArgs = sendMailMock.mock.calls[0][0] as Record<string, string>
    expect(sentArgs.from).toBe('me@gmail.com')
    expect(sentArgs.to).toBe('dest@gmail.com')
    expect(sentArgs.subject).toBe('subj')
    expect(sentArgs.text).toBe('body text')
    expect(sentArgs.cc).toBe('cc@x.com')
  })

  it('returns an error message when sendMail throws', async () => {
    sendMailMock.mockImplementationOnce(async () => {
      throw new Error('auth failed')
    })
    const mailer = createSMTPMailer(VALID_CONFIG)
    const result = await mailer.send({ to: 'd@x.com', subject: 's', body: 'b' })
    expect(result).toContain('Could not send email')
    expect(result).toContain('auth failed')
  })
})
