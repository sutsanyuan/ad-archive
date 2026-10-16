// 資料格式與驗證規則。前端表單、Vercel API、scripts/check-data.mjs 共用這一份，
// 確保網站編輯、Claude 每月更新、手動修改都遵守同一套規則。

export const KINDS = ['campaign', 'packaging', 'web', 'article', 'social']

const LIMITS = { brand: 120, title: 160, note: 2000, detail: 2000, why: 1000, agency: 120, market: 80 }
const TRACKING = /^(utm_|fbclid$|gclid$|igsh$|__cf_chl)/

/** 接受 YouTube 網址或 11 碼 ID，回傳 ID；無法辨識回傳 null */
export function parseYouTubeId(input) {
  const s = String(input ?? '').trim()
  if (!s) return null
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s
  try {
    const u = new URL(s)
    const host = u.hostname.replace(/^(www\.|m\.)/, '')
    let id = null
    if (host === 'youtu.be') id = u.pathname.slice(1)
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      id = u.searchParams.get('v') ?? u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1] ?? null
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null
  } catch {
    return null
  }
}

/** 去掉追蹤參數；不是 https 網址回傳 null */
export function cleanUrl(input) {
  try {
    const u = new URL(String(input ?? '').trim())
    if (u.protocol !== 'https:') return null
    for (const key of [...u.searchParams.keys()]) if (TRACKING.test(key)) u.searchParams.delete(key)
    return u.toString()
  } catch {
    return null
  }
}

/** 由品牌與標題產生 id；非英數字元（例如中文）會被略過，全部略過時用時間碼 */
export function slugify(...parts) {
  const slug = parts
    .join(' ')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '')
  return slug || `ad-${Date.now().toString(36)}`
}

function str(v, max, field, errors, required = false) {
  const s = typeof v === 'string' ? v.trim() : v == null ? '' : null
  if (s === null) {
    errors.push(`${field} 必須是文字`)
    return ''
  }
  if (required && !s) errors.push(`${field} 不能空白`)
  if (s.length > max) errors.push(`${field} 最多 ${max} 字`)
  return s
}

/**
 * 把任意輸入整理成乾淨的 entry：只保留認得的欄位、去掉空白與追蹤參數、YouTube 網址轉成 ID。
 * 回傳 { entry, errors }，errors 為空才可以寫入。
 */
export function normalizeEntry(input) {
  const errors = []
  const raw = input && typeof input === 'object' ? input : {}

  const brand = str(raw.brand, LIMITS.brand, '品牌', errors, true)
  const title = str(raw.title, LIMITS.title, '標題', errors, true)
  const entry = {
    id: typeof raw.id === 'string' && raw.id ? raw.id : slugify(brand, title),
    brand,
    title,
    kind: KINDS.includes(raw.kind) ? raw.kind : (errors.push('類型不正確'), 'campaign'),
    tags: [],
  }

  const tags = Array.isArray(raw.tags) ? raw.tags : String(raw.tags ?? '').split(/[,，、]/)
  entry.tags = [...new Set(tags.map((t) => String(t).trim()).filter(Boolean))]
  if (entry.tags.length === 0) errors.push('至少要一個標籤')
  if (entry.tags.length > 6) errors.push('標籤最多 6 個')
  if (entry.tags.some((t) => t.length > 30)) errors.push('每個標籤最多 30 字')

  if (raw.by === 'claude') entry.by = 'claude'
  entry.note = str(raw.note, LIMITS.note, '觀點', errors)
  for (const key of ['detail', 'why', 'agency', 'market']) {
    const v = str(raw[key], LIMITS[key], key, errors)
    if (v) entry[key] = v
  }

  if (raw.image) {
    const image = cleanUrl(raw.image)
    if (image) entry.image = image
    else errors.push('縮圖必須是 https 網址')
  }
  if (raw.youtube) {
    const id = parseYouTubeId(raw.youtube)
    if (id) entry.youtube = id
    else errors.push('看不懂這個 YouTube 網址')
  }

  entry.links = []
  for (const l of Array.isArray(raw.links) ? raw.links : []) {
    const url = cleanUrl(l?.url)
    const label = String(l?.label ?? '').trim()
    if (!url) errors.push(`連結必須是 https 網址：${l?.url ?? ''}`)
    else entry.links.push({ label: label.slice(0, 60) || new URL(url).hostname.replace(/^www\./, ''), url })
  }
  if (entry.links.length > 10) errors.push('連結最多 10 個')

  if (!/^[a-z0-9-]{1,80}$/.test(entry.id)) errors.push('id 只能用小寫英數與 -')
  return { entry, errors }
}

/** 檢查整份資料；回傳錯誤訊息陣列，空陣列代表通過 */
export function validateArchive(archive) {
  const errors = []
  const ids = new Set()
  if (!archive || !Array.isArray(archive.issues)) return ['缺少 issues 陣列']
  let prev = '9999-99-99'
  for (const issue of archive.issues) {
    const at = `期數 ${issue.id}`
    if (!/^\d{4}-\d{2}-\d{2}$/.test(issue.date ?? '')) errors.push(`${at}: date 格式要 YYYY-MM-DD`)
    if (issue.id !== issue.date) errors.push(`${at}: id 應等於 date`)
    if (issue.date >= prev) errors.push(`${at}: issues 要由新到舊排列且不重複`)
    prev = issue.date
    if (!Array.isArray(issue.entries) || issue.entries.length === 0) errors.push(`${at}: 沒有任何一則`)
    for (const l of issue.links ?? []) if (!cleanUrl(l.url)) errors.push(`${at}: 連結格式錯誤 ${l.url}`)
    for (const e of issue.entries ?? []) {
      const { entry, errors: errs } = normalizeEntry(e)
      for (const msg of errs) errors.push(`${at} › ${e.id}: ${msg}`)
      if (e.id !== entry.id) errors.push(`${at} › ${e.id}: id 格式錯誤`)
      if (ids.has(e.id)) errors.push(`${at} › ${e.id}: id 重複`)
      ids.add(e.id)
      if (e.youtube && e.youtube !== entry.youtube) errors.push(`${at} › ${e.id}: youtube 只填 11 碼 ID`)
      for (const l of e.links ?? []) {
        if (cleanUrl(l.url) !== l.url && cleanUrl(l.url) !== null)
          errors.push(`${at} › ${e.id}: 連結帶有追蹤參數 ${l.url}`)
      }
      if (e.by === 'claude' && !e.why) errors.push(`${at} › ${e.id}: Claude 挑選的需要 why`)
    }
  }
  return errors
}

/** 新增或更新一則。id 已存在就原地更新（期數不同時搬過去），否則加到該期最後面。 */
export function upsertEntry(archive, issueDate, entry) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(issueDate ?? '')) throw new Error('期數日期格式要 YYYY-MM-DD')
  const issues = archive.issues.map((i) => ({ ...i, entries: [...i.entries] }))
  let replaced = false
  for (const issue of issues) {
    const idx = issue.entries.findIndex((e) => e.id === entry.id)
    if (idx === -1) continue
    if (issue.date === issueDate) {
      issue.entries[idx] = entry
      replaced = true
    } else {
      issue.entries.splice(idx, 1)
    }
  }
  if (!replaced) {
    let target = issues.find((i) => i.date === issueDate)
    if (!target) {
      target = { id: issueDate, date: issueDate, entries: [] }
      issues.push(target)
    }
    target.entries.push(entry)
  }
  return {
    ...archive,
    issues: issues.filter((i) => i.entries.length > 0).sort((a, b) => (a.date < b.date ? 1 : -1)),
  }
}

/** 產生不和現有資料重複的 id */
export function uniqueId(archive, base) {
  const taken = new Set(archive.issues.flatMap((i) => i.entries.map((e) => e.id)))
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}

export function deleteEntry(archive, id) {
  let found = false
  const issues = archive.issues
    .map((i) => {
      const entries = i.entries.filter((e) => e.id !== id)
      if (entries.length !== i.entries.length) found = true
      return { ...i, entries }
    })
    .filter((i) => i.entries.length > 0)
  return found ? { ...archive, issues } : null
}

export function findEntry(archive, id) {
  for (const issue of archive.issues) {
    const entry = issue.entries.find((e) => e.id === id)
    if (entry) return { issue, entry }
  }
  return null
}
