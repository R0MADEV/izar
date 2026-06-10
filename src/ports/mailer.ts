export type OutgoingEmail = {
  to: string
  subject: string
  body: string
  cc?: string
}

export type MailerPort = {
  send(email: OutgoingEmail): Promise<string>
}

export type InboxMessage = {
  from: string
  subject: string
  date: string
  preview: string
}

export type MailReaderPort = {
  read(count: number, unreadOnly: boolean): Promise<InboxMessage[] | string>
}
