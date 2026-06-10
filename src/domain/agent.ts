import os from 'node:os'
import type { LLMPort, Message } from '../ports/llm.ts'
import type { MemoryPort } from '../ports/memory.ts'
import type { Tool } from '../ports/tool.ts'

const MAX_HISTORY_MESSAGES = 20

const SYSTEM_PROMPT = `You are IZAR, a personal AI assistant running locally on macOS.
Be direct and action-oriented. Always use tools to get real data — never guess or hallucinate.

Critical tool usage rules:
- Web searches: ALWAYS use the web_search tool. NEVER use run_shell with curl, wget or URLs.
- File listing: ALWAYS use the list_dir tool. User home directory is {homeDir}.
- Current time/date: use run_shell with the 'date' command.
- Calendar events, holidays, festivos: ALWAYS use get_calendar_events tool — it reads ALL calendars including subscribed holiday calendars. For "this week" use days:7, for "this month" use days:30, for "this year" use days:365. NEVER guess or invent holidays.
- Creating events: use create_calendar_event with ISO datetime (e.g. 2026-06-21T10:00:00).
- Reading emails: use get_emails. Sending email: ALWAYS use send_email with to, subject and body — extract the recipient address, the subject and the message body from the user's request even if phrased informally. NEVER use web_search for sending email.
- When reporting dates: if the event is tomorrow, say "mañana". If today, say "hoy". Use relative terms, not "el próximo X".
- If a tool returns results, report them directly. Do NOT preface with "Lo siento" or "no pude encontrar".
- If a tool returns "No events found." or "No results found." — say exactly that, nothing else.
- If a tool call fails, say what failed. Do NOT invent results.

Today: {currentDate}
User home: {homeDir}

Relevant context from memory:
{pastConversations}`

function buildSystemPrompt(pastConversations: string): string {
  const currentDate = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const homeDir = os.homedir()

  return SYSTEM_PROMPT.replace('{currentDate}', currentDate)
    .replace('{pastConversations}', pastConversations || 'None.')
    .replace(/{homeDir}/g, homeDir)
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
