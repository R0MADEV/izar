import { useState, useCallback } from 'react'
import { Box, Text, useApp } from 'ink'
import Gradient from 'ink-gradient'
import BigText from 'ink-big-text'
import Spinner from 'ink-spinner'
import TextInput from 'ink-text-input'
import { getTheme, themeNames, type Theme } from './themes.ts'
import { ArcReactor } from './ArcReactor.tsx'
import { Telemetry } from './Telemetry.tsx'
import { ActivityGraph } from './ActivityGraph.tsx'
import { Clock } from './Clock.tsx'
import { WeatherWidget } from './WeatherWidget.tsx'
import { useTerminalSize } from './useTerminalSize.ts'
import { parseChatInput, isVoiceExit } from '../domain/chat-input.ts'
import type { Agent } from '../domain/agent.ts'
import type { TelemetryPort } from '../ports/telemetry.ts'
import type { WeatherPort } from '../ports/weather.ts'

export type Status = 'idle' | 'thinking' | 'loading' | 'listening' | 'transcribing'

export type VoiceCapture = (onStage?: (stage: 'loading' | 'listening' | 'transcribing') => void) => Promise<string>

type Message = { role: 'user' | 'izar' | 'system'; content: string }

type AppProps = {
  agent: Agent
  captureVoice: VoiceCapture
  speak: (text: string) => Promise<void>
  telemetry: TelemetryPort
  weather: WeatherPort
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
      <Text color={color}>{status === 'idle' ? '◉' : <Spinner type="dots" />}</Text>
      <Text color={color}>{' ' + STATUS_LABEL[status]}</Text>
    </Box>
  )
}

function Sidebar({
  status,
  theme,
  telemetry,
  weather,
  width,
}: {
  status: Status
  theme: Theme
  telemetry: TelemetryPort
  weather: WeatherPort
  width: number
}) {
  return (
    <Box
      flexDirection="column"
      justifyContent="space-between"
      paddingX={1}
      width={width}
      flexShrink={0}
      marginRight={2}
    >
      <Box flexDirection="column" alignItems="center">
        <Gradient colors={[...theme.gradient]}>
          <BigText text="IZAR" font="block" />
        </Gradient>
        <Clock theme={theme} />
        <WeatherWidget source={weather} theme={theme} />
      </Box>

      <Box flexDirection="column" alignItems="center">
        <ArcReactor active={status !== 'idle'} theme={theme} width={width - 2} />
        <Box marginTop={1}>
          <StatusBadge status={status} theme={theme} />
        </Box>
      </Box>

      <Box flexDirection="column" alignItems="center">
        <Telemetry source={telemetry} theme={theme} />
        <Box marginTop={1}>
          <ActivityGraph source={telemetry} theme={theme} />
        </Box>
        <Box marginTop={1}>
          <Text color={theme.dim}>tema · {theme.name}</Text>
        </Box>
      </Box>
    </Box>
  )
}

function MessageView({ message, theme }: { message: Message; theme: Theme }) {
  if (message.role === 'system') {
    return (
      <Box marginBottom={1} paddingLeft={1}>
        <Text color={theme.dim}>⋯ {message.content}</Text>
      </Box>
    )
  }

  const isUser = message.role === 'user'
  const label = isUser ? '▎ TÚ' : '▎ IZAR ◉'
  const color = isUser ? theme.user : theme.primary
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color={color} bold>
        {label}
      </Text>
      <Box paddingLeft={2}>
        <Text color={theme.text}>{message.content}</Text>
      </Box>
    </Box>
  )
}

export function App({ agent, captureVoice, speak, telemetry, weather, initialTheme }: AppProps) {
  const { exit } = useApp()
  const { columns, rows } = useTerminalSize()
  const [theme, setTheme] = useState<Theme>(getTheme(initialTheme))
  const [messages, setMessages] = useState<Message[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [input, setInput] = useState('')

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message])
  }, [])

  // Replaces the last message (always the streaming IZAR message) with new content.
  const setLastMessage = useCallback((content: string) => {
    setMessages((prev) => {
      const next = [...prev]
      next[next.length - 1] = { role: 'izar', content }
      return next
    })
  }, [])

  const sendToAgent = useCallback(
    async (text: string): Promise<string | null> => {
      // User message + empty IZAR message added together; IZAR is always last.
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: text },
        { role: 'izar', content: '' },
      ])
      setStatus('thinking')

      let streamed = ''
      const appendToken = (delta: string) => {
        streamed += delta
        setLastMessage(streamed)
      }

      try {
        const response = await agent.chat(text, appendToken)
        setLastMessage(response)
        return response
      } catch (err: unknown) {
        setLastMessage(`Error: ${(err as Error).message}`)
        return null
      } finally {
        setStatus('idle')
      }
    },
    [agent, setLastMessage],
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
    <Box flexDirection="row" width={columns} height={rows - 1} paddingX={1} paddingTop={1}>
      <Sidebar
        status={status}
        theme={theme}
        telemetry={telemetry}
        weather={weather}
        width={Math.max(24, Math.floor(columns * 0.33))}
      />

      <Box flexDirection="column" flexGrow={1}>
        <Box flexDirection="column" flexGrow={1} justifyContent="flex-end">
          {messages.length === 0 ? (
            <Box>
              <Text color={theme.dim}>
                Hola. Soy IZAR. Escribe tu pregunta o di /voz para hablar.
              </Text>
            </Box>
          ) : (
            messages.map((message, index) => (
              <MessageView key={index} message={message} theme={theme} />
            ))
          )}
        </Box>

        <Box>
          <Text color={isBusy ? theme.accent : theme.primary} bold>
            {isBusy ? '◌ ' : '❯ '}
          </Text>
          {isBusy ? (
            <Text color={theme.dim}>{STATUS_LABEL[status]}</Text>
          ) : (
            <TextInput
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              placeholder="escribe  ·  /voz hablar  ·  /theme  ·  /clear  ·  exit"
            />
          )}
        </Box>
      </Box>
    </Box>
  )
}
