import { useMemo, useState } from 'react'
import archiveData from './data/ads.json'
import picksData from './data/picks.json'
import { EntryRow } from './components/EntryRow'
import { KIND_LABEL, type Archive, type Entry, type Kind, type Picks } from './types'

const archive = archiveData as Archive
const picks = picksData as Picks

type View = 'archive' | 'picks'

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return { year: y, md: `${m}.${d}` }
}

function matches(e: Entry, q: string, kind: Kind | 'all', tag: string | null) {
  if (kind !== 'all' && e.kind !== kind) return false
  if (tag && !e.tags.includes(tag)) return false
  if (!q) return true
  const hay = [e.brand, e.title, e.note, e.detail ?? '', ...e.tags].join(' ').toLowerCase()
  return hay.includes(q.toLowerCase())
}

const KINDS = Object.keys(KIND_LABEL) as Kind[]

export default function App() {
  const [view, setView] = useState<View>('archive')
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<Kind | 'all'>('all')
  const [tag, setTag] = useState<string | null>(null)

  const total = archive.issues.reduce((n, i) => n + i.entries.length, 0)
  const brands = new Set(archive.issues.flatMap((i) => i.entries.map((e) => e.brand))).size

  const filteredIssues = useMemo(
    () =>
      archive.issues
        .map((i) => ({ ...i, entries: i.entries.filter((e) => matches(e, query, kind, tag)) }))
        .filter((i) => i.entries.length > 0),
    [query, kind, tag],
  )
  const filteredPicks = useMemo(
    () => picks.picks.filter((e) => matches(e, query, kind, tag)),
    [query, kind, tag],
  )

  const shown =
    view === 'archive'
      ? filteredIssues.reduce((n, i) => n + i.entries.length, 0)
      : filteredPicks.length
  const filtering = query !== '' || kind !== 'all' || tag !== null

  function clearFilters() {
    setQuery('')
    setKind('all')
    setTag(null)
  }

  const [, pickMonth] = picks.month.split('-')

  return (
    <div className="page">
      <header className="masthead">
        <p className="masthead__who">Tsan 的月會分享</p>
        <h1 className="masthead__title">
          有趣廣告
          <br />
          收藏夾
        </h1>
        <p className="masthead__lede">
          每個月在團隊月會分享的廣告、包裝和網站，連同當時覺得它好在哪裡。目前收了 {archive.issues.length} 期、
          {total} 則，來自 {brands} 個品牌。
        </p>
      </header>

      <nav className="tabs" aria-label="切換內容">
        <button
          type="button"
          className="tabs__btn"
          aria-pressed={view === 'archive'}
          onClick={() => setView('archive')}
        >
          歷次分享
        </button>
        <button
          type="button"
          className="tabs__btn"
          aria-pressed={view === 'picks'}
          onClick={() => setView('picks')}
        >
          {Number(pickMonth)} 月候選
          <span className="tabs__count">{picks.picks.length}</span>
        </button>
      </nav>

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
        {view === 'archive' ? (
          filteredIssues.length === 0 ? (
            <Empty onClear={clearFilters} />
          ) : (
            filteredIssues.map((issue) => {
              const { year, md } = formatDate(issue.date)
              return (
                <section key={issue.id} className="issue" aria-labelledby={`h-${issue.id}`}>
                  <div className="issue__date">
                    <h2 id={`h-${issue.id}`}>
                      <span className="issue__md">{md}</span>
                      <span className="issue__year">{year} 月會</span>
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
                  </div>
                  <div className="issue__entries">
                    {issue.entries.map((e) => (
                      <EntryRow key={e.id} entry={e} onTagClick={setTag} />
                    ))}
                  </div>
                </section>
              )
            })
          )
        ) : (
          <section className="issue issue--picks" aria-labelledby="h-picks">
            <div className="issue__date">
              <h2 id="h-picks">
                <span className="issue__md">{pickMonth} 月</span>
                <span className="issue__year">Claude 整理的候選</span>
              </h2>
              <p className="issue__aside">
                每月自動從各大廣告媒體挑出近期的作品，附上可以怎麼接上之前分享過的東西。挑中的再放進簡報。
                更新於 {picks.generatedAt}。
              </p>
            </div>
            <div className="issue__entries">
              {filteredPicks.length === 0 ? (
                <Empty onClear={clearFilters} />
              ) : (
                filteredPicks.map((e) => <EntryRow key={e.id} entry={e} onTagClick={setTag} />)
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <p>
          資料來源是我的
          <a href={archive.source} target="_blank" rel="noreferrer">
            月會簡報
          </a>
          ，每月自動同步一次。用 React + Vite 做的。
        </p>
      </footer>
    </div>
  )
}

function Empty({ onClear }: { onClear: () => void }) {
  return (
    <div className="empty">
      <p>沒有符合的內容。換個關鍵字，或</p>
      <button type="button" className="linklike" onClick={onClear}>
        清除篩選
      </button>
    </div>
  )
}
