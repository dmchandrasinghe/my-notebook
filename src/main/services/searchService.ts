import lunr from 'lunr'
import { getRepoTree } from './fileService'
import { getPageContent } from './fileService'
import { getNotebooks } from './metaStore'
import log from 'electron-log'
import type { SearchResult } from '@shared/types'

interface DocRecord {
  id: string
  notebookId: string
  sectionId?: string
  pageId?: string
  type: 'page' | 'section'
  name: string
  relativePath: string
  body: string
}

let idx: lunr.Index | null = null
const docs: Map<string, DocRecord> = new Map()

export function buildIndex(): void {
  docs.clear()

  for (const nb of getNotebooks()) {
    const { sections, pages } = getRepoTree(nb.id, nb.localPath)

    for (const section of sections) {
      const rec: DocRecord = {
        id: section.id,
        notebookId: nb.id,
        sectionId: section.id,
        type: 'section',
        name: section.name,
        relativePath: section.relativePath,
        body: '',
      }
      docs.set(section.id, rec)
    }

    for (const page of pages) {
      let body = ''
      try {
        const result = getPageContent(nb.localPath, page.relativePath)
        body = result.content
      } catch {
        // unreadable file – index name only
      }
      const rec: DocRecord = {
        id: page.id,
        notebookId: nb.id,
        sectionId: page.sectionId,
        pageId: page.id,
        type: 'page',
        name: page.name,
        relativePath: page.relativePath,
        body,
      }
      docs.set(page.id, rec)
    }
  }

  idx = lunr(function () {
    this.ref('id')
    this.field('name', { boost: 10 })
    this.field('body')
    docs.forEach((doc) => this.add(doc))
  })

  log.info(`[search] Index built – ${docs.size} documents`)
}

export function search(query: string): SearchResult[] {
  if (!idx) buildIndex()
  if (!idx) return []

  try {
    const matches = idx.search(query)
    return matches.map((m) => {
      const doc = docs.get(m.ref)!
      const excerpt = buildExcerpt(doc.body, query)
      return {
        type: doc.type,
        notebookId: doc.notebookId,
        sectionId: doc.sectionId,
        pageId: doc.pageId,
        name: doc.name,
        relativePath: doc.relativePath,
        excerpt,
      }
    })
  } catch {
    return []
  }
}

function buildExcerpt(body: string, query: string): string | undefined {
  if (!body) return undefined
  const words = query.toLowerCase().split(/\s+/)
  const lc = body.toLowerCase()
  for (const word of words) {
    const idx = lc.indexOf(word)
    if (idx !== -1) {
      const start = Math.max(0, idx - 60)
      const end = Math.min(body.length, idx + 120)
      return (start > 0 ? '…' : '') + body.slice(start, end).trim() + (end < body.length ? '…' : '')
    }
  }
  return undefined
}

/** Rebuild index after file changes */
export function invalidateIndex(): void {
  idx = null
}
