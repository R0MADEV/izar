import { describe, it, expect } from 'bun:test'
import { shellTool } from '../../../src/adapters/tools/shell.ts'

describe('shellTool', () => {
  it('executes a command and returns stdout', async () => {
    const result = await shellTool.execute({ command: 'echo hello' })
    expect(result).toBe('hello')
  })

  it('returns error message on invalid command', async () => {
    const result = await shellTool.execute({ command: 'this_command_does_not_exist_xyz' })
    expect(result).toContain('Error')
  })

  it('returns (no output) when command produces no stdout', async () => {
    const result = await shellTool.execute({ command: 'true' })
    expect(result).toBe('(no output)')
  })
})
