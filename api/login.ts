import { checkPassword, configError, sessionCookie } from './_lib/auth.js'
import { checkSameOrigin, fail, json, readJson } from './_lib/http.js'

export async function POST(request: Request): Promise<Response> {
  const blocked = checkSameOrigin(request)
  if (blocked) return blocked
  const err = configError()
  if (err) return fail(503, err)

  const body = await readJson(request)
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!(await checkPassword(password))) {
    // 失敗時故意等一下，拖慢暴力猜密碼
    await new Promise((r) => setTimeout(r, 800))
    return fail(401, '密碼不正確')
  }
  return json({ admin: true }, 200, { 'set-cookie': await sessionCookie() })
}
