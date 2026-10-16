import { deleteEntry, findEntry, normalizeEntry, uniqueId, upsertEntry, validateArchive } from '../shared/schema.js'
import type { Archive } from '../src/types'
import { requireAdmin } from './_lib/auth.js'
import { GitHubError, readArchive, updateArchive } from './_lib/github.js'
import { checkSameOrigin, fail, json, readJson } from './_lib/http.js'

class BadRequest extends Error {
  constructor(
    message: string,
    readonly status = 400,
    readonly details?: string[],
  ) {
    super(message)
  }
}

function handleError(e: unknown): Response {
  if (e instanceof BadRequest) return fail(e.status, e.message, e.details)
  if (e instanceof GitHubError) return fail(e.status, e.message)
  console.error(e)
  return fail(500, '伺服器發生錯誤')
}

function checked(next: Archive): Archive {
  const errors = validateArchive(next)
  if (errors.length) throw new BadRequest('資料沒有通過檢查', 400, errors)
  return next
}

/** 管理者讀最新資料（直接從 GitHub 讀，不必等網站重新部署） */
export async function GET(request: Request): Promise<Response> {
  const denied = await requireAdmin(request)
  if (denied) return denied
  try {
    const { archive } = await readArchive()
    return json({ archive })
  } catch (e) {
    return handleError(e)
  }
}

/**
 * 新增或編輯一則。
 * body: { issueDate: 'YYYY-MM-DD', entry: {...}, mode: 'create' | 'update' }
 */
export async function POST(request: Request): Promise<Response> {
  const blocked = checkSameOrigin(request) ?? (await requireAdmin(request))
  if (blocked) return blocked

  const body = await readJson(request)
  const issueDate = typeof body?.issueDate === 'string' ? body.issueDate : ''
  const mode = body?.mode === 'update' ? 'update' : 'create'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(issueDate)) return fail(400, '期數日期格式要 YYYY-MM-DD')

  const { entry, errors } = normalizeEntry(body?.entry)
  if (errors.length) return fail(400, '內容需要修正', errors)

  try {
    let savedId = entry.id
    const archive = await updateArchive((current) => {
      let next: Archive
      if (mode === 'update') {
        const existing = findEntry(current, entry.id)
        if (!existing) throw new BadRequest('找不到這一則，可能已經被刪除', 404)
        // 「Claude 挑選」的標記由系統決定，編輯時沿用原本的
        const merged = { ...entry, by: existing.entry.by }
        if (!merged.by) delete merged.by
        next = upsertEntry(current, issueDate, merged)
        return { next: checked(next), message: `edit: 更新「${entry.brand}：${entry.title}」（網站編輯）` }
      }
      savedId = uniqueId(current, entry.id)
      const fresh = { ...entry, id: savedId }
      delete fresh.by
      next = upsertEntry(current, issueDate, fresh)
      return { next: checked(next), message: `edit: 新增「${entry.brand}：${entry.title}」（網站編輯）` }
    })
    return json({ archive, id: savedId })
  } catch (e) {
    return handleError(e)
  }
}

/** 刪除一則：DELETE /api/entries?id=xxx */
export async function DELETE(request: Request): Promise<Response> {
  const blocked = checkSameOrigin(request) ?? (await requireAdmin(request))
  if (blocked) return blocked

  const id = new URL(request.url).searchParams.get('id') ?? ''
  if (!/^[a-z0-9-]{1,80}$/.test(id)) return fail(400, 'id 格式不正確')

  try {
    const archive = await updateArchive((current) => {
      const found = findEntry(current, id)
      const next = deleteEntry(current, id)
      if (!found || !next) throw new BadRequest('找不到這一則，可能已經被刪除', 404)
      return { next: checked(next), message: `edit: 刪除「${found.entry.brand}：${found.entry.title}」（網站編輯）` }
    })
    return json({ archive })
  } catch (e) {
    return handleError(e)
  }
}
