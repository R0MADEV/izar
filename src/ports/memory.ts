export type MemoryPort = {
  save(input: string, output: string): Promise<void>
  recall(query: string): Promise<string>
}
