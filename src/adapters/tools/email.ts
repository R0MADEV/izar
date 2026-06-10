import type { MailerPort } from '../../ports/mailer.ts'
import type { Tool } from '../../ports/tool.ts'

export function createSendEmailTool(mailer: MailerPort): Tool {
  return {
    name: 'send_email',
    description: 'Send an email via SMTP. Works on any platform. Extract recipient, subject and body from the request.',
    parameters: {
      to: { type: 'string', description: 'Recipient email address' },
      subject: { type: 'string', description: 'Email subject' },
      body: { type: 'string', description: 'Email body text' },
      cc: { type: 'string', description: 'CC email address', required: false },
    },
    async execute({ to, subject, body, cc }) {
      return mailer.send({
        to: String(to),
        subject: String(subject),
        body: String(body),
        cc: cc ? String(cc) : undefined,
      })
    },
  }
}
