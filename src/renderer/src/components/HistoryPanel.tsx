import React, { useEffect, useState } from 'react'
import { useAppStore } from '../store/appStore'
import type { FileHistoryEntry } from '@shared/types'
import './HistoryPanel.css'

export default function HistoryPanel(): React.ReactElement {
  const { setHistoryOpen, activePageId, pages, notebooks, activeNotebookId } = useAppStore()

  const [history, setHistory] = useState<FileHistoryEntry[]>([])
  const [diffHtml, setDiffHtml] = useState<string | null>(null)
  const [selectedHash, setSelectedHash] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [reverting, setReverting] = useState(false)

  const nb = notebooks.find((n) => n.id === activeNotebookId)
  const page = pages.find((p) => p.id === activePageId)

  useEffect(() => {
    if (!nb || !page) return
    setLoading(true)
    window.api.getFileHistory(nb.localPath, page.relativePath).then((h) => {
      setHistory(h)
      setLoading(false)
    })
  }, [nb?.localPath, page?.relativePath])

  async function selectCommit(hash: string) {
    if (!nb || !page) return
    setSelectedHash(hash)
    const diff = await window.api.getDiff(nb.localPath, page.relativePath, hash)
    setDiffHtml(diff.unifiedDiff ?? '')
  }

  async function revert() {
    if (!nb || !page || !selectedHash) return
    setReverting(true)
    await window.api.revert(nb.id, nb.localPath, page.relativePath, selectedHash)
    setReverting(false)
    setHistoryOpen(false)
  }

  return (
    <div className="history-overlay">
      <div className="history-panel">
        <div className="history-header">
          <span className="history-title">History — {page?.name}</span>
          <button onClick={() => setHistoryOpen(false)}>✕</button>
        </div>
        <div className="history-body">
          <ul className="history-list">
            {loading && <li className="history-loading">Loading…</li>}
            {history.map((entry) => (
              <li
                key={entry.hash}
                className={`history-entry ${entry.hash === selectedHash ? 'history-entry--active' : ''}`}
                onClick={() => selectCommit(entry.hash)}
              >
                <span className="he-msg">{entry.message}</span>
                <span className="he-meta">{entry.date} · {entry.author}</span>
              </li>
            ))}
          </ul>
          {diffHtml && (
            <div className="history-diff">
              <div className="diff-actions">
                <button
                  className="revert-btn"
                  onClick={revert}
                  disabled={reverting}
                >
                  {reverting ? 'Reverting…' : 'Revert to this version'}
                </button>
              </div>
              <div
                className="diff-content"
                dangerouslySetInnerHTML={{ __html: diffHtml }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
