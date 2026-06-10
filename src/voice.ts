import 'dotenv/config'
import chalk from 'chalk'
import fs from 'node:fs'
import { config } from './config.ts'
import { buildAgent } from './compose.ts'
import { createWhisperAdapter } from './adapters/whisper.ts'
import { createNativeTTSAdapter } from './adapters/tts-native.ts'
import { isSoxInstalled, recordWithSilenceDetection } from './adapters/recorder.ts'
import { runBootstrap } from './setup.ts'

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
  await runBootstrap(config.ollamaUrl, config.ollamaModel)

  console.log(chalk.cyan('\n  IZAR — Voice Mode'))
  console.log(chalk.dim('  Loading Whisper model (downloads ~150MB on first run)...\n'))

  const [stt] = await Promise.all([createWhisperAdapter()])
  const tts = createNativeTTSAdapter()

  const agent = buildAgent()

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
