import { createOllama } from 'ollama-ai-provider'
import { generateText, tool as createAITool } from 'ai'
import { z } from 'zod'
import type { LLMPort, Message, OnToken } from '../ports/llm.ts'
import type { Tool } from '../ports/tool.ts'

const STREAM_DELAY_MS = 18

// Token-level streaming with tools is broken in ollama-ai-provider, so we
// generate the full response (tools work) and replay it word by word.
async function replayAsStream(text: string, onToken: OnToken): Promise<void> {
  const chunks = text.match(/\S+\s*/g) ?? []
  for (const chunk of chunks) {
    onToken(chunk)
    await new Promise((resolve) => setTimeout(resolve, STREAM_DELAY_MS))
  }
}

function buildZodSchema(
  toolParameters: Tool['parameters'],
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const zodShape: Record<string, z.ZodTypeAny> = {}

  for (const [paramName, paramDefinition] of Object.entries(toolParameters)) {
    const baseType =
      paramDefinition.type === 'string'
        ? z.string()
        : paramDefinition.type === 'number'
          ? z.preprocess((val) => {
            if (typeof val === 'number') {
              return val
            }
            const cleaned = String(val).replace(/[^0-9.-]/g, '')
            const parsed = Number(cleaned)
            return isNaN(parsed) ? undefined : parsed
          }, z.number())
          : z.coerce.boolean()

    const annotatedType = baseType.describe(paramDefinition.description)
    zodShape[paramName] =
      paramDefinition.required === false ? annotatedType.optional() : annotatedType
  }

  return z.object(zodShape)
}

function toAISDKToolsMap(tools: Tool[]) {
  return Object.fromEntries(
    tools.map((tool) => [
      tool.name,
      createAITool({
        description: tool.description,
        parameters: buildZodSchema(tool.parameters),
        execute: async (toolArgs) => tool.execute(toolArgs as Record<string, unknown>),
      }),
    ]),
  )
}

export function createOllamaAdapter(modelName: string, ollamaBaseUrl: string): LLMPort {
  const ollamaProvider = createOllama({ baseURL: `${ollamaBaseUrl}/api` })

  return {
    async generate(systemPrompt, conversationHistory, availableTools, onToken) {
      const sharedOptions = {
        model: ollamaProvider(modelName),
        system: systemPrompt,
        messages: conversationHistory as Message[],
        tools: toAISDKToolsMap(availableTools),
        maxSteps: 6,
      }

      const { text } = await generateText(sharedOptions)

      if (onToken) {
        await replayAsStream(text, onToken)
      }

      return text
    },
  }
}
