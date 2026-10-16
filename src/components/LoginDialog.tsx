import { useState, type FormEvent } from 'react'
import { ApiError, login } from '../lib/api'
import { Dialog } from './Dialog'

export function LoginDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login(password)
      onSuccess()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '登入失敗')
      setBusy(false)
    }
  }

  return (
    <Dialog title="登入編輯" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label className="field">
          <span>密碼</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
          />
        </label>
        {error && (
          <p className="form__error" role="alert">
            {error}
          </p>
        )}
        <div className="form__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            取消
          </button>
          <button type="submit" className="btn" disabled={busy || !password}>
            {busy ? '登入中…' : '登入'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
