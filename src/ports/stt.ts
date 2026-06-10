export type STTPort = {
  transcribe(audioFilePath: string): Promise<string>
}
