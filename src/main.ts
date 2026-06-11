import chalk from 'chalk'
import { parseCommand } from './cli-router.ts'
import { runChat } from './cli.ts'
import { runVoice } from './voice.ts'

const HELP_TEXT = `
${chalk.cyan('IZAR')} — asistente de IA personal y local

${chalk.bold('Uso:')}
  izar              Inicia el asistente en modo texto
  izar voice        Inicia el asistente en modo voz
  izar --help       Muestra esta ayuda

${chalk.bold('Configuración:')}
  Edita el archivo .env (se crea solo en el primer arranque).
  Correo: añade SMTP_USER y SMTP_PASS (app-password de Gmail).
  Voz: WAKE_WORD_ENABLED=true para activar la palabra "Izar".
`

async function main(): Promise<void> {
  const command = parseCommand(process.argv)

  if (command === 'voice') {
    await runVoice()
    return
  }
  if (command === 'help') {
    console.log(HELP_TEXT)
    return
  }
  await runChat()
}

main()
