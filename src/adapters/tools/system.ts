import { execSync } from 'node:child_process'
import { platform } from 'node:os'
import type { Tool } from '../../ports/tool.ts'

const OPEN_COMMAND_BY_PLATFORM: Record<string, string> = {
  darwin: 'open',
  linux: 'xdg-open',
  win32: 'start',
}

function osascript(script: string, timeout = 30_000): string {
  try {
    return execSync(`osascript -e '${script.replace(/'/g, '\\\'')}' `, {
      encoding: 'utf-8',
      timeout,
    }).trim()
  } catch (err: unknown) {
    return `Error: ${(err as Error).message}`
  }
}

function epochsFromParams(
  days: number,
  from: string | undefined,
  to: string | undefined,
): [number, number] {
  if (from && to) {
    const fromDate = new Date(from)
    fromDate.setHours(0, 0, 0, 0)
    const toDate = new Date(to)
    toDate.setHours(23, 59, 59, 999)
    return [Math.floor(fromDate.getTime() / 1000), Math.floor(toDate.getTime() / 1000)]
  }
  const now = Math.floor(Date.now() / 1000)
  return [now, now + days * 86400]
}

function secondsFromNow(isoDate: string): number {
  return Math.floor((new Date(isoDate).getTime() - Date.now()) / 1000)
}

export const calendarTool: Tool = {
  name: 'get_calendar_events',
  description:
    'Get calendar events from macOS Calendar, including subscribed holiday calendars (festivos, celebrations, etc.). Supports date ranges. macOS only.',
  parameters: {
    days: {
      type: 'number',
      description: 'Days ahead from today. Use 1=tomorrow, 7=week, 30=month. Ignored if from/to set.',
      required: false,
    },
    from: {
      type: 'string',
      description: 'Start date YYYY-MM-DD (e.g. 2026-06-15). Use with "to" for a specific range.',
      required: false,
    },
    to: {
      type: 'string',
      description: 'End date YYYY-MM-DD (e.g. 2026-06-30). Use with "from" for a specific range.',
      required: false,
    },
  },
  async execute({ days = 30, from, to }) {
    if (platform() !== 'darwin') {
      return 'Calendar is only available on macOS.'
    }

    const [fromEpoch, toEpoch] = epochsFromParams(
      Number(days),
      from as string | undefined,
      to as string | undefined,
    )

    return (
      osascript(`
      set output to ""
      set fromDate to (current date) + (${fromEpoch - Math.floor(Date.now() / 1000)})
      set toDate to (current date) + (${toEpoch - Math.floor(Date.now() / 1000)})
      tell application "Calendar"
        repeat with cal in every calendar
          set evts to (every event of cal whose start date >= fromDate and start date <= toDate)
          repeat with evt in evts
            set evtLocation to location of evt
            set evtNotes to description of evt
            set evtUrl to url of evt
            if evtLocation is missing value then set evtLocation to ""
            if evtNotes is missing value then set evtNotes to ""
            if evtUrl is missing value then set evtUrl to ""
            set output to output & "EVENTO: " & summary of evt & linefeed
            set output to output & "  inicio: " & (start date of evt as string) & linefeed
            set output to output & "  fin: " & (end date of evt as string) & linefeed
            set output to output & "  calendario: " & name of cal & linefeed
            set output to output & "  todo el día: " & (allday event of evt) & linefeed
            if evtLocation is not "" then set output to output & "  lugar: " & evtLocation & linefeed
            if evtNotes is not "" then set output to output & "  notas: " & evtNotes & linefeed
            if evtUrl is not "" then set output to output & "  url: " & evtUrl & linefeed
            set output to output & linefeed
          end repeat
        end repeat
      end tell
      return output`) || 'No events found.'
    )
  },
}

export const createCalendarEventTool: Tool = {
  name: 'create_calendar_event',
  description: 'Create a new event in macOS Calendar. macOS only.',
  parameters: {
    title: { type: 'string', description: 'Event title' },
    start: { type: 'string', description: 'Start datetime in ISO format: 2026-06-21T10:00:00' },
    end: {
      type: 'string',
      description: 'End datetime in ISO format. Defaults to 1 hour after start.',
      required: false,
    },
    location: { type: 'string', description: 'Event location or address.', required: false },
    notes: { type: 'string', description: 'Event notes.', required: false },
    calendar: {
      type: 'string',
      description: 'Calendar name. Defaults to the first personal calendar.',
      required: false,
    },
  },
  async execute({ title, start, end, location, notes, calendar }) {
    if (platform() !== 'darwin') {
      return 'Calendar is only available on macOS.'
    }

    const startISO = String(start)
    const endISO = end ? String(end) : new Date(new Date(startISO).getTime() + 3600_000).toISOString()
    const startOffset = secondsFromNow(startISO)
    const endOffset = secondsFromNow(endISO)

    const locationLine = location
      ? `set location of newEvent to "${String(location).replace(/"/g, '\\"')}"`
      : ''
    const notesLine = notes
      ? `set description of newEvent to "${String(notes).replace(/"/g, '\\"')}"`
      : ''
    const calendarFilter = calendar
      ? `whose name is "${String(calendar).replace(/"/g, '\\"')}"`
      : 'whose writable is true'

    return osascript(`
      set startDate to (current date) + (${startOffset})
      set endDate to (current date) + (${endOffset})
      tell application "Calendar"
        set targetCalendar to first calendar ${calendarFilter}
        set newEvent to make new event at end of events of targetCalendar with properties {summary:"${String(title).replace(/"/g, '\\"')}", start date:startDate, end date:endDate}
        ${locationLine}
        ${notesLine}
      end tell
      return "Event created: ${String(title).replace(/"/g, '\\"')}"`)
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
