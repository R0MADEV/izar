import { platform } from 'node:os'
import { config } from './config.ts'
import { Agent } from './domain/agent.ts'
import { createOllamaAdapter } from './adapters/ollama.ts'
import { createVectraAdapter } from './adapters/vectra.ts'
import { createSMTPMailer } from './adapters/smtp.ts'
import { createIMAPReader } from './adapters/imap.ts'
import { webSearchTool } from './adapters/tools/web.ts'
import { readFileTool, writeFileTool, listDirTool } from './adapters/tools/files.ts'
import { shellTool } from './adapters/tools/shell.ts'
import { calendarTool, createCalendarEventTool, openAppTool, notifyTool } from './adapters/tools/system.ts'
import { createSendEmailTool, createGetEmailsTool } from './adapters/tools/email.ts'
import type { Tool } from './ports/tool.ts'

export function buildTools(): Tool[] {
  const mailer = createSMTPMailer({
    host: config.smtpHost,
    port: config.smtpPort,
    user: config.smtpUser,
    pass: config.smtpPass,
  })

  const mailReader = createIMAPReader({
    host: config.imapHost,
    port: config.imapPort,
    user: config.smtpUser,
    pass: config.smtpPass,
  })

  const isMacOS = platform() === 'darwin'

  return [
    webSearchTool,
    readFileTool,
    writeFileTool,
    listDirTool,
    shellTool,
    openAppTool,
    notifyTool,
    createSendEmailTool(mailer),
    createGetEmailsTool(mailReader),
    ...(isMacOS ? [calendarTool, createCalendarEventTool] : []),
  ]
}

export function buildAgent(): Agent {
  const llm = createOllamaAdapter(config.ollamaModel, config.ollamaUrl)
  const memory = createVectraAdapter(config.memoryDir, config.ollamaUrl)
  return new Agent(llm, memory, buildTools())
}
