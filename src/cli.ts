import 'dotenv/config'
import { createElement } from 'react'
import { render } from 'ink'
import { config } from './config.ts'
import { buildAgent } from './compose.ts'
import { runBootstrap } from './setup.ts'
import { App } from './ui/App.tsx'
import { createVoiceCapture } from './ui/voice-capture.ts'
import { createNativeTTSAdapter } from './adapters/tts-native.ts'
import { createTelemetryAdapter } from './adapters/telemetry.ts'
import { createWeatherAdapter } from './adapters/weather.ts'

export async function runChat(): Promise<void> {
  await runBootstrap(config.ollamaUrl, config.ollamaModel)

  const agent = buildAgent()
  const captureVoice = createVoiceCapture()
  const tts = createNativeTTSAdapter()
  const telemetry = createTelemetryAdapter()
  const weather = createWeatherAdapter()

  const { waitUntilExit } = render(
    createElement(App, {
      agent,
      captureVoice,
      speak: (text: string) => tts.speak(text),
      telemetry,
      weather,
      initialTheme: config.uiTheme,
    }),
  )

  await waitUntilExit()
}
