// 檢查 src/data 的 JSON 格式，每月更新後、commit 前執行：npm run check-data
import { readFileSync } from 'node:fs'

const KINDS = ['campaign', 'packaging', 'web', 'article', 'social']
const errors = []
const ids = new Set()

const load = (f) => JSON.parse(readFileSync(new URL(`../src/data/${f}`, import.meta.url), 'utf8'))

function checkLinks(where, links) {
  if (!Array.isArray(links)) return errors.push(`${where}: links 必須是陣列`)
  for (const l of links) {
    if (!l.label || !/^https:\/\//.test(l.url ?? '')) errors.push(`${where}: 連結格式錯誤 ${JSON.stringify(l)}`)
    if (/[?&](utm_|__cf_chl|fbclid)/.test(l.url ?? '')) errors.push(`${where}: 連結帶有追蹤參數 ${l.url}`)
  }
}

function checkEntry(where, e, isPick = false) {
  const at = `${where} › ${e.id ?? '(沒有 id)'}`
  if (!/^[a-z0-9-]+$/.test(e.id ?? '')) errors.push(`${at}: id 只能用小寫英數與 -`)
  if (ids.has(e.id)) errors.push(`${at}: id 重複`)
  ids.add(e.id)
  for (const k of ['brand', 'title']) if (!e[k]) errors.push(`${at}: 缺少 ${k}`)
  if (typeof e.note !== 'string') errors.push(`${at}: note 必須是字串（可以是空字串）`)
  if (!KINDS.includes(e.kind)) errors.push(`${at}: kind 必須是 ${KINDS.join('/')}`)
  if (!Array.isArray(e.tags) || e.tags.length === 0) errors.push(`${at}: 至少要一個 tag`)
  if (isPick && !e.why) errors.push(`${at}: 候選需要 why`)
  if (e.image !== undefined && !/^https:\/\//.test(e.image)) errors.push(`${at}: image 必須是 https 網址`)
  checkLinks(at, e.links)
}

const ads = load('ads.json')
let prev = '9999-99-99'
for (const issue of ads.issues) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(issue.date)) errors.push(`期數 ${issue.id}: date 格式要 YYYY-MM-DD`)
  if (issue.id !== issue.date) errors.push(`期數 ${issue.id}: id 應等於 date`)
  if (issue.date >= prev) errors.push(`期數 ${issue.id}: issues 要由新到舊排列`)
  prev = issue.date
  if (issue.links) checkLinks(`期數 ${issue.id}`, issue.links)
  issue.entries.forEach((e) => checkEntry(`期數 ${issue.id}`, e))
}

const picks = load('picks.json')
if (!/^\d{4}-\d{2}$/.test(picks.month)) errors.push('picks.month 格式要 YYYY-MM')
picks.picks.forEach((e) => checkEntry('候選', e, true))

if (errors.length) {
  console.error(`資料有 ${errors.length} 個問題：\n- ` + errors.join('\n- '))
  process.exit(1)
}
console.log(`OK：${ads.issues.length} 期、${ids.size - picks.picks.length} 則收藏、${picks.picks.length} 則候選`)
