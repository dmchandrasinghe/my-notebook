import React, { useState } from 'react'
import { useAppStore } from '../store/appStore'
import type { Page } from '@shared/types'
import './PageList.css'

export default function PageList(): React.ReactElement {
  const {
    pages,
    sections,
    activeSectionId,
    activePageId,
    setActivePage,
    setPageContent,
    setDirty,
    setEditMode,
    notebooks,
    activeNotebookId,
    setSections,
    setPages,
    setSearchOpen,
    setHistoryOpen,
    setConflictsOpen,
  } = useAppStore()

  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  const nb = notebooks.find((n) => n.id === activeNotebookId)
  const section = sections.find((s) => s.id === activeSectionId)

  const visiblePages = activeSectionId
    ? pages.filter((p) => p.sectionId === activeSectionId)
    : pages

  async function selectPage(page: Page) {
    if (!nb) return
    setActivePage(page.id)
    setEditMode(false)
    const result = await window.api.getPageContent(nb.localPath, page.relativePath)
    setPageContent(result.content)
    setDirty(false)
  }

  async function handleAddPage() {
    if (!nb || !section || !newName.trim()) { setAdding(false); return }
    const name = newName.trim().replace(/[\\/:*?"<>|]/g, '_')
    const rel = `${section.relativePath}/${name}.md`
    await window.api.createPage(nb.localPath, rel)
    const tree = await window.api.getRepoTree(nb.id, nb.localPath)
    setSections(tree.sections)
    setPages(tree.pages)
    setAdding(false)
    setNewName('')
  }

  return (
    <aside className="page-list">
      <div className="page-list-toolbar">
        <span className="page-list-title">{section?.name ?? 'Pages'}</span>
        <div className="page-list-icons">
          <button onClick={() => setSearchOpen(true)} title="Search (Ctrl+F)">🔍</button>
          <button onClick={() => setHistoryOpen(true)} title="History">🕐</button>
          <button onClick={() => setConflictsOpen(true)} title="Conflict backups">⚠</button>
        </div>
      </div>

      <ul className="page-items">
        {visiblePages.map((page) => (
          <li
            key={page.id}
            className={`page-item ${page.id === activePageId ? 'page-item--active' : ''}`}
            onClick={() => selectPage(page)}
          >
            <span className="page-icon">📄</span>
            <span className="page-name">{page.name}</span>
          </li>
        ))}

        {adding ? (
          <li className="page-item page-item--adding">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleAddPage}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddPage(); if (e.key === 'Escape') setAdding(false) }}
              placeholder="Page name"
              className="page-name-input"
            />
          </li>
        ) : (
          section && (
            <li className="page-item page-add-row" onClick={() => setAdding(true)}>
              <span>+ Add page</span>
            </li>
          )
        )}
      </ul>
    </aside>
  )
}
