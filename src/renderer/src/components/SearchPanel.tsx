import React, { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../store/appStore'
import type { SearchResult } from '@shared/types'
import './SearchPanel.css'

export default function SearchPanel(): React.ReactElement {
  const { searchQuery, setSearchQuery, setSearchOpen, setActivePage, setPageContent, setDirty, setEditMode, notebooks, activeNotebookId, pages } = useAppStore()
  const [results, setResults] = useState<SearchResult[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!searchQuery.trim() || !activeNotebookId) { setResults([]); return }
      const nb = notebooks.find((n) => n.id === activeNotebookId)
      if (!nb) return
      const res = await window.api.search(nb.id, searchQuery)
      setResults(res)
    }, 200)
    return () => clearTimeout(t)
  }, [searchQuery, activeNotebookId])

  async function goTo(r: SearchResult) {
    const nb = notebooks.find((n) => n.id === activeNotebookId)
    if (!nb) return
    setActivePage(r.pageId)
    setEditMode(false)
    const page = pages.find((p) => p.id === r.pageId)
    if (page) {
      const content = await window.api.getPageContent(nb.localPath, page.relativePath)
      setPageContent(content.content)
      setDirty(false)
    }
    setSearchOpen(false)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') setSearchOpen(false)
  }

  return (
    <div className="search-overlay" onKeyDown={handleKey}>
      <div className="search-panel">
        <div className="search-header">
          <input
            ref={inputRef}
            className="search-input"
            placeholder="Search pages…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="search-close" onClick={() => setSearchOpen(false)}>✕</button>
        </div>
        <ul className="search-results">
          {results.map((r) => (
            <li key={r.pageId} className="search-result" onClick={() => goTo(r)}>
              <span className="sr-page">{r.pageName}</span>
              <span className="sr-section">{r.sectionName}</span>
              <p className="sr-excerpt">{r.excerpt}</p>
            </li>
          ))}
          {searchQuery.trim() && results.length === 0 && (
            <li className="search-empty">No results</li>
          )}
        </ul>
      </div>
    </div>
  )
}
