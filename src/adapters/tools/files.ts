import fs from 'node:fs'
import path from 'node:path'
import type { Tool } from '../../ports/tool.ts'

function expandHomePath(rawPath: string): string {
  return rawPath.replace(/^~/, process.env.HOME ?? '')
}

export const readFileTool: Tool = {
  name: 'read_file',
  description: 'Read the contents of a file.',
  parameters: {
    path: { type: 'string', description: 'Absolute or ~ path to the file' },
  },
  async execute({ path: rawPath }) {
    const absolutePath = expandHomePath(String(rawPath))
    if (!fs.existsSync(absolutePath)) {
      return `File not found: ${rawPath}`
    }
    return fs.readFileSync(absolutePath, 'utf-8')
  },
}

export const writeFileTool: Tool = {
  name: 'write_file',
  description: 'Write content to a file, creating directories if needed.',
  parameters: {
    path: { type: 'string', description: 'Path to write to' },
    content: { type: 'string', description: 'Content to write' },
  },
  async execute({ path: rawPath, content }) {
    const absolutePath = expandHomePath(String(rawPath))
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
    fs.writeFileSync(absolutePath, String(content))
    return `Written to ${rawPath}`
  },
}

export const listDirTool: Tool = {
  name: 'list_dir',
  description: 'List files and folders in a directory.',
  parameters: {
    path: { type: 'string', description: 'Directory path', required: false },
  },
  async execute({ path: rawPath = '.' }) {
    const absolutePath = expandHomePath(String(rawPath))
    if (!fs.existsSync(absolutePath)) {
      return `Directory not found: ${rawPath}`
    }

    return fs
      .readdirSync(absolutePath, { withFileTypes: true })
      .map((entry) => `${entry.isDirectory() ? '[dir]' : '[file]'} ${entry.name}`)
      .join('\n')
  },
}
