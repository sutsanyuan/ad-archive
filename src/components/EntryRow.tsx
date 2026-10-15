import { useId, useState } from 'react'
import { KIND_LABEL, type Entry, type Pick } from '../types'

interface Props {
  entry: Entry | Pick
  onTagClick?: (tag: string) => void
}

function isPick(e: Entry | Pick): e is Pick {
  return 'why' in e
}

export function EntryRow({ entry, onTagClick }: Props) {
  const [open, setOpen] = useState(false)
  const detailId = useId()
  const pick = isPick(entry)
  const hasMore = Boolean(entry.detail) || entry.links.length > 0

  return (
    <article className={pick ? 'entry entry--pick' : 'entry'}>
      <div className="entry__head">
        <h3 className="entry__brand">{entry.brand}</h3>
        <p className="entry__title">
          {entry.title}
          <span className="entry__kind">{KIND_LABEL[entry.kind]}</span>
        </p>
        {pick && (entry.agency || entry.market) && (
          <p className="entry__credit">
            {[entry.agency, entry.market].filter(Boolean).join('／')}
          </p>
        )}
      </div>

      <div className="entry__body">
        {entry.note ? (
          <p className="entry__note">{entry.note}</p>
        ) : (
          <p className="entry__note entry__note--empty">還沒寫觀點</p>
        )}

        {pick && <p className="entry__why">{entry.why}</p>}

        <ul className="entry__tags" aria-label="標籤">
          {entry.tags.map((t) => (
            <li key={t}>
              <button type="button" className="tag" onClick={() => onTagClick?.(t)}>
                {t}
              </button>
            </li>
          ))}
        </ul>

        {hasMore && (
          <>
            <button
              type="button"
              className="entry__toggle"
              aria-expanded={open}
              aria-controls={detailId}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? '收起' : entry.detail ? '看背景與連結' : '看連結'}
            </button>
            <div id={detailId} className="entry__more" data-open={open} hidden={!open}>
              {entry.detail && <p>{entry.detail}</p>}
              {entry.links.length > 0 && (
                <ul className="entry__links">
                  {entry.links.map((l) => (
                    <li key={l.url}>
                      <a href={l.url} target="_blank" rel="noreferrer">
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </article>
  )
}
