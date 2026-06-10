export type TTSPort = {
  speak(text: string): Promise<void>
}
