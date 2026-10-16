import { useId, useState, type FormEvent } from 'react'
import { normalizeEntry } from '../../shared/schema.js'
import { ApiError, saveEntry } from '../lib/api'
import { KIND_LABEL, type Archive, type Entry, type Kind } from '../types'
import { Dialog } from './Dialog'

interface Props {
  mode: 'create' | 'update'
  issueDate: string
  entry?: Entry
  issueDates: string[]
  onClose: () => void
  onSaved: (archive: Archive, message: string) => void
}

interface LinkRow {
  key: number
  label: string
  url: string
}

const KINDS = Object.keys(KIND_LABEL) as Kind[]
const NEW_ISSUE = '__new__'

function today() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function EntryForm({ mode, issueDate, entry, issueDates, onClose, onSaved }: Props) {
  const ids = useId()
  const [issue, setIssue] = useState(issueDate || issueDates[0] || NEW_ISSUE)
  const [newDate, setNewDate] = useState(today())
  const [brand, setBrand] = useState(entry?.brand ?? '')
  const [title, setTitle] = useState(entry?.title ?? '')
  const [kind, setKind] = useState<Kind>(entry?.kind ?? 'campaign')
  const [tags, setTags] = useState(entry?.tags.join('、') ?? '')
  const [note, setNote] = useState(entry?.note ?? '')
  const [detail, setDetail] = useState(entry?.detail ?? '')
  const [why, setWhy] = useState(entry?.why ?? '')
  const [agency, setAgency] = useState(entry?.agency ?? '')
  const [market, setMarket] = useState(entry?.market ?? '')
  const [youtube, setYoutube] = useState(entry?.youtube ? `https://www.youtube.com/watch?v=${entry.youtube}` : '')
  const [image, setImage] = useState(entry?.image ?? '')
  const [links, setLinks] = useState<LinkRow[]>(
    (entry?.links.length ? entry.links : [{ label: '', url: '' }]).map((l, i) => ({ key: i, ...l })),
  )
  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  const byClaude = entry?.by === 'claude'
  const targetDate = issue === NEW_ISSUE ? newDate : issue

  function updateLink(key: number, patch: Partial<LinkRow>) {
    setLinks((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const draft = {
      id: entry?.id,
      brand,
      title,
      kind,
      tags,
      note,
      detail,
      why: byClaude ? why : undefined,
      agency,
      market,
      youtube,
      image,
      links: links.filter((l) => l.url.trim()).map(({ label, url }) => ({ label, url })),
    }
    const { errors: localErrors } = normalizeEntry({ ...draft, id: draft.id ?? 'draft' })
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) localErrors.push('請選擇期數日期')
    if (localErrors.length) {
      setErrors(localErrors)
      return
    }

    setBusy(true)
    setErrors([])
    try {
      const { archive } = await saveEntry(targetDate, draft, mode)
      onSaved(archive, mode === 'create' ? `已新增「${brand}」` : `已更新「${brand}」`)
    } catch (err) {
      setErrors(err instanceof ApiError ? [err.message, ...err.details] : ['儲存失敗'])
      setBusy(false)
    }
  }

  return (
    <Dialog title={mode === 'create' ? '新增一則' : `編輯「${entry?.brand}」`} onClose={onClose} wide>
      <form className="form" onSubmit={submit} noValidate>
        <div className="form__grid">
          <label className="field">
            <span>放在哪一期</span>
            <select value={issue} onChange={(e) => setIssue(e.target.value)}>
              {issueDates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
              <option value={NEW_ISSUE}>新的一期…</option>
            </select>
          </label>
          {issue === NEW_ISSUE && (
            <label className="field">
              <span>新一期的日期</span>
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required />
            </label>
          )}
          <label className="field">
            <span>類型</span>
            <select value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="form__grid">
          <label className="field">
            <span>品牌</span>
            <input value={brand} onChange={(e) => setBrand(e.target.value)} required />
          </label>
          <label className="field">
            <span>作品名稱</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
        </div>

        <label className="field">
          <span>標籤</span>
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="用逗號或頓號分隔，例如：包裝、幽默" />
        </label>

        <label className="field">
          <span>我的觀點</span>
          <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          {byClaude && <small>寫了之後會取代 Claude 的介紹，顯示成你的話。</small>}
        </label>

        <label className="field">
          <span>背景與數據</span>
          <textarea rows={3} value={detail} onChange={(e) => setDetail(e.target.value)} />
        </label>

        {byClaude && (
          <label className="field">
            <span>Claude 的推薦理由</span>
            <textarea rows={2} value={why} onChange={(e) => setWhy(e.target.value)} />
          </label>
        )}

        <div className="form__grid">
          <label className="field">
            <span>代理商</span>
            <input value={agency} onChange={(e) => setAgency(e.target.value)} />
          </label>
          <label className="field">
            <span>市場</span>
            <input value={market} onChange={(e) => setMarket(e.target.value)} placeholder="例如：英國" />
          </label>
        </div>

        <div className="form__grid">
          <label className="field">
            <span>YouTube 網址</span>
            <input
              inputMode="url"
              value={youtube}
              onChange={(e) => setYoutube(e.target.value)}
              placeholder="有影片就會內嵌播放"
            />
          </label>
          <label className="field">
            <span>縮圖網址</span>
            <input
              inputMode="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="沒有影片時顯示"
            />
          </label>
        </div>

        <fieldset className="field links-field">
          <legend>連結</legend>
          {links.map((l, i) => (
            <div className="links-field__row" key={l.key}>
              <input
                aria-label={`第 ${i + 1} 個連結的名稱`}
                value={l.label}
                onChange={(e) => updateLink(l.key, { label: e.target.value })}
                placeholder="名稱，例如：LBB 報導"
              />
              <input
                aria-label={`第 ${i + 1} 個連結的網址`}
                inputMode="url"
                value={l.url}
                onChange={(e) => updateLink(l.key, { url: e.target.value })}
                placeholder="https://"
              />
              <button
                type="button"
                className="btn btn--ghost btn--small"
                onClick={() => setLinks((rows) => rows.filter((r) => r.key !== l.key))}
                aria-label={`移除第 ${i + 1} 個連結`}
              >
                移除
              </button>
            </div>
          ))}
          <button
            type="button"
            className="linklike"
            onClick={() => setLinks((rows) => [...rows, { key: Date.now(), label: '', url: '' }])}
          >
            加一個連結
          </button>
          <small>第一個連結是縮圖點下去會開的頁面。</small>
        </fieldset>

        {errors.length > 0 && (
          <div className="form__error" role="alert" id={`${ids}-errors`}>
            <p>還不能儲存：</p>
            <ul>
              {errors.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="form__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            取消
          </button>
          <button type="submit" className="btn" disabled={busy}>
            {busy ? '儲存中…' : mode === 'create' ? '新增' : '儲存'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
