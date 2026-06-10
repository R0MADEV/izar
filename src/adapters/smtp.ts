import nodemailer from 'nodemailer'
import type { MailerPort } from '../ports/mailer.ts'

export type SMTPConfig = {
  host: string
  port: number
  user: string
  pass: string
}

export function createSMTPMailer(smtpConfig: SMTPConfig): MailerPort {
  const isConfigured = Boolean(smtpConfig.user && smtpConfig.pass)

  const transporter = isConfigured
    ? nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.port === 465,
      auth: { user: smtpConfig.user, pass: smtpConfig.pass },
    })
    : null

  return {
    async send(email) {
      if (!transporter) {
        return 'Email not configured. Set SMTP_USER and SMTP_PASS in .env (Gmail app-password: https://myaccount.google.com/apppasswords).'
      }

      try {
        const info = await transporter.sendMail({
          from: smtpConfig.user,
          to: email.to,
          cc: email.cc,
          subject: email.subject,
          text: email.body,
        })
        return `Email sent to ${email.to} (id: ${info.messageId})`
      } catch (error: unknown) {
        return `Could not send email: ${(error as Error).message}`
      }
    },
  }
}
