import { useEffect, useMemo, useState } from 'react'
import archiveData from './data/ads.json'
import { EntryForm } from './components/EntryForm'
import { EntryRow } from './components/EntryRow'
import { LoginDialog } from './components/LoginDialog'
import { ApiError, fetchLatest, getSession, logout, removeEntry } from './lib/api'
import { KIND_LABEL, type Archive, type Entry, type Kind } from './types'

const KINDS = Object.keys(KIND_LABEL) as Kind[]

type Editing = { mode: 'create'; issueDate: string } | { mode: 'update'; issueDate: string; entry: Entry }

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return { year: y, md: `${m}.${d}` }
}

function matches(e: Entry, q: string, kind: Kind | 'all', tag: string | null, onlyClaude: boolean) {
  if (kind !== 'all' && e.kind !== kind) return false
  if (tag && !e.tags.includes(tag)) return false
  if (onlyClaude && !e.by) return false
  if (!q) return true
  const hay = [e.brand, e.title, e.note, e.detail ?? '', e.why ?? '', e.agency ?? '', ...e.tags].join(' ').toLowerCase()
  return hay.includes(q.toLowerCase())
}

export default function App() {
  const [archive, setArchive] = useState<Archive>(archiveData as Archive)
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<Kind | 'all'>('all')
  const [tag, setTag] = useState<string | null>(null)
  const [onlyClaude, setOnlyClaude] = useState(false)

  // 登入與編輯狀態
  const [canLogin, setCanLogin] = useState(false)
  const [admin, setAdmin] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [editing, setEditing] = useState<Editing | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    getSession().then((s) => {
      if (!s) return
      setCanLogin(true)
      if (s.admin) enterAdmin()
    })
  }, [])

  // 管理者直接讀 GitHub 上的最新資料，不必等網站重新部署
  async function enterAdmin() {
    setAdmin(true)
    try {
      setArchive((await fetchLatest()).archive)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setAdmin(false)
      else setStatus(err instanceof ApiError ? err.message : '讀取最新資料失敗')
    }
  }

  async function signOut() {
    await logout().catch(() => undefined)
    setAdmin(false)
    setStatus('已登出')
  }

  function onSaved(next: Archive, message: string) {
    setArchive(next)
    setEditing(null)
    setStatus(`${message}，公開網站約 1 分鐘後更新`)
  }

  async function onDelete(e: Entry) {
    try {
      const { archive: next } = await removeEntry(e.id)
      setArchive(next)
      setStatus(`已刪除「${e.brand}」，公開網站約 1 分鐘後更新`)
    } catch (err) {
      setStatus(err instanceof ApiError ? err.message : '刪除失敗')
    }
  }

  const all = archive.issues.flatMap((i) => i.entries)
  const brands = new Set(all.map((e) => e.brand)).size
  const issueDates = archive.issues.map((i) => i.date)

  const filteredIssues = useMemo(
    () =>
      archive.issues
        .map((i) => ({
          ...i,
          entries: i.entries.filter((e) => matches(e, query, kind, tag, onlyClaude)),
        }))
        .filter((i) => i.entries.length > 0),
    [archive, query, kind, tag, onlyClaude],
  )
  const shown = filteredIssues.reduce((n, i) => n + i.entries.length, 0)
  const filtering = query !== '' || kind !== 'all' || tag !== null || onlyClaude !== false

  function clearFilters() {
    setQuery('')
    setKind('all')
    setTag(null)
    setOnlyClaude(false)
  }

  return (
    <>
      {admin && (
        <div className="adminbar">
          <div className="adminbar__inner">
            <p>編輯模式</p>
            <button
              type="button"
              className="btn btn--small"
              onClick={() => setEditing({ mode: 'create', issueDate: issueDates[0] ?? '' })}
            >
              新增一則
            </button>
            <button type="button" className="linklike adminbar__logout" onClick={signOut}>
              登出
            </button>
          </div>
        </div>
      )}

      <div className="page">
        <header className="masthead">
          <p className="masthead__who">Tsan 的月會分享</p>
          <h1 className="masthead__title">
            有趣廣告
            <br />
            收藏夾
          </h1>
          <p className="masthead__lede">
            每個月在團隊月會分享的廣告、包裝和網站，連同它好在哪裡。標著「Claude 挑選」的是 Claude
            每月幫我找來的。目前收了 {archive.issues.length} 期、
            {all.length} 則，來自 {brands} 個品牌。
          </p>
        </header>

        <section className="filters" aria-label="篩選">
          <label className="search">
            <span className="visually-hidden">搜尋品牌、標籤或內容</span>
            <input
              type="search"
              placeholder="搜尋品牌、標籤或內容"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="kinds" role="group" aria-label="類型">
            <button type="button" aria-pressed={kind === 'all'} onClick={() => setKind('all')}>
              全部
            </button>
            {KINDS.map((k) => (
              <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)}>
                {KIND_LABEL[k]}
              </button>
            ))}
          </div>
          <div className="kinds">
            <button type="button" aria-pressed={onlyClaude} onClick={() => setOnlyClaude(!onlyClaude)}>
              Claude 挑選
            </button>
          </div>

          {filtering && (
            <p className="filters__status" role="status">
              {tag && (
                <span className="filters__tag">
                  標籤：<mark>{tag}</mark>
                </span>
              )}
              符合 {shown} 則
              <button type="button" className="linklike" onClick={clearFilters}>
                清除篩選
              </button>
            </p>
          )}
        </section>

        <main>
          {filteredIssues.length === 0 ? (
            <div className="empty">
              <p>沒有符合的內容。換個關鍵字，或</p>
              <button type="button" className="linklike" onClick={clearFilters}>
                清除篩選
              </button>
            </div>
          ) : (
            filteredIssues.map((issue) => {
              const { year, md } = formatDate(issue.date)
              const allClaude = issue.entries.every((e) => e.by === 'claude')
              return (
                <section key={issue.id} className="issue" aria-labelledby={`h-${issue.id}`}>
                  <div className="issue__date">
                    <h2 id={`h-${issue.id}`}>
                      <span className="issue__md">{md}</span>
                      <span className="issue__year">
                        {year} {allClaude ? 'Claude 挑選' : '月會'}
                      </span>
                    </h2>
                    {issue.links && issue.links.length > 0 && !filtering && (
                      <ul className="issue__refs">
                        {issue.links.map((l) => (
                          <li key={l.url}>
                            <a href={l.url} target="_blank" rel="noreferrer">
                              {l.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                    {admin && (
                      <button
                        type="button"
                        className="linklike issue__add"
                        onClick={() =>
                          setEditing({
                            mode: 'create',
                            issueDate: issue.date,
                          })
                        }
                      >
                        在這期新增
                      </button>
                    )}
                  </div>
                  <div className="issue__entries">
                    {issue.entries.map((e) => (
                      <EntryRow
                        key={e.id}
                        entry={e}
                        admin={admin}
                        onTagClick={setTag}
                        onEdit={() =>
                          setEditing({
                            mode: 'update',
                            issueDate: issue.date,
                            entry: e,
                          })
                        }
                        onDelete={() => onDelete(e)}
                      />
                    ))}
                  </div>
                </section>
              )
            })
          )}
        </main>

        <footer className="footer">
          <p>
            每月由 Claude 自動更新，用 React + Vite 做的。
            {canLogin && !admin && (
              <button type="button" className="linklike" onClick={() => setLoginOpen(true)}>
                登入編輯
              </button>
            )}
          </p>
        </footer>
      </div>

      <p className="toast" role="status" aria-live="polite" data-show={status ? 'true' : 'false'}>
        {status}
        {status && (
          <button type="button" className="linklike" onClick={() => setStatus('')}>
            知道了
          </button>
        )}
      </p>

      {loginOpen && (
        <LoginDialog
          onClose={() => setLoginOpen(false)}
          onSuccess={() => {
            setLoginOpen(false)
            enterAdmin()
            setStatus('已登入，可以編輯了')
          }}
        />
      )}
      {editing && (
        <EntryForm
          mode={editing.mode}
          issueDate={editing.issueDate}
          entry={editing.mode === 'update' ? editing.entry : undefined}
          issueDates={issueDates}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      )}
    </>
  )
}
