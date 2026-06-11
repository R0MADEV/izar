import { useState, useCallback } from 'react'
import { Box, Text, useApp } from 'ink'
import Gradient from 'ink-gradient'
import BigText from 'ink-big-text'
import Spinner from 'ink-spinner'
import TextInput from 'ink-text-input'
import { getTheme, themeNames, type Theme } from './themes.ts'
import { parseChatInput, isVoiceExit } from '../domain/chat-input.ts'
import type { Agent } from '../domain/agent.ts'

export type Status = 'idle' | 'thinking' | 'loading' | 'listening' | 'transcribing'

export type VoiceCapture = (onStage?: (stage: 'loading' | 'listening' | 'transcribing') => void) => Promise<string>

type Message = { role: 'user' | 'izar' | 'system'; content: string }

type AppProps = {
  agent: Agent
  captureVoice: VoiceCapture
  speak: (text: string) => Promise<void>
  initialTheme: string
}

const STATUS_LABEL: Record<Status, string> = {
  idle: '● online',
  thinking: 'pensando',
  loading: 'cargando voz (1ª vez tarda)',
  listening: '● escuchando, habla...',
  transcribing: 'transcribiendo',
}

function StatusBadge({ status, theme }: { status: Status; theme: Theme }) {
  const color = status === 'idle' ? theme.success : theme.accent
  return (
    <Box>
      {status !== 'idle' && (
        <Text color={color}>
          <Spinner type="dots" />{' '}
        </Text>
      )}
      <Text color={color}>{STATUS_LABEL[status]}</Text>
    </Box>
  )
}

function Header({ status, theme }: { status: Status; theme: Theme }) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Gradient colors={[...theme.gradient]}>
        <BigText text="IZAR" font="tiny" />
      </Gradient>
      <Box justifyContent="space-between">
        <Text color={theme.dim}>asistente personal · local · {theme.name}</Text>
        <StatusBadge status={status} theme={theme} />
      </Box>
    </Box>
  )
}

function MessageView({ message, theme }: { message: Message; theme: Theme }) {
  if (message.role === 'system') {
    return (
      <Box marginBottom={1}>
        <Text color={theme.dim}>{message.content}</Text>
      </Box>
    )
  }

  const isUser = message.role === 'user'
  const label = isUser ? 'TÚ' : 'IZAR'
  const color = isUser ? theme.user : theme.primary
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color={color} bold>
        {label}
      </Text>
      <Text color={theme.text}>{message.content}</Text>
    </Box>
  )
}

export function App({ agent, captureVoice, speak, initialTheme }: AppProps) {
  const { exit } = useApp()
  const [theme, setTheme] = useState<Theme>(getTheme(initialTheme))
  const [messages, setMessages] = useState<Message[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [input, setInput] = useState('')

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message])
  }, [])

  const sendToAgent = useCallback(
    async (text: string): Promise<string | null> => {
      addMessage({ role: 'user', content: text })
      setStatus('thinking')
      try {
        const response = await agent.chat(text)
        addMessage({ role: 'izar', content: response })
        return response
      } catch (err: unknown) {
        addMessage({ role: 'izar', content: `Error: ${(err as Error).message}` })
        return null
      } finally {
        setStatus('idle')
      }
    },
    [agent, addMessage],
  )

  // Voice mode stays active: listen → respond → listen again, until the user
  // says an exit phrase ("texto", "para", "basta"...).
  const runVoiceConversation = useCallback(async () => {
    addMessage({ role: 'system', content: 'Modo voz activo. Di "texto" o "para" para volver a escribir.' })

    while (true) {
      let transcript: string
      try {
        transcript = await captureVoice((stage) => setStatus(stage))
      } catch (err: unknown) {
        addMessage({ role: 'izar', content: `Error de voz: ${(err as Error).message}` })
        break
      }

      const heard = transcript.trim()
      if (!heard) {
        addMessage({ role: 'system', content: 'No te oí. Habla más cerca del micro o di "para".' })
        continue
      }
      if (isVoiceExit(heard)) {
        addMessage({ role: 'system', content: 'Modo voz desactivado.' })
        break
      }

      const response = await sendToAgent(heard)
      if (response) {
        setStatus('thinking')
        await speak(response)
        setStatus('idle')
      }
    }

    setStatus('idle')
  }, [captureVoice, sendToAgent, addMessage, speak])

  const changeTheme = useCallback(
    (name: string) => {
      if (!name) {
        addMessage({ role: 'system', content: `Themes: ${themeNames.join(', ')}. Usa /theme <nombre>.` })
        return
      }
      const next = getTheme(name)
      setTheme(next)
      addMessage({ role: 'system', content: `Theme cambiado a "${next.name}".` })
    },
    [addMessage],
  )

  const handleSubmit = useCallback(
    async (value: string) => {
      setInput('')
      const parsed = parseChatInput(value)

      if (parsed.type === 'exit') {
        exit()
        return
      }
      if (parsed.type === 'clear') {
        setMessages([])
        return
      }
      if (parsed.type === 'theme') {
        changeTheme(parsed.name)
        return
      }
      if (parsed.type === 'voice') {
        await runVoiceConversation()
        return
      }
      if (parsed.type === 'message') {
        await sendToAgent(parsed.text)
      }
    },
    [exit, runVoiceConversation, sendToAgent, changeTheme],
  )

  const isBusy = status !== 'idle'

  return (
    <Box flexDirection="column" paddingX={1}>
      <Header status={status} theme={theme} />

      {messages.map((message, index) => (
        <MessageView key={index} message={message} theme={theme} />
      ))}

      <Box marginTop={1}>
        <Text color={theme.primary}>{'› '}</Text>
        {isBusy ? (
          <Text color={theme.dim}>…</Text>
        ) : (
          <TextInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            placeholder="escribe, o /voz · /theme · /clear · exit"
          />
        )}
      </Box>
    </Box>
  )
}
