import React, { useRef, useState } from 'react'
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
    reorderSections,
  } = useAppStore()

  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const dragSrcIdx = useRef<number | null>(null)

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

  function handleDragStart(e: React.DragEvent, idx: number) {
    dragSrcIdx.current = idx
    setDraggingIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverIdx !== idx) setDragOverIdx(idx)
  }

  function handleDrop(e: React.DragEvent, idx: number) {
    e.preventDefault()
    if (dragSrcIdx.current !== null && dragSrcIdx.current !== idx) {
      reorderSections(dragSrcIdx.current, idx)
    }
    dragSrcIdx.current = null
    setDraggingIdx(null)
    setDragOverIdx(null)
  }

  function handleDragEnd() {
    dragSrcIdx.current = null
    setDraggingIdx(null)
    setDragOverIdx(null)
  }

  return (
    <div className="section-tabs-bar">
      {sections.map((sec, idx) => (
        <button
          key={sec.id}
          draggable
          className={[
            'section-tab',
            sec.id === activeSectionId ? 'section-tab--active' : '',
            draggingIdx === idx ? 'section-tab--dragging' : '',
            dragOverIdx === idx && draggingIdx !== idx ? 'section-tab--drag-over' : '',
          ].join(' ').trim()}
          style={{ '--tab-color': colorFor(idx) } as React.CSSProperties}
          onClick={() => {
            setActiveSection(sec.id)
            setActivePage(null)
          }}
          onDragStart={(e) => handleDragStart(e, idx)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDrop={(e) => handleDrop(e, idx)}
          onDragEnd={handleDragEnd}
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
