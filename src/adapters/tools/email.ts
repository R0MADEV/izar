import type { MailerPort, MailReaderPort } from '../../ports/mailer.ts'
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

function formatInbox(messages: { from: string; subject: string; date: string; preview: string }[]): string {
  if (messages.length === 0) {
    return 'No emails found.'
  }
  return messages
    .map(
      (m) =>
        `DE: ${m.from}\nASUNTO: ${m.subject}\nFECHA: ${m.date}\nPREVIEW: ${m.preview}`,
    )
    .join('\n\n')
}

export function createGetEmailsTool(reader: MailReaderPort): Tool {
  return {
    name: 'get_emails',
    description: 'Read emails from the inbox via IMAP. Works on any platform.',
    parameters: {
      count: { type: 'number', description: 'Max emails to return (default: 10)', required: false },
      unread_only: {
        type: 'boolean',
        description: 'Only return unread emails (default: true)',
        required: false,
      },
    },
    async execute({ count = 10, unread_only = true }) {
      const result = await reader.read(Number(count), unread_only === true)
      return typeof result === 'string' ? result : formatInbox(result)
    },
  }
}
