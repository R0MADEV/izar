export type Theme = {
  name: string
  primary: string
  accent: string
  dim: string
  text: string
  user: string
  success: string
  error: string
  gradient: [string, string]
}

const THEMES: Record<string, Theme> = {
  jarvis: {
    name: 'jarvis',
    primary: '#00d8ff',
    accent: '#ffb000',
    dim: '#3a6c78',
    text: '#cfe9f0',
    user: '#7fd8ff',
    success: '#39ff14',
    error: '#ff4d4d',
    gradient: ['#00d8ff', '#0077ff'],
  },
  matrix: {
    name: 'matrix',
    primary: '#00ff66',
    accent: '#aaff00',
    dim: '#1f5a2e',
    text: '#b8ffcb',
    user: '#5cff8f',
    success: '#00ff66',
    error: '#ff5555',
    gradient: ['#00ff66', '#008f3a'],
  },
  amber: {
    name: 'amber',
    primary: '#ffb000',
    accent: '#ff7b00',
    dim: '#7a5210',
    text: '#ffe0a3',
    user: '#ffcb5c',
    success: '#ffd000',
    error: '#ff5544',
    gradient: ['#ffd000', '#ff7b00'],
  },
  synthwave: {
    name: 'synthwave',
    primary: '#ff2fd0',
    accent: '#00e5ff',
    dim: '#5a2a6c',
    text: '#f5d0ff',
    user: '#ff8fe6',
    success: '#48ff9b',
    error: '#ff4d6d',
    gradient: ['#ff2fd0', '#7a00ff'],
  },
}

export const DEFAULT_THEME = 'jarvis'
export const themeNames = Object.keys(THEMES)

export function getTheme(name: string): Theme {
  const key = name.trim().toLowerCase()
  return THEMES[key] ?? THEMES[DEFAULT_THEME]
}
