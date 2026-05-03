import React from 'react'
import { useAppStore } from '../store/appStore'
import type { Notebook } from '@shared/types'
import './NotebookList.css'

export default function NotebookList(): React.ReactElement {
  const { notebooks, setNotebooks, activeNotebookId, setActiveNotebook, setCloneDialogOpen } =
    useAppStore()

  async function handleOpenDialog() {
    const result = await window.api.openRepoDialog()
    if (result.success) {
      const nbs = await window.api.getNotebooks()
      setNotebooks(nbs)
      if (result.notebook) setActiveNotebook(result.notebook.id)
    }
  }

  async function handleRemove(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    await window.api.removeNotebook(id)
    const nbs = await window.api.getNotebooks()
    setNotebooks(nbs)
    if (activeNotebookId === id) setActiveNotebook(nbs[0]?.id ?? null)
  }

  const { setSections, setPages, setActiveSection, setActivePage } = useAppStore()

  async function select(nb: Notebook) {
    setActiveNotebook(nb.id)
    const tree = await window.api.getRepoTree(nb.id, nb.localPath)
    setSections(tree.sections)
    setPages(tree.pages)
    setActiveSection(tree.sections[0]?.id ?? null)
    setActivePage(null)
  }

  return (
    <aside className="notebook-list">
      <div className="nb-list-header">
        <span className="nb-list-title">Notebooks</span>
      </div>

      <ul className="nb-items">
        {notebooks.map((nb) => (
          <li
            key={nb.id}
            className={`nb-item ${nb.id === activeNotebookId ? 'nb-item--active' : ''}`}
            onClick={() => select(nb)}
            title={nb.localPath}
          >
            <span className="nb-icon">📓</span>
            <span className="nb-name">{nb.name}</span>
            <button
              className="nb-remove"
              onClick={(e) => handleRemove(nb.id, e)}
              title="Remove from list"
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <div className="nb-actions">
        <button className="nb-action-btn" onClick={handleOpenDialog} title="Open local repo">
          + Open
        </button>
        <button className="nb-action-btn" onClick={() => setCloneDialogOpen(true)} title="Clone from GitHub">
          ⬇ Clone
        </button>
      </div>
    </aside>
  )
}
