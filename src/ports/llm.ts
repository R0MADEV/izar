import type { Tool } from './tool.ts'

export type Message = {
  role: 'user' | 'assistant'
  content: string
}

export type LLMPort = {
  generate(system: string, messages: Message[], tools: Tool[]): Promise<string>
}
