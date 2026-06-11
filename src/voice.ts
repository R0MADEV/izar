import 'dotenv/config'
import chalk from 'chalk'
import fs from 'node:fs'
import { config } from './config.ts'
import { buildAgent } from './compose.ts'
import { createWhisperAdapter } from './adapters/whisper.ts'
import { createNativeTTSAdapter } from './adapters/tts-native.ts'
import { isSoxInstalled, recordWithSilenceDetection } from './adapters/recorder.ts'
import { extractWakeWordCommand } from './domain/wake-word.ts'
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

  const [stt] = await Promise.all([
    createWhisperAdapter(config.whisperLanguage, config.whisperModel),
  ])
  const tts = createNativeTTSAdapter()

  const agent = buildAgent()

  const usesWakeWord = config.wakeWordEnabled
  const prompt = usesWakeWord
    ? '  Listo. Di "Izar" seguido de tu pregunta. Ej: "Izar, qué tengo mañana".\n'
    : '  Listo. Habla tu pregunta y haz una pausa al terminar.\n'
  const listeningLabel = usesWakeWord ? '  ● Escuchando "Izar"...\r' : '  ● Escuchando...\r'

  console.log(chalk.green(prompt))

  while (true) {
    process.stdout.write(chalk.dim(listeningLabel))

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

    const command = usesWakeWord ? extractWakeWordCommand(userText) : userText.trim()
    const isNotAddressingIzar = command === null
    if (isNotAddressingIzar) {
      continue
    }

    const isExitCommand = ['exit', 'quit', 'bye', 'goodbye', 'adiós', 'adios'].includes(
      command.toLowerCase().trim(),
    )
    if (isExitCommand) {
      break
    }

    const isOnlyWakeWord = !command.trim()
    if (isOnlyWakeWord) {
      await tts.speak('Dime')
      continue
    }

    console.log(chalk.white(`\n  You: ${command}`))
    process.stdout.write(chalk.dim('  Thinking...'))

    try {
      const response = await agent.chat(command)
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
