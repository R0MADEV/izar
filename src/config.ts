import 'dotenv/config'

export const config = {
  llmProvider: process.env.LLM_PROVIDER ?? 'ollama',
  ollamaModel: process.env.OLLAMA_MODEL ?? 'llama3.1:8b',
  ollamaUrl: process.env.OLLAMA_URL ?? 'http://localhost:11434',
  claudeApiKey: process.env.CLAUDE_API_KEY ?? '',
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  memoryDir: process.env.MEMORY_DIR ?? `${process.env.HOME}/.izar/memory`,
  smtpHost: process.env.SMTP_HOST ?? 'smtp.gmail.com',
  smtpPort: Number(process.env.SMTP_PORT ?? 465),
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPass: process.env.SMTP_PASS ?? '',
} as const
