import { execSync } from 'node:child_process'
import { platform } from 'node:os'
import type { Tool } from '../../ports/tool.ts'

const SHELL_BY_PLATFORM: Record<string, string> = {
  win32: 'powershell',
  darwin: 'bash',
  linux: 'bash',
}

export const shellTool: Tool = {
  name: 'run_shell',
  description: 'Execute a shell command. bash on macOS/Linux, PowerShell on Windows.',
  parameters: {
    command: { type: 'string', description: 'The command to execute' },
  },
  async execute({ command }) {
    const shellExecutable = SHELL_BY_PLATFORM[platform()] ?? 'bash'

    try {
      const output = execSync(String(command), {
        shell: shellExecutable,
        timeout: 30_000,
        encoding: 'utf-8',
      })
      return output.trim() || '(no output)'
    } catch (error: unknown) {
      return `Error: ${(error as Error).message}`
    }
  },
}
