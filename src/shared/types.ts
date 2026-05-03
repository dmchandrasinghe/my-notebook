// ─── Core domain types ───────────────────────────────────────────────────────

export type SyncStatus =
  | 'synced'
  | 'local_changes'
  | 'pulling'
  | 'committing'
  | 'pushing'
  | 'conflict'
  | 'error'
  | 'startup_sync'

export interface Notebook {
  id: string
  name: string
  localPath: string
  remoteUrl?: string
  currentBranch: string
  syncStatus: SyncStatus
  lastSyncedAt?: number
  syncError?: string
}

export interface Section {
  id: string
  notebookId: string
  name: string
  relativePath: string
  color?: string
  children?: Section[]
}

export interface Page {
  id: string
  notebookId: string
  sectionId?: string
  name: string
  relativePath: string
  extension: string
  color?: string
  isDirty: boolean
  hasConflict: boolean
  autoResolvedAt?: number
}

// ─── Git / history types ─────────────────────────────────────────────────────

export interface CommitEntry {
  hash: string
  shortHash: string
  message: string
  author: string
  date: string
  timestamp: number
}

export interface FileHistoryEntry extends CommitEntry {
  relativePath: string
}

export interface DiffResult {
  before: string
  after: string
  unifiedDiff: string
}

export interface ConflictBackup {
  notebookId: string
  relativePath: string
  pageName: string
  backupPath: string
  resolvedAt: number
  remoteHash: string
}

// ─── IPC request / response shapes ───────────────────────────────────────────

export interface OpenRepoResult {
  success: boolean
  notebook?: Notebook
  error?: string
}

export interface RepoTreeResult {
  sections: Section[]
  pages: Page[]
}

export interface PageContentResult {
  content: string
  isDirty: boolean
}

export interface SavePageResult {
  success: boolean
  error?: string
}

export interface GitStatusResult {
  hasChanges: boolean
  files: { path: string; status: string }[]
}

export interface SyncResult {
  success: boolean
  conflictsResolved: ConflictBackup[]
  error?: string
}

export interface PushResult {
  success: boolean
  error?: string
}

export interface CommitResult {
  success: boolean
  hash?: string
  error?: string
}

export interface CloneResult {
  success: boolean
  localPath?: string
  error?: string
}

export interface FileOperationResult {
  success: boolean
  error?: string
}

export interface SearchResult {
  type: 'page' | 'section'
  notebookId: string
  sectionId?: string
  pageId?: string
  name: string
  relativePath: string
  excerpt?: string
}
