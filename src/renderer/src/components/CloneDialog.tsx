import React, { useState } from 'react'
import { useAppStore } from '../store/appStore'
import './CloneDialog.css'

export default function CloneDialog(): React.ReactElement {
  const { setCloneDialogOpen, setNotebooks } = useAppStore()

  const [url, setUrl] = useState('')
  const [dest, setDest] = useState('')
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleClone() {
    if (!url.trim() || !dest.trim()) return
    setBusy(true)
    setError('')
    setProgress('Cloning…')
    try {
      const result = await window.api.cloneRepo(url.trim(), dest.trim())
      if (result.success) {
        setProgress('Done! Loading notebooks…')
        const nbs = await window.api.getNotebooks()
        setNotebooks(nbs)
        setCloneDialogOpen(false)
      } else {
        setError(result.error ?? 'Clone failed')
        setProgress('')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      setProgress('')
    }
    setBusy(false)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') setCloneDialogOpen(false)
    if (e.key === 'Enter') handleClone()
  }

  return (
    <div className="clone-overlay" onKeyDown={handleKey}>
      <div className="clone-dialog">
        <div className="clone-header">
          <span className="clone-title">Clone Repository</span>
          <button onClick={() => setCloneDialogOpen(false)}>✕</button>
        </div>
        <div className="clone-body">
          <label className="clone-label">
            Repository URL
            <input
              className="clone-input"
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/user/my-notes.git"
              disabled={busy}
            />
          </label>
          <label className="clone-label">
            Destination folder
            <input
              className="clone-input"
              value={dest}
              onChange={(e) => setDest(e.target.value)}
              placeholder="C:\Users\you\Documents\my-notes"
              disabled={busy}
            />
          </label>
          {error && <p className="clone-error">{error}</p>}
          {progress && <p className="clone-progress">{progress}</p>}
        </div>
        <div className="clone-footer">
          <button className="clone-cancel-btn" onClick={() => setCloneDialogOpen(false)} disabled={busy}>Cancel</button>
          <button className="clone-ok-btn" onClick={handleClone} disabled={busy || !url.trim() || !dest.trim()}>
            {busy ? 'Cloning…' : 'Clone'}
          </button>
        </div>
      </div>
    </div>
  )
}
