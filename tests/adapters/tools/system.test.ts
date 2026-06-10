import { describe, it, expect } from 'bun:test'
import {
  calendarTool,
  emailTool,
  openAppTool,
  notifyTool,
} from '../../../src/adapters/tools/system.ts'

describe('calendarTool', () => {
  it('has the correct name and optional days parameter', () => {
    expect(calendarTool.name).toBe('get_calendar_events')
    expect(calendarTool.parameters.days.required).toBe(false)
  })

  it('returns macOS-only message on non-darwin platforms', async () => {
    if (process.platform === 'darwin') {
      return
    }

    const result = await calendarTool.execute({ days: 1 })
    expect(result).toContain('macOS')
  })

  it('executes via AppleScript on macOS and returns a string', async () => {
    if (process.platform !== 'darwin') {
      return
    }

    const result = await calendarTool.execute({ days: 1 })
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  }, 15_000)
})

describe('emailTool', () => {
  it('has the correct name and optional count parameter', () => {
    expect(emailTool.name).toBe('get_unread_emails')
    expect(emailTool.parameters.count.required).toBe(false)
  })

  it('returns macOS-only message on non-darwin platforms', async () => {
    if (process.platform === 'darwin') {
      return
    }

    const result = await emailTool.execute({ count: 5 })
    expect(result).toContain('macOS')
  })

  it('executes via AppleScript on macOS and returns a string', async () => {
    if (process.platform !== 'darwin') {
      return
    }

    const result = await emailTool.execute({ count: 5 })
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  }, 35_000)
})

describe('openAppTool', () => {
  it('has the correct name and target parameter', () => {
    expect(openAppTool.name).toBe('open_app')
    expect(openAppTool.parameters).toHaveProperty('target')
  })

  it('returns an error message for a non-existent path', async () => {
    const result = await openAppTool.execute({ target: '/nonexistent/izar_test_app.app' })
    expect(result).toContain('Error')
  })
})

describe('notifyTool', () => {
  it('has the correct name with title and message parameters', () => {
    expect(notifyTool.name).toBe('send_notification')
    expect(notifyTool.parameters).toHaveProperty('title')
    expect(notifyTool.parameters).toHaveProperty('message')
  })

  it('sends notification on macOS and returns a string', async () => {
    if (process.platform !== 'darwin') {
      return
    }

    const result = await notifyTool.execute({ title: 'IZAR', message: 'test' })
    expect(typeof result).toBe('string')
  })
})
