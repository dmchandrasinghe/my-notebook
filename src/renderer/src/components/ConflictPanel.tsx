import React, { useEffect, useState } from 'react'
import { useAppStore } from '../store/appStore'
import type { ConflictBackup } from '@shared/types'
import './ConflictPanel.css'

export default function ConflictPanel(): React.ReactElement {
  const { setConflictsOpen, activeNotebookId, notebooks } = useAppStore()
  const [backups, setBackups] = useState<ConflictBackup[]>([])
  const [selected, setSelected] = useState<ConflictBackup | null>(null)
  const [content, setContent] = useState<string>('')

  const nb = notebooks.find((n) => n.id === activeNotebookId)

  useEffect(() => {
    if (!nb) return
    window.api.getConflictBackups(nb.id).then(setBackups)
  }, [nb?.id])

  async function view(b: ConflictBackup) {
    if (!nb) return
    setSelected(b)
    const res = await window.api.getBackupContent(nb.id, b.backupPath)
    setContent(res.content)
  }

  return (
    <div className="conflict-overlay">
      <div className="conflict-panel">
        <div className="conflict-header">
          <span className="conflict-title">Conflict Backups</span>
          <button onClick={() => setConflictsOpen(false)}>✕</button>
        </div>
        <div className="conflict-body">
          <ul className="conflict-list">
            {backups.length === 0 && (
              <li className="conflict-empty">No conflict backups found</li>
            )}
            {backups.map((b) => (
              <li
                key={b.backupPath}
                className={`conflict-entry ${selected?.backupPath === b.backupPath ? 'conflict-entry--active' : ''}`}
                onClick={() => view(b)}
              >
                <span className="cb-file">{b.originalPath.split('/').pop()}</span>
                <span className="cb-meta">{b.timestamp} · {b.originalPath}</span>
              </li>
            ))}
          </ul>
          {selected && (
            <div className="conflict-preview">
              <div className="conflict-preview-header">
                <span>{selected.originalPath}</span>
                <span className="cb-ts">{selected.timestamp}</span>
              </div>
              <pre className="conflict-content">{content}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
