import { MOCK_WORKER } from './mock-data'

const IS_MOCK = process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

let mockSession: { user: { id: string; email: string } } | null = null

export function isMockMode() {
  return IS_MOCK
}

export function mockLogin(email: string, password: string) {
  if (email === 'worker@demo.com' && password === 'demo123') {
    mockSession = { user: { id: 'mock-user-001', email } }
    if (typeof window !== 'undefined') {
      localStorage.setItem('mock_session', JSON.stringify(mockSession))
    }
    return mockSession
  }
  throw new Error('Invalid credentials. Use worker@demo.com / demo123')
}

export function mockLogout() {
  mockSession = null
  if (typeof window !== 'undefined') {
    localStorage.removeItem('mock_session')
  }
}

export function getMockSession() {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('mock_session')
    return stored ? JSON.parse(stored) : null
  }
  return null
}

export function getMockWorker() {
  return MOCK_WORKER
}
