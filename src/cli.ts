import 'dotenv/config'
import * as clack from '@clack/prompts'
import chalk from 'chalk'
import { platform } from 'node:os'
import { config } from './config.ts'
import { Agent } from './domain/agent.ts'
import { createOllamaAdapter } from './adapters/ollama.ts'
import { createVectraAdapter } from './adapters/vectra.ts'
import { webSearchTool } from './adapters/tools/web.ts'
import { readFileTool, writeFileTool, listDirTool } from './adapters/tools/files.ts'
import { shellTool } from './adapters/tools/shell.ts'
import { calendarTool, emailTool, openAppTool, notifyTool } from './adapters/tools/system.ts'
import type { Tool } from './ports/tool.ts'

const EXIT_COMMANDS = ['exit', 'quit', 'bye']

const BANNER = `
  ██╗███████╗ █████╗ ██████╗
  ██║╚══███╔╝██╔══██╗██╔══██╗
  ██║  ███╔╝ ███████║██████╔╝
  ██║ ███╔╝  ██╔══██║██╔══██╗
  ██║███████╗██║  ██║██║  ██║
  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝`

async function checkOllama(): Promise<void> {
  try {
    const res = await fetch(`${config.ollamaUrl}/api/tags`)
    if (!res.ok) {
      throw new Error()
    }

    const data = (await res.json()) as { models?: { name: string }[] }
    const installedModels = data.models?.map((m) => m.name) ?? []
    const isLLMModelInstalled = installedModels.some((m) => m.includes(config.ollamaModel))
    const isEmbeddingModelInstalled = installedModels.some((m) => m.includes('nomic-embed-text'))

    if (!isLLMModelInstalled) {
      clack.log.warn(
        `Model '${config.ollamaModel}' not found. Run: ollama pull ${config.ollamaModel}`,
      )
    }
    if (!isEmbeddingModelInstalled) {
      clack.log.warn('Embedding model not found. Run: ollama pull nomic-embed-text')
    }
  } catch {
    clack.log.error(`Cannot connect to Ollama at ${config.ollamaUrl}. Run: ollama serve`)
    process.exit(1)
  }
}

async function main(): Promise<void> {
  console.clear()
  console.log(chalk.cyan(BANNER))
  console.log(chalk.dim('  Personal AI — Fase 1\n'))

  await checkOllama()

  const isMacOS = platform() === 'darwin'
  const tools: Tool[] = [
    webSearchTool,
    readFileTool,
    writeFileTool,
    listDirTool,
    shellTool,
    openAppTool,
    notifyTool,
    ...(isMacOS ? [calendarTool, emailTool] : []),
  ]

  const llm = createOllamaAdapter(config.ollamaModel, config.ollamaUrl)
  const memory = createVectraAdapter(config.memoryDir, config.ollamaUrl)
  const agent = new Agent(llm, memory, tools)

  clack.log.success('IZAR online.')

  while (true) {
    const input = await clack.text({ message: chalk.cyan('›') })
    const inputText = String(input).toLowerCase().trim()

    if (clack.isCancel(input)) {
      break
    }
    if (EXIT_COMMANDS.includes(inputText)) {
      break
    }
    if (!inputText) {
      continue
    }

    const spinner = clack.spinner()
    spinner.start()

    try {
      const response = await agent.chat(String(input))
      spinner.stop()
      console.log(chalk.cyan('\n  IZAR') + '\n  ' + response.split('\n').join('\n  ') + '\n')
    } catch (err: unknown) {
      spinner.stop()
      clack.log.error((err as Error).message)
    }
  }

  clack.outro(chalk.dim('Shutting down.'))
}

main()
