import React, { useCallback, useEffect, useRef } from 'react'
import { useAppStore } from '../store/appStore'
import { Editor } from '@monaco-editor/react'
import MarkdownIt from 'markdown-it'
import './ContentArea.css'

const md = new MarkdownIt({ html: false, linkify: true, typographer: true })

export default function ContentArea(): React.ReactElement {
  const {
    pageContent,
    setPageContent,
    isDirty,
    setDirty,
    isEditMode,
    setEditMode,
    activePageId,
    pages,
    notebooks,
    activeNotebookId,
  } = useAppStore()

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const nb = notebooks.find((n) => n.id === activeNotebookId)
  const page = pages.find((p) => p.id === activePageId)

  const handleChange = useCallback(
    (value: string | undefined) => {
      const v = value ?? ''
      setPageContent(v)
      setDirty(true)

      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        if (!nb || !page) return
        await window.api.savePage(nb.id, nb.localPath, page.relativePath, v)
        setDirty(false)
      }, 1500)
    },
    [nb, page],
  )

  // Cleanup timer on unmount / page change
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [activePageId])

  if (!activePageId) {
    return (
      <div className="content-area content-area--empty">
        <p>Select a page from the list →</p>
      </div>
    )
  }

  return (
    <div className="content-area">
      <div className="content-toolbar">
        <span className="content-title">{page?.name ?? ''}</span>
        <div className="content-toolbar-right">
          {isDirty && <span className="dirty-indicator">Unsaved</span>}
          <button
            className={`view-toggle ${!isEditMode ? 'view-toggle--active' : ''}`}
            onClick={() => setEditMode(false)}
          >
            Preview
          </button>
          <button
            className={`view-toggle ${isEditMode ? 'view-toggle--active' : ''}`}
            onClick={() => setEditMode(true)}
          >
            Edit
          </button>
        </div>
      </div>

      <div className="content-body">
        {isEditMode ? (
          <Editor
            height="100%"
            defaultLanguage="markdown"
            value={pageContent}
            onChange={handleChange}
            options={{
              wordWrap: 'on',
              minimap: { enabled: false },
              lineNumbers: 'off',
              glyphMargin: false,
              folding: false,
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 0,
              fontSize: 14,
              fontFamily: "'Segoe UI', system-ui, sans-serif",
              renderLineHighlight: 'none',
              scrollBeyondLastLine: false,
              padding: { top: 16, bottom: 16 },
            }}
            theme="vs"
          />
        ) : (
          <div
            className="markdown-preview"
            dangerouslySetInnerHTML={{ __html: md.render(pageContent) }}
          />
        )}
      </div>
    </div>
  )
}
