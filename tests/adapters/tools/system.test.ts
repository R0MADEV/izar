import { describe, it, expect } from 'bun:test'
import {
  calendarTool,
  emailTool,
  openAppTool,
  notifyTool,
} from '../../../src/adapters/tools/system.ts'

describe('calendarTool', () => {
  it('has the correct name', () => {
    expect(calendarTool.name).toBe('get_calendar_events')
  })

  it('returns macOS-only message on non-darwin platforms', async () => {
    if (process.platform === 'darwin') {
      return
    }

    const result = await calendarTool.execute({ days: 1 })
    expect(result).toContain('macOS')
  })
})

describe('emailTool', () => {
  it('has the correct name', () => {
    expect(emailTool.name).toBe('get_unread_emails')
  })

  it('returns macOS-only message on non-darwin platforms', async () => {
    if (process.platform === 'darwin') {
      return
    }

    const result = await emailTool.execute({ count: 5 })
    expect(result).toContain('macOS')
  })
})

describe('openAppTool', () => {
  it('has the correct name', () => {
    expect(openAppTool.name).toBe('open_app')
  })

  it('returns an error message for invalid targets', async () => {
    const result = await openAppTool.execute({ target: '/nonexistent/app.app' })
    expect(typeof result).toBe('string')
  })
})

describe('notifyTool', () => {
  it('has the correct name', () => {
    expect(notifyTool.name).toBe('send_notification')
  })

  it('has title and message parameters', () => {
    expect(notifyTool.parameters).toHaveProperty('title')
    expect(notifyTool.parameters).toHaveProperty('message')
  })
})
