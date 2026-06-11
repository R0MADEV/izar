import type { Tool } from './tool.ts'

export type Message = {
  role: 'user' | 'assistant'
  content: string
}

export type OnToken = (delta: string) => void

export type LLMPort = {
  generate(system: string, messages: Message[], tools: Tool[], onToken?: OnToken): Promise<string>
}
