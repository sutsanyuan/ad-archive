import { clearCookie } from './_lib/auth.js'
import { checkSameOrigin, json } from './_lib/http.js'

export async function POST(request: Request): Promise<Response> {
  const blocked = checkSameOrigin(request)
  if (blocked) return blocked
  return json({ admin: false }, 200, { 'set-cookie': clearCookie() })
}
