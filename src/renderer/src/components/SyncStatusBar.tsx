import React from 'react'
import { useAppStore } from '../store/appStore'
import type { SyncStatus } from '@shared/types'
import './SyncStatusBar.css'

export default function SyncStatusBar(): React.ReactElement {
  const { notebooks, syncStatuses, activeNotebookId } = useAppStore()

  const nb = notebooks.find((n) => n.id === activeNotebookId)
  if (!nb) return <div className="sync-bar" />

  const status: SyncStatus = syncStatuses[nb.id] ?? nb.syncStatus

  function label(): string {
    switch (status) {
      case 'syncing': return '⟳ Syncing…'
      case 'conflict': return '⚠ Conflict resolved'
      case 'error': return '✕ Sync error'
      case 'idle': return '✓ Up to date'
      default: return ''
    }
  }

  return (
    <div className={`sync-bar sync-bar--${status}`}>
      <span>{nb.name}</span>
      <span className="sync-status-text">{label()}</span>
      <button
        className="sync-now-btn"
        onClick={async () => {
          await window.api.syncNow(nb.id)
        }}
        title="Sync now"
      >
        Sync now
      </button>
    </div>
  )
}
