import 'dotenv/config'
import * as clack from '@clack/prompts'
import chalk from 'chalk'
import { config } from './config.ts'
import { buildAgent } from './compose.ts'
import { runBootstrap } from './setup.ts'

const EXIT_COMMANDS = ['exit', 'quit', 'bye']

const BANNER = `
  ██╗███████╗ █████╗ ██████╗
  ██║╚══███╔╝██╔══██╗██╔══██╗
  ██║  ███╔╝ ███████║██████╔╝
  ██║ ███╔╝  ██╔══██║██╔══██╗
  ██║███████╗██║  ██║██║  ██║
  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝`

async function main(): Promise<void> {
  console.clear()
  console.log(chalk.cyan(BANNER))
  console.log(chalk.dim('  Personal AI — Fase 1\n'))

  await runBootstrap(config.ollamaUrl, config.ollamaModel)

  const agent = buildAgent()

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
