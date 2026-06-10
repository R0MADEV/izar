import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import type { InboxMessage, MailReaderPort } from '../ports/mailer.ts'

export type IMAPConfig = {
  host: string
  port: number
  user: string
  pass: string
}

function buildPreview(text: string, html: string): string {
  const source = text || stripHtml(html)
  const collapsed = source.replace(/\s+/g, ' ').trim()
  return collapsed.length > 200 ? `${collapsed.slice(0, 200)}...` : collapsed
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
}

export function createIMAPReader(imapConfig: IMAPConfig): MailReaderPort {
  const isConfigured = Boolean(imapConfig.user && imapConfig.pass)

  return {
    async read(count, unreadOnly) {
      if (!isConfigured) {
        return 'Email reading not configured. Set SMTP_USER and SMTP_PASS in .env (the same Gmail app-password works for IMAP).'
      }

      const client = new ImapFlow({
        host: imapConfig.host,
        port: imapConfig.port,
        secure: true,
        auth: { user: imapConfig.user, pass: imapConfig.pass },
        logger: false,
      })

      try {
        await client.connect()
        const lock = await client.getMailboxLock('INBOX')

        try {
          const searchResult = await client.search(unreadOnly ? { seen: false } : { all: true })
          const ids = (searchResult || []).slice(-count).reverse()

          const messages: InboxMessage[] = []
          for await (const message of client.fetch(ids, { envelope: true, source: true })) {
            const from = message.envelope?.from?.[0]
            const fromStr = from ? `${from.name || ''} <${from.address}>`.trim() : 'unknown'

            const parsed = message.source ? await simpleParser(message.source) : null
            const bodyText = parsed?.text ?? ''
            const bodyHtml = typeof parsed?.html === 'string' ? parsed.html : ''

            messages.push({
              from: fromStr,
              subject: message.envelope?.subject || '(no subject)',
              date: message.envelope?.date?.toString() || '',
              preview: buildPreview(bodyText, bodyHtml),
            })
          }
          return messages
        } finally {
          lock.release()
        }
      } catch (error: unknown) {
        return `Could not read email: ${(error as Error).message}`
      } finally {
        await client.logout().catch(() => {})
      }
    },
  }
}
