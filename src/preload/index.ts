import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/ipcChannels'
import type {
  OpenRepoResult,
  RepoTreeResult,
  PageContentResult,
  SavePageResult,
  FileOperationResult,
  GitStatusResult,
  SyncResult,
  PushResult,
  CommitResult,
  CloneResult,
  FileHistoryEntry,
  DiffResult,
  SearchResult,
  ConflictBackup,
  Notebook,
} from '@shared/types'

// The bridge exposed to the renderer under window.api
const api = {
  // ─── Notebook ──────────────────────────────────────────────────────────────
  getNotebooks: (): Promise<Notebook[]> => ipcRenderer.invoke(IPC.GET_NOTEBOOKS),
  openRepoDialog: (): Promise<OpenRepoResult> => ipcRenderer.invoke(IPC.OPEN_REPO_DIALOG),
  openRepoPath: (localPath: string): Promise<OpenRepoResult> =>
    ipcRenderer.invoke(IPC.OPEN_REPO_PATH, localPath),
  removeNotebook: (notebookId: string): Promise<void> =>
    ipcRenderer.invoke(IPC.REMOVE_NOTEBOOK, notebookId),
  getRepoTree: (notebookId: string, localPath: string): Promise<RepoTreeResult> =>
    ipcRenderer.invoke(IPC.GET_REPO_TREE, notebookId, localPath),

  // ─── Pages ─────────────────────────────────────────────────────────────────
  getPageContent: (repoRoot: string, relativePath: string): Promise<PageContentResult> =>
    ipcRenderer.invoke(IPC.GET_PAGE_CONTENT, repoRoot, relativePath),
  savePage: (
    notebookId: string,
    repoRoot: string,
    relativePath: string,
    content: string,
  ): Promise<SavePageResult> =>
    ipcRenderer.invoke(IPC.SAVE_PAGE, notebookId, repoRoot, relativePath, content),
  createPage: (repoRoot: string, relativePath: string): Promise<FileOperationResult> =>
    ipcRenderer.invoke(IPC.CREATE_PAGE, repoRoot, relativePath),
  deletePage: (repoRoot: string, relativePath: string): Promise<FileOperationResult> =>
    ipcRenderer.invoke(IPC.DELETE_PAGE, repoRoot, relativePath),
  renamePage: (repoRoot: string, oldRel: string, newRel: string): Promise<FileOperationResult> =>
    ipcRenderer.invoke(IPC.RENAME_PAGE, repoRoot, oldRel, newRel),
  movePage: (repoRoot: string, oldRel: string, newRel: string): Promise<FileOperationResult> =>
    ipcRenderer.invoke(IPC.MOVE_PAGE, repoRoot, oldRel, newRel),

  // ─── Sections ──────────────────────────────────────────────────────────────
  createSection: (repoRoot: string, relativePath: string): Promise<FileOperationResult> =>
    ipcRenderer.invoke(IPC.CREATE_SECTION, repoRoot, relativePath),
  deleteSection: (repoRoot: string, relativePath: string): Promise<FileOperationResult> =>
    ipcRenderer.invoke(IPC.DELETE_SECTION, repoRoot, relativePath),
  renameSection: (repoRoot: string, oldRel: string, newRel: string): Promise<FileOperationResult> =>
    ipcRenderer.invoke(IPC.RENAME_SECTION, repoRoot, oldRel, newRel),

  // ─── Git ───────────────────────────────────────────────────────────────────
  gitStatus: (repoPath: string): Promise<GitStatusResult> =>
    ipcRenderer.invoke(IPC.GIT_STATUS, repoPath),
  gitCommit: (repoPath: string, message: string): Promise<CommitResult> =>
    ipcRenderer.invoke(IPC.GIT_COMMIT, repoPath, message),
  gitPush: (repoPath: string): Promise<PushResult> => ipcRenderer.invoke(IPC.GIT_PUSH, repoPath),
  syncNow: (notebookId: string): Promise<SyncResult> =>
    ipcRenderer.invoke(IPC.GIT_SYNC_NOW, notebookId),
  cloneRepo: (remoteUrl: string, destPath: string): Promise<CloneResult> =>
    ipcRenderer.invoke(IPC.CLONE_REPO, remoteUrl, destPath),

  // ─── History ───────────────────────────────────────────────────────────────
  getFileHistory: (repoPath: string, relativePath: string): Promise<FileHistoryEntry[]> =>
    ipcRenderer.invoke(IPC.GET_FILE_HISTORY, repoPath, relativePath),
  getFileVersion: (repoPath: string, relativePath: string, hash: string): Promise<string> =>
    ipcRenderer.invoke(IPC.GET_FILE_VERSION, repoPath, relativePath, hash),
  revertFile: (repoPath: string, relativePath: string, hash: string): Promise<FileOperationResult> =>
    ipcRenderer.invoke(IPC.REVERT_FILE, repoPath, relativePath, hash),
  revert: (notebookId: string, repoPath: string, relativePath: string, hash: string): Promise<FileOperationResult> =>
    ipcRenderer.invoke(IPC.REVERT_FILE, repoPath, relativePath, hash),
  getDiff: (repoPath: string, relativePath: string, from: string, to?: string): Promise<DiffResult> =>
    ipcRenderer.invoke(IPC.GET_DIFF, repoPath, relativePath, from, to),

  // ─── Conflict backups ──────────────────────────────────────────────────────
  getConflictBackups: (notebookId: string): Promise<ConflictBackup[]> =>
    ipcRenderer.invoke(IPC.GET_CONFLICT_BACKUPS, notebookId),
  getBackupContent: (notebookId: string, backupPath: string): Promise<{ content: string }> =>
    ipcRenderer.invoke(IPC.GET_BACKUP_CONTENT, notebookId, backupPath),

  // ─── Search ────────────────────────────────────────────────────────────────
  search: (query: string): Promise<SearchResult[]> => ipcRenderer.invoke(IPC.SEARCH, query),
  rebuildIndex: (): Promise<void> => ipcRenderer.invoke(IPC.REBUILD_INDEX),

  // ─── Events from main ──────────────────────────────────────────────────────
  onSyncStatusChanged: (cb: (nb: Notebook) => void) => {
    ipcRenderer.on(IPC.SYNC_STATUS_CHANGED, (_e, nb) => cb(nb))
    return () => ipcRenderer.removeAllListeners(IPC.SYNC_STATUS_CHANGED)
  },
  onConflictResolved: (cb: (backup: ConflictBackup) => void) => {
    ipcRenderer.on(IPC.CONFLICT_RESOLVED, (_e, backup) => cb(backup))
    return () => ipcRenderer.removeAllListeners(IPC.CONFLICT_RESOLVED)
  },
  onStartupSyncComplete: (cb: () => void) => {
    ipcRenderer.once(IPC.STARTUP_SYNC_COMPLETE, () => cb())
  },
}

contextBridge.exposeInMainWorld('api', api)

export type AppApi = typeof api
