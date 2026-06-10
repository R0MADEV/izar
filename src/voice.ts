import 'dotenv/config'
import chalk from 'chalk'
import fs from 'node:fs'
import { platform } from 'node:os'
import { config } from './config.ts'
import { Agent } from './domain/agent.ts'
import { createOllamaAdapter } from './adapters/ollama.ts'
import { createVectraAdapter } from './adapters/vectra.ts'
import { createWhisperAdapter } from './adapters/whisper.ts'
import { createNativeTTSAdapter } from './adapters/tts-native.ts'
import { isSoxInstalled, recordWithSilenceDetection } from './adapters/recorder.ts'
import { webSearchTool } from './adapters/tools/web.ts'
import { readFileTool, writeFileTool, listDirTool } from './adapters/tools/files.ts'
import { shellTool } from './adapters/tools/shell.ts'
import { calendarTool, emailTool, openAppTool, notifyTool } from './adapters/tools/system.ts'
import type { Tool } from './ports/tool.ts'

async function checkDependencies(): Promise<void> {
  const isSoxMissing = !isSoxInstalled()
  if (isSoxMissing) {
    console.error(chalk.red('sox is required for voice mode.'))
    console.error(chalk.dim('  macOS:  brew install sox'))
    console.error(chalk.dim('  Linux:  apt install sox'))
    process.exit(1)
  }
}

async function main(): Promise<void> {
  await checkDependencies()

  console.log(chalk.cyan('\n  IZAR — Voice Mode'))
  console.log(chalk.dim('  Loading Whisper model (downloads ~150MB on first run)...\n'))

  const [stt] = await Promise.all([createWhisperAdapter()])
  const tts = createNativeTTSAdapter()

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

  console.log(chalk.green('  Ready. Speak after the prompt — pausing stops the recording.\n'))

  while (true) {
    console.log(chalk.cyan('  ● Listening...'))

    let audioFile: string

    try {
      audioFile = await recordWithSilenceDetection()
    } catch (err: unknown) {
      console.error(chalk.red(`  Recording error: ${(err as Error).message}`))
      continue
    }

    const userText = await stt.transcribe(audioFile)
    fs.unlinkSync(audioFile)

    const isEmptyTranscription = !userText.trim()
    if (isEmptyTranscription) {
      continue
    }

    const isExitCommand = ['exit', 'quit', 'bye', 'goodbye'].includes(
      userText.toLowerCase().trim(),
    )
    if (isExitCommand) {
      break
    }

    console.log(chalk.white(`\n  You: ${userText}`))
    process.stdout.write(chalk.dim('  Thinking...'))

    try {
      const response = await agent.chat(userText)
      process.stdout.write('\r' + ' '.repeat(14) + '\r')
      console.log(chalk.cyan(`  IZAR: ${response}\n`))
      await tts.speak(response)
    } catch (err: unknown) {
      process.stdout.write('\n')
      console.error(chalk.red(`  Error: ${(err as Error).message}`))
    }
  }

  console.log(chalk.dim('\n  Shutting down.'))
}

main()
