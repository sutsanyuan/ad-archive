import type { Archive } from '../../src/types'
import { env } from './http.js'

// 透過 GitHub Contents API 讀寫 src/data/ads.json。
// 寫入就是一個 commit，Vercel 收到 push 會自動重新部署，git 歷史也就是修改紀錄。

const API = 'https://api.github.com'

export class GitHubError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

function settings() {
  const token = env('GITHUB_TOKEN')
  if (!token) throw new GitHubError('網站還沒設定 GITHUB_TOKEN', 503)
  return {
    token,
    repo: env('GITHUB_REPO') ?? 'sutsanyuan/ad-archive',
    branch: env('GITHUB_BRANCH') ?? 'main',
    path: 'src/data/ads.json',
  }
}

function decodeBase64(b64: string): string {
  const bin = atob(b64.replace(/\s/g, ''))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin)
}

async function gh(path: string, init: RequestInit = {}) {
  const { token } = settings()
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      'user-agent': 'ad-archive-editor',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
    },
  })
  if (res.status === 401 || res.status === 403) {
    throw new GitHubError('GitHub 拒絕存取，請確認 GITHUB_TOKEN 還有效、有這個 repo 的 Contents 寫入權限', 502)
  }
  return res
}

export async function readArchive(): Promise<{ archive: Archive; sha: string }> {
  const { repo, branch, path } = settings()
  const res = await gh(`/repos/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`)
  if (!res.ok) throw new GitHubError(`讀取資料失敗（GitHub ${res.status}）`, 502)
  const body = (await res.json()) as { content: string; sha: string }
  return { archive: JSON.parse(decodeBase64(body.content)) as Archive, sha: body.sha }
}

/** 寫回 GitHub；sha 不符（期間有人改過）回傳 false，讓呼叫端重讀後再試 */
export async function writeArchive(archive: Archive, sha: string, message: string): Promise<boolean> {
  const { repo, branch, path } = settings()
  const res = await gh(`/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: encodeBase64(JSON.stringify(archive, null, 2) + '\n'),
      sha,
      branch,
    }),
  })
  if (res.status === 409 || res.status === 422) return false
  if (!res.ok) throw new GitHubError(`儲存失敗（GitHub ${res.status}）`, 502)
  return true
}

/**
 * 讀最新資料 → 套用修改 → 寫回。寫入時發現資料已被別人（例如每月排程）改過，
 * 就重讀最新版本再套用一次，不會蓋掉別人的修改。
 */
export async function updateArchive(
  apply: (archive: Archive) => { next: Archive; message: string },
): Promise<Archive> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { archive, sha } = await readArchive()
    const { next, message } = apply(archive)
    if (await writeArchive(next, sha, message)) return next
  }
  throw new GitHubError('資料同時被其他地方修改，請重新整理後再試一次', 409)
}
