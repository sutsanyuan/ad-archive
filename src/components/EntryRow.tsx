import { useEffect, useId, useRef, useState } from 'react'
import { KIND_LABEL, type Entry } from '../types'

interface Props {
  entry: Entry
  admin?: boolean
  onTagClick?: (tag: string) => void
  onEdit?: () => void
  onDelete?: () => Promise<void>
}

function Thumb({ src, alt, href }: { src: string; alt: string; href?: string }) {
  // 外部圖片可能被移除或擋外連，載入失敗就整個不顯示，避免破圖
  const [failed, setFailed] = useState(false)
  if (failed) return null
  const img = (
    <img
      className="entry__thumb"
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  )
  return href ? (
    <a className="entry__thumb-link" href={href} target="_blank" rel="noreferrer">
      {img}
    </a>
  ) : (
    img
  )
}

/** 先顯示 YouTube 縮圖，點了才載入播放器，避免一頁載入一堆 iframe */
function VideoThumb({ id, label, onPlay }: { id: string; label: string; onPlay: () => void }) {
  return (
    <button type="button" className="entry__video-btn" onClick={onPlay} aria-label={`播放影片：${label}`}>
      <img
        className="entry__thumb entry__thumb--video"
        src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
        alt=""
        loading="lazy"
        decoding="async"
      />
      <span className="entry__play" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
        </svg>
      </span>
    </button>
  )
}

function Player({ id, label, onClose }: { id: string; label: string; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeRef.current?.focus()
  }, [])
  return (
    <div className="entry__player">
      <iframe
        src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1`}
        title={label}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
      <div className="entry__player-bar">
        <a href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noreferrer">
          在 YouTube 開啟
        </a>
        <button ref={closeRef} type="button" className="linklike" onClick={onClose}>
          關閉影片
        </button>
      </div>
    </div>
  )
}

/** 刪除要按兩次：先按「刪除」，再按「確定刪除」 */
function AdminActions({ onEdit, onDelete }: { onEdit?: () => void; onDelete?: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (confirming) confirmRef.current?.focus()
  }, [confirming])

  if (confirming) {
    return (
      <div className="entry__admin" role="group" aria-label="確認刪除">
        <button
          ref={confirmRef}
          type="button"
          className="btn btn--danger btn--small"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            try {
              await onDelete?.()
            } finally {
              setBusy(false)
              setConfirming(false)
            }
          }}
        >
          {busy ? '刪除中…' : '確定刪除'}
        </button>
        <button type="button" className="btn btn--ghost btn--small" disabled={busy} onClick={() => setConfirming(false)}>
          取消
        </button>
      </div>
    )
  }
  return (
    <div className="entry__admin">
      <button type="button" className="btn btn--ghost btn--small" onClick={onEdit}>
        編輯
      </button>
      <button type="button" className="btn btn--ghost btn--small" onClick={() => setConfirming(true)}>
        刪除
      </button>
    </div>
  )
}

export function EntryRow({ entry, admin, onTagClick, onEdit, onDelete }: Props) {
  const [open, setOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const detailId = useId()
  const label = `${entry.brand}：${entry.title}`
  const byClaude = entry.by === 'claude'

  // 有自己的觀點就顯示觀點；Claude 挑的還沒寫觀點時，改顯示 Claude 寫的介紹
  const showDetailAsMain = !entry.note && byClaude && Boolean(entry.detail)
  const mainText = entry.note || (showDetailAsMain ? entry.detail : '')
  const moreDetail = showDetailAsMain ? undefined : entry.detail
  const hasMore = Boolean(moreDetail) || entry.links.length > 0
  const credit = [entry.agency, entry.market].filter(Boolean).join('／')

  return (
    <article className={byClaude ? 'entry entry--claude' : 'entry'}>
      {entry.youtube && playing && <Player id={entry.youtube} label={label} onClose={() => setPlaying(false)} />}
      <div className="entry__head">
        {entry.youtube
          ? !playing && <VideoThumb id={entry.youtube} label={label} onPlay={() => setPlaying(true)} />
          : entry.image && <Thumb src={entry.image} alt={label} href={entry.links[0]?.url} />}
        <h3 className="entry__brand">{entry.brand}</h3>
        <p className="entry__title">
          {entry.title}
          <span className="entry__kind">
            {KIND_LABEL[entry.kind]}
            {byClaude && <span className="entry__by">Claude 挑選</span>}
          </span>
        </p>
        {credit && <p className="entry__credit">{credit}</p>}
        {admin && <AdminActions onEdit={onEdit} onDelete={onDelete} />}
      </div>

      <div className="entry__body">
        {mainText ? (
          <p className={showDetailAsMain ? 'entry__note entry__note--claude' : 'entry__note'}>{mainText}</p>
        ) : (
          admin && <p className="entry__note entry__note--empty">還沒寫觀點</p>
        )}

        {byClaude && entry.why && <p className="entry__why">{entry.why}</p>}

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
              {open ? '收起' : moreDetail ? '看背景與連結' : '看連結'}
            </button>
            <div id={detailId} className="entry__more" hidden={!open}>
              {moreDetail && <p>{moreDetail}</p>}
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
