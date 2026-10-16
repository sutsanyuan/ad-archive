export function json(data: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  })
}

export function fail(status: number, message: string, details?: string[]): Response {
  return json({ error: message, details }, status)
}

export function env(name: string): string | undefined {
  const v = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[name]
  return v && v.trim() ? v.trim() : undefined
}

/**
 * 會改資料的請求必須來自同一個網站，並且是 JSON。
 * 搭配 SameSite=Strict cookie，擋掉跨站偽造請求（CSRF）。
 */
export function checkSameOrigin(request: Request): Response | null {
  const origin = request.headers.get('origin')
  const self = new URL(request.url).origin
  if (!origin || origin !== self) return fail(403, '請從網站本身操作')
  if (request.method !== 'DELETE' && !request.headers.get('content-type')?.includes('application/json')) {
    return fail(415, '請用 JSON 送出')
  }
  return null
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json()
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : null
  } catch {
    return null
  }
}
