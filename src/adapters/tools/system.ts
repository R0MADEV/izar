import { execSync } from 'node:child_process'
import { platform } from 'node:os'
import type { Tool } from '../../ports/tool.ts'

const OPEN_COMMAND_BY_PLATFORM: Record<string, string> = {
  darwin: 'open',
  linux: 'xdg-open',
  win32: 'start',
}

function osascript(script: string): string {
  try {
    return execSync(`osascript -e '${script.replace(/'/g, "\\'")}'`, {
      encoding: 'utf-8',
      timeout: 10_000,
    }).trim()
  } catch (err: unknown) {
    return `Error: ${(err as Error).message}`
  }
}

export const calendarTool: Tool = {
  name: 'get_calendar_events',
  description: 'Get calendar events for the next N days. macOS only.',
  parameters: {
    days: { type: 'number', description: 'Days ahead to look (default: 1)', required: false },
  },
  async execute({ days = 1 }) {
    if (platform() !== 'darwin') return 'Calendar is only available on macOS.'
    return osascript(`
      set output to ""
      set targetDate to (current date) + (${days} * days)
      tell application "Calendar"
        repeat with cal in every calendar
          set evts to (every event of cal whose start date >= (current date) and start date <= targetDate)
          repeat with evt in evts
            set output to output & summary of evt & " @ " & (start date of evt as string) & linefeed
          end repeat
        end repeat
      end tell
      return output`) || 'No events found.'
  },
}

export const emailTool: Tool = {
  name: 'get_unread_emails',
  description: 'Get unread emails from Mail inbox. macOS only.',
  parameters: {
    count: { type: 'number', description: 'Max emails to return (default: 10)', required: false },
  },
  async execute({ count = 10 }) {
    if (platform() !== 'darwin') return 'Mail is only available on macOS.'
    return osascript(`
      set output to ""
      tell application "Mail"
        set msgs to (messages of inbox whose read status is false)
        set cnt to 0
        repeat with msg in msgs
          if cnt >= ${count} then exit repeat
          set output to output & subject of msg & " — " & sender of msg & linefeed
          set cnt to cnt + 1
        end repeat
      end tell
      return output`) || 'No unread emails.'
  },
}

export const openAppTool: Tool = {
  name: 'open_app',
  description: 'Open an application or file with the default system handler.',
  parameters: {
    target: { type: 'string', description: 'App name or file path to open' },
  },
  async execute({ target }) {
    const targetStr = String(target)
    const openCommand = OPEN_COMMAND_BY_PLATFORM[platform()] ?? 'open'

    try {
      execSync(`${openCommand} "${targetStr}"`, { timeout: 5_000 })
      return `Opened: ${targetStr}`
    } catch (err: unknown) {
      return `Error: ${(err as Error).message}`
    }
  },
}

export const notifyTool: Tool = {
  name: 'send_notification',
  description: 'Send a system notification to the user.',
  parameters: {
    title: { type: 'string', description: 'Notification title' },
    message: { type: 'string', description: 'Notification body' },
  },
  async execute({ title, message }) {
    const titleStr = String(title)
    const messageStr = String(message)

    if (platform() === 'darwin') {
      return osascript(`display notification "${messageStr}" with title "${titleStr}"`)
    }
    if (platform() === 'linux') {
      execSync(`notify-send "${titleStr}" "${messageStr}"`, { timeout: 5_000 })
      return 'Notification sent.'
    }
    if (platform() === 'win32') {
      execSync(
        `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('${messageStr}', '${titleStr}')"`,
        { timeout: 5_000 },
      )
      return 'Notification sent.'
    }
    return 'Notifications not supported on this platform.'
  },
}
