import { configError, isAdmin } from './_lib/auth.js'
import { json } from './_lib/http.js'

/** 前端載入時詢問目前是否已登入，以及網站是否已設定好登入功能 */
export async function GET(request: Request): Promise<Response> {
  return json({ admin: await isAdmin(request), configured: configError() === null })
}
