import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { PAGE_EXTENSIONS, IGNORED_NAMES } from '../constants'
import { safeResolve } from './pathValidator'
import type {
  Section,
  Page,
  RepoTreeResult,
  PageContentResult,
  SavePageResult,
  FileOperationResult,
} from '@shared/types'

// ─── Tree scanning ────────────────────────────────────────────────────────────

export function getRepoTree(notebookId: string, repoRoot: string): RepoTreeResult {
  const sections: Section[] = []
  const pages: Page[] = []
  scanDir(repoRoot, repoRoot, notebookId, null, sections, pages)
  return { sections, pages }
}

function scanDir(
  baseRoot: string,
  dirPath: string,
  notebookId: string,
  parentSectionId: string | null,
  sections: Section[],
  pages: Page[],
): void {
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true })
  } catch {
    return
  }

  for (const entry of entries) {
    if (IGNORED_NAMES.has(entry.name)) continue

    const absPath = path.join(dirPath, entry.name)
    const relPath = path.relative(baseRoot, absPath).replace(/\\/g, '/')

    if (entry.isDirectory()) {
      const sectionId = makeId(notebookId + ':' + relPath)
      sections.push({
        id: sectionId,
        notebookId,
        name: entry.name,
        relativePath: relPath,
      })
      scanDir(baseRoot, absPath, notebookId, sectionId, sections, pages)
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase()
      if (PAGE_EXTENSIONS.has(ext)) {
        const pageId = makeId(notebookId + ':' + relPath)
        const sectionId = parentSectionId ?? undefined
        pages.push({
          id: pageId,
          notebookId,
          sectionId: sectionId ?? undefined,
          name: stripExtension(entry.name),
          relativePath: relPath,
          extension: ext,
          isDirty: false,
          hasConflict: false,
        })
      }
    }
  }
}

function makeId(input: string): string {
  return crypto.createHash('sha1').update(input).digest('hex').slice(0, 16)
}

function stripExtension(filename: string): string {
  return filename.replace(/\.(md|markdown)$/i, '')
}

// ─── Page content ─────────────────────────────────────────────────────────────

export function getPageContent(repoRoot: string, relativePath: string): PageContentResult {
  const abs = safeResolve(repoRoot, relativePath)
  const content = fs.readFileSync(abs, 'utf-8')
  return { content, isDirty: false }
}

export function savePage(repoRoot: string, relativePath: string, content: string): SavePageResult {
  try {
    const abs = safeResolve(repoRoot, relativePath)
    fs.mkdirSync(path.dirname(abs), { recursive: true })
    fs.writeFileSync(abs, content, 'utf-8')
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: String(err) }
  }
}

// ─── File / folder CRUD ───────────────────────────────────────────────────────

export function createPage(
  repoRoot: string,
  relativePath: string,
  initialContent = '',
): FileOperationResult {
  try {
    const abs = safeResolve(repoRoot, relativePath)
    if (fs.existsSync(abs)) return { success: false, error: 'File already exists' }
    fs.mkdirSync(path.dirname(abs), { recursive: true })
    fs.writeFileSync(abs, initialContent, 'utf-8')
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: String(err) }
  }
}

export function deletePage(repoRoot: string, relativePath: string): FileOperationResult {
  try {
    const abs = safeResolve(repoRoot, relativePath)
    fs.rmSync(abs, { force: true })
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: String(err) }
  }
}

export function renamePage(
  repoRoot: string,
  oldRelative: string,
  newRelative: string,
): FileOperationResult {
  try {
    const src = safeResolve(repoRoot, oldRelative)
    const dst = safeResolve(repoRoot, newRelative)
    if (fs.existsSync(dst)) return { success: false, error: 'Destination already exists' }
    fs.renameSync(src, dst)
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: String(err) }
  }
}

export function movePage(
  repoRoot: string,
  oldRelative: string,
  newRelative: string,
): FileOperationResult {
  return renamePage(repoRoot, oldRelative, newRelative)
}

export function createSection(repoRoot: string, relativePath: string): FileOperationResult {
  try {
    const abs = safeResolve(repoRoot, relativePath)
    fs.mkdirSync(abs, { recursive: true })
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: String(err) }
  }
}

export function deleteSection(repoRoot: string, relativePath: string): FileOperationResult {
  try {
    const abs = safeResolve(repoRoot, relativePath)
    fs.rmSync(abs, { recursive: true, force: true })
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: String(err) }
  }
}

export function renameSection(
  repoRoot: string,
  oldRelative: string,
  newRelative: string,
): FileOperationResult {
  return renamePage(repoRoot, oldRelative, newRelative)
}
