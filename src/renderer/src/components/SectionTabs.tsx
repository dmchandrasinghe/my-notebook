import React, { useState } from 'react'
import { useAppStore } from '../store/appStore'
import './SectionTabs.css'

const SECTION_COLORS = [
  '#3278b4', '#c05a28', '#4e8a4e', '#7e4f96',
  '#b43250', '#0076a3', '#6b6b6b', '#a07828',
]

export default function SectionTabs(): React.ReactElement {
  const {
    sections,
    activeSectionId,
    setActiveSection,
    setActivePage,
    activeNotebookId,
    notebooks,
    setSections,
    setPages,
  } = useAppStore()

  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  const nb = notebooks.find((n) => n.id === activeNotebookId)

  async function handleAdd() {
    if (!nb || !newName.trim()) { setAdding(false); return }
    const rel = newName.trim().replace(/[\\/:*?"<>|]/g, '_')
    await window.api.createSection(nb.localPath, rel)
    const tree = await window.api.getRepoTree(nb.id, nb.localPath)
    setSections(tree.sections)
    setPages(tree.pages)
    setAdding(false)
    setNewName('')
  }

  function colorFor(idx: number): string {
    return SECTION_COLORS[idx % SECTION_COLORS.length]
  }

  return (
    <div className="section-tabs-bar">
      {sections.map((sec, idx) => (
        <button
          key={sec.id}
          className={`section-tab ${sec.id === activeSectionId ? 'section-tab--active' : ''}`}
          style={{ '--tab-color': colorFor(idx) } as React.CSSProperties}
          onClick={() => {
            setActiveSection(sec.id)
            setActivePage(null)
          }}
        >
          {sec.name}
        </button>
      ))}

      {adding ? (
        <input
          className="section-tab-input"
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onBlur={handleAdd}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
          placeholder="Section name"
        />
      ) : (
        nb && (
          <button className="section-add-btn" onClick={() => setAdding(true)} title="Add section">
            +
          </button>
        )
      )}
    </div>
  )
}
