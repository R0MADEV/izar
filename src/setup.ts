import { execSync, spawn } from 'node:child_process'
import { existsSync, copyFileSync, writeFileSync } from 'node:fs'
import { platform } from 'node:os'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import * as clack from '@clack/prompts'
import chalk from 'chalk'

const DEFAULT_ENV = `LLM_PROVIDER=ollama
OLLAMA_MODEL=llama3.1:8b
OLLAMA_URL=http://localhost:11434
CLAUDE_API_KEY=
OPENAI_API_KEY=

# Correo: enviar (SMTP) y leer (IMAP). App-password de Gmail: https://myaccount.google.com/apppasswords
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=
SMTP_PASS=
IMAP_HOST=imap.gmail.com
IMAP_PORT=993

# Voz (opcional). Modelos: Xenova/whisper-tiny | whisper-base | whisper-small | whisper-medium
WHISPER_MODEL=Xenova/whisper-small
WHISPER_LANGUAGE=spanish
# true = hay que decir "Izar" antes de cada pregunta. false = solo hablas (más fiable).
WAKE_WORD_ENABLED=false
`

function commandExists(command: string): boolean {
  const probe = platform() === 'win32' ? 'where' : 'which'
  try {
    execSync(`${probe} ${command}`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

export function ensureEnvFile(): void {
  if (existsSync('.env')) {
    return
  }

  const exampleDir = dirname(fileURLToPath(import.meta.url))
  const examplePath = join(exampleDir, '..', '.env.example')

  if (existsSync(examplePath)) {
    copyFileSync(examplePath, '.env')
  } else {
    writeFileSync('.env', DEFAULT_ENV)
  }
  clack.log.info('Created .env — add your email credentials there to enable mail.')
}

export async function ensureOllamaInstalled(): Promise<void> {
  if (commandExists('ollama')) {
    return
  }

  const os = platform()

  if (os === 'win32') {
    clack.log.warn('Ollama is not installed. Opening the download page...')
    execSync('start https://ollama.com/download', { stdio: 'ignore' })
    clack.log.error('Install Ollama, then run izar again.')
    process.exit(1)
  }

  const shouldInstall = await clack.confirm({
    message: 'Ollama is required and not installed. Install it automatically now?',
  })

  if (clack.isCancel(shouldInstall) || !shouldInstall) {
    clack.log.error('Ollama is required. Install it from https://ollama.com and run izar again.')
    process.exit(1)
  }

  const spinner = clack.spinner()
  spinner.start('Installing Ollama (this may take a minute)...')
  try {
    execSync('curl -fsSL https://ollama.com/install.sh | sh', { stdio: 'ignore' })
    spinner.stop('Ollama installed.')
  } catch {
    spinner.stop('Automatic install failed.')
    clack.log.error('Install Ollama manually from https://ollama.com and run izar again.')
    process.exit(1)
  }
}

async function isOllamaRunning(ollamaUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${ollamaUrl}/api/tags`)
    return res.ok
  } catch {
    return false
  }
}

export async function ensureOllamaRunning(ollamaUrl: string): Promise<void> {
  if (await isOllamaRunning(ollamaUrl)) {
    return
  }

  const spinner = clack.spinner()
  spinner.start('Starting Ollama...')

  const child = spawn('ollama', ['serve'], { detached: true, stdio: 'ignore' })
  child.unref()

  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    if (await isOllamaRunning(ollamaUrl)) {
      spinner.stop('Ollama is running.')
      return
    }
  }

  spinner.stop('Could not start Ollama.')
  clack.log.error('Run "ollama serve" manually and try again.')
  process.exit(1)
}

async function installedModels(ollamaUrl: string): Promise<string[]> {
  try {
    const res = await fetch(`${ollamaUrl}/api/tags`)
    const data = (await res.json()) as { models?: { name: string }[] }
    return data.models?.map((m) => m.name) ?? []
  } catch {
    return []
  }
}

function pullModel(model: string): void {
  clack.log.info(`Downloading model ${model} (first run only)...`)
  execSync(`ollama pull ${model}`, { stdio: 'inherit' })
}

export async function ensureModels(ollamaUrl: string, chatModel: string): Promise<void> {
  const present = await installedModels(ollamaUrl)
  const requiredModels = [chatModel, 'nomic-embed-text']

  for (const model of requiredModels) {
    const isPresent = present.some((m) => m.includes(model))
    if (!isPresent) {
      pullModel(model)
    }
  }
}

export async function runBootstrap(ollamaUrl: string, chatModel: string): Promise<void> {
  ensureEnvFile()
  await ensureOllamaInstalled()
  await ensureOllamaRunning(ollamaUrl)
  await ensureModels(ollamaUrl, chatModel)
}

export function offerSoxInstall(): void {
  if (commandExists('rec')) {
    return
  }

  const os = platform()
  const installHint =
    os === 'darwin' ? 'brew install sox' : os === 'linux' ? 'sudo apt install sox' : 'choco install sox'

  clack.log.warn(`Voice mode needs sox. Install it with: ${chalk.cyan(installHint)}`)
}
