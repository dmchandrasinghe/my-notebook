import fs from 'fs'
import path from 'path'
import { META_FILE, APP_DATA_DIR } from '../constants'
import type { Notebook } from '@shared/types'

interface AppMeta {
  notebooks: Notebook[]
  sectionColors: Record<string, string>
  pageColors: Record<string, string>
  lastOpenedNotebookId?: string
  lastOpenedPageId?: string
}

const DEFAULT_META: AppMeta = {
  notebooks: [],
  sectionColors: {},
  pageColors: {},
}

function ensureAppDir(): void {
  if (!fs.existsSync(APP_DATA_DIR)) {
    fs.mkdirSync(APP_DATA_DIR, { recursive: true })
  }
}

export function loadMeta(): AppMeta {
  ensureAppDir()
  if (!fs.existsSync(META_FILE)) return { ...DEFAULT_META }
  try {
    const raw = fs.readFileSync(META_FILE, 'utf-8')
    return { ...DEFAULT_META, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_META }
  }
}

export function saveMeta(meta: AppMeta): void {
  ensureAppDir()
  fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2), 'utf-8')
}

export function getNotebooks(): Notebook[] {
  return loadMeta().notebooks
}

export function upsertNotebook(notebook: Notebook): void {
  const meta = loadMeta()
  const idx = meta.notebooks.findIndex((n) => n.id === notebook.id)
  if (idx >= 0) {
    meta.notebooks[idx] = notebook
  } else {
    meta.notebooks.push(notebook)
  }
  saveMeta(meta)
}

export function removeNotebook(notebookId: string): void {
  const meta = loadMeta()
  meta.notebooks = meta.notebooks.filter((n) => n.id !== notebookId)
  saveMeta(meta)
}

export function getSectionColor(sectionId: string): string | undefined {
  return loadMeta().sectionColors[sectionId]
}

export function setSectionColor(sectionId: string, color: string): void {
  const meta = loadMeta()
  meta.sectionColors[sectionId] = color
  saveMeta(meta)
}

export function getPageColor(pageId: string): string | undefined {
  return loadMeta().pageColors[pageId]
}

export function setPageColor(pageId: string, color: string): void {
  const meta = loadMeta()
  meta.pageColors[pageId] = color
  saveMeta(meta)
}

export function setLastOpened(notebookId: string, pageId?: string): void {
  const meta = loadMeta()
  meta.lastOpenedNotebookId = notebookId
  if (pageId) meta.lastOpenedPageId = pageId
  saveMeta(meta)
}

export function getLastOpened(): { notebookId?: string; pageId?: string } {
  const meta = loadMeta()
  return { notebookId: meta.lastOpenedNotebookId, pageId: meta.lastOpenedPageId }
}

// Derive a stable notebook id from local path
export function notebookId(localPath: string): string {
  return Buffer.from(path.resolve(localPath)).toString('base64url').slice(0, 32)
}
