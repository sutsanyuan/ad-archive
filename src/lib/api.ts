import type { Archive } from '../types'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details: string[] = [],
  ) {
    super(message)
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      credentials: 'same-origin',
      ...init,
      headers: init.body ? { 'content-type': 'application/json' } : undefined,
    })
  } catch {
    throw new ApiError('連不上伺服器，請檢查網路', 0)
  }
  const body = (await res.json().catch(() => null)) as { error?: string; details?: string[] } | null
  if (!res.ok) throw new ApiError(body?.error ?? `發生錯誤（${res.status}）`, res.status, body?.details ?? [])
  return body as T
}

export interface Session {
  admin: boolean
  configured: boolean
}

/** 本機用 `npm run dev` 時沒有 API，回傳 null，前端就不顯示登入入口 */
export async function getSession(): Promise<Session | null> {
  try {
    const res = await fetch('/api/me', { credentials: 'same-origin' })
    if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return null
    return (await res.json()) as Session
  } catch {
    return null
  }
}

export const login = (password: string) =>
  call<{ admin: true }>('/api/login', { method: 'POST', body: JSON.stringify({ password }) })

export const logout = () => call<{ admin: false }>('/api/logout', { method: 'POST', body: '{}' })

export const fetchLatest = () => call<{ archive: Archive }>('/api/entries')

export const saveEntry = (issueDate: string, entry: Record<string, unknown>, mode: 'create' | 'update') =>
  call<{ archive: Archive; id: string }>('/api/entries', {
    method: 'POST',
    body: JSON.stringify({ issueDate, entry, mode }),
  })

export const removeEntry = (id: string) =>
  call<{ archive: Archive }>(`/api/entries?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
