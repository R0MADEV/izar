export type OutgoingEmail = {
  to: string
  subject: string
  body: string
  cc?: string
}

export type MailerPort = {
  send(email: OutgoingEmail): Promise<string>
}
