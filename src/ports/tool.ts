export type Parameter = {
  type: 'string' | 'number' | 'boolean'
  description: string
  required?: boolean
}

export type Tool = {
  name: string
  description: string
  parameters: Record<string, Parameter>
  execute(args: Record<string, unknown>): Promise<string>
}
