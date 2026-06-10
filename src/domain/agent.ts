import type { LLMPort, Message } from '../ports/llm.ts'
import type { MemoryPort } from '../ports/memory.ts'
import type { Tool } from '../ports/tool.ts'

const MAX_HISTORY_MESSAGES = 20

const SYSTEM_PROMPT = `You are IZAR — a personal AI assistant running locally.
Be direct and action-oriented. Execute tasks, don't just describe them.
Today: {currentDate}

Relevant context from memory:
{pastConversations}`

function buildSystemPrompt(pastConversations: string): string {
  const currentDate = new Date().toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return SYSTEM_PROMPT
    .replace('{currentDate}', currentDate)
    .replace('{pastConversations}', pastConversations || 'None.')
}

export class Agent {
  private conversationHistory: Message[] = []

  constructor(
    private readonly llm: LLMPort,
    private readonly memory: MemoryPort,
    private readonly tools: Tool[],
  ) {}

  async chat(userMessage: string): Promise<string> {
    const pastConversations = await this.memory.recall(userMessage)
    const systemPrompt = buildSystemPrompt(pastConversations)

    const messagesWithNewInput: Message[] = [
      ...this.conversationHistory,
      { role: 'user', content: userMessage },
    ]

    const agentResponse = await this.llm.generate(systemPrompt, messagesWithNewInput, this.tools)

    this.conversationHistory.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: agentResponse },
    )

    if (this.conversationHistory.length > MAX_HISTORY_MESSAGES) {
      this.conversationHistory = this.conversationHistory.slice(-MAX_HISTORY_MESSAGES)
    }

    await this.memory.save(userMessage, agentResponse)
    return agentResponse
  }
}
