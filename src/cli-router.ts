export type Command = 'chat' | 'voice' | 'help'

const HELP_FLAGS = ['help', '--help', '-h']

export function parseCommand(argv: string[]): Command {
  const subcommand = argv[2]?.toLowerCase()

  if (!subcommand) {
    return 'chat'
  }
  if (subcommand === 'chat') {
    return 'chat'
  }
  if (subcommand === 'voice') {
    return 'voice'
  }
  if (HELP_FLAGS.includes(subcommand)) {
    return 'help'
  }
  return 'help'
}
