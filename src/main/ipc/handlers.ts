import { ipcMain, dialog } from 'electron'
import log from 'electron-log'
import { IPC } from '@shared/ipcChannels'
import type {
  OpenRepoResult,
  SavePageResult,
  FileOperationResult,
  SyncResult,
  CloneResult,
} from '@shared/types'
import { getNotebooks, upsertNotebook, removeNotebook } from '../services/metaStore'
import { openRepo, cloneRepo, getStatus, commitAll, push, getCurrentBranch } from '../services/gitService'
import { getRepoTree, getPageContent, savePage, createPage, deletePage, renamePage, movePage, createSection, deleteSection, renameSection } from '../services/fileService'
import { syncNow } from '../services/syncEngine'
import { scheduleSync } from '../services/syncScheduler'
import { getFileHistory, getFileVersion, getFileDiff, revertFile } from '../services/gitService'
import { getConflictBackups, getBackupContent } from '../services/conflictHandler'
import { search, buildIndex } from '../services/searchService'
import { storeToken, getToken, deleteToken } from '../services/tokenStore'

export function registerIpcHandlers(): void {

  // ─── Notebook management ───────────────────────────────────────────────────

  ipcMain.handle(IPC.GET_NOTEBOOKS, () => getNotebooks())

  ipcMain.handle(IPC.OPEN_REPO_DIALOG, async (): Promise<OpenRepoResult> => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    if (result.canceled || result.filePaths.length === 0) return { success: false }
    const localPath = result.filePaths[0]
    return openAndRegister(localPath)
  })

  ipcMain.handle(IPC.OPEN_REPO_PATH, async (_e, localPath: string): Promise<OpenRepoResult> => {
    return openAndRegister(localPath)
  })

  ipcMain.handle(IPC.REMOVE_NOTEBOOK, (_e, notebookId: string) => {
    removeNotebook(notebookId)
    return { success: true }
  })

  ipcMain.handle(IPC.GET_REPO_TREE, (_e, notebookId: string, localPath: string) => {
    return getRepoTree(notebookId, localPath)
  })

  // ─── Page CRUD ─────────────────────────────────────────────────────────────

  ipcMain.handle(IPC.GET_PAGE_CONTENT, (_e, repoRoot: string, relativePath: string) => {
    return getPageContent(repoRoot, relativePath)
  })

  ipcMain.handle(
    IPC.SAVE_PAGE,
    async (_e, notebookId: string, repoRoot: string, relativePath: string, content: string): Promise<SavePageResult> => {
      const result = savePage(repoRoot, relativePath, content)
      if (result.success) scheduleSync(notebookId)
      return result
    },
  )

  ipcMain.handle(
    IPC.CREATE_PAGE,
    (_e, repoRoot: string, relativePath: string): FileOperationResult => createPage(repoRoot, relativePath),
  )

  ipcMain.handle(
    IPC.DELETE_PAGE,
    (_e, repoRoot: string, relativePath: string): FileOperationResult => deletePage(repoRoot, relativePath),
  )

  ipcMain.handle(
    IPC.RENAME_PAGE,
    (_e, repoRoot: string, oldRel: string, newRel: string): FileOperationResult =>
      renamePage(repoRoot, oldRel, newRel),
  )

  ipcMain.handle(
    IPC.MOVE_PAGE,
    (_e, repoRoot: string, oldRel: string, newRel: string): FileOperationResult =>
      movePage(repoRoot, oldRel, newRel),
  )

  // ─── Section CRUD ──────────────────────────────────────────────────────────

  ipcMain.handle(
    IPC.CREATE_SECTION,
    (_e, repoRoot: string, relativePath: string): FileOperationResult =>
      createSection(repoRoot, relativePath),
  )

  ipcMain.handle(
    IPC.DELETE_SECTION,
    (_e, repoRoot: string, relativePath: string): FileOperationResult =>
      deleteSection(repoRoot, relativePath),
  )

  ipcMain.handle(
    IPC.RENAME_SECTION,
    (_e, repoRoot: string, oldRel: string, newRel: string): FileOperationResult =>
      renameSection(repoRoot, oldRel, newRel),
  )

  // ─── Git sync ──────────────────────────────────────────────────────────────

  ipcMain.handle(IPC.GIT_STATUS, async (_e, repoPath: string) => {
    return getStatus(repoPath)
  })

  ipcMain.handle(IPC.GIT_COMMIT, async (_e, repoPath: string, message: string) => {
    return commitAll(repoPath, message)
  })

  ipcMain.handle(IPC.GIT_PUSH, async (_e, repoPath: string) => {
    return push(repoPath)
  })

  ipcMain.handle(IPC.GIT_SYNC_NOW, async (_e, notebookId: string): Promise<SyncResult> => {
    const notebooks = getNotebooks()
    const nb = notebooks.find((n) => n.id === notebookId)
    if (!nb) return { success: false, conflictsResolved: [], error: 'Notebook not found' }
    return syncNow(nb)
  })

  // ─── History ───────────────────────────────────────────────────────────────

  ipcMain.handle(IPC.GET_FILE_HISTORY, (_e, repoPath: string, relativePath: string) => {
    return getFileHistory(repoPath, relativePath)
  })

  ipcMain.handle(IPC.GET_FILE_VERSION, (_e, repoPath: string, relativePath: string, hash: string) => {
    return getFileVersion(repoPath, relativePath, hash)
  })

  ipcMain.handle(IPC.REVERT_FILE, (_e, repoPath: string, relativePath: string, hash: string) => {
    return revertFile(repoPath, relativePath, hash)
  })

  ipcMain.handle(IPC.GET_DIFF, (_e, repoPath: string, relativePath: string, from: string, to?: string) => {
    return getFileDiff(repoPath, relativePath, from, to)
  })

  // ─── Conflict backups ──────────────────────────────────────────────────────

  ipcMain.handle(IPC.GET_CONFLICT_BACKUPS, (_e, notebookId: string) => {
    return getConflictBackups(notebookId)
  })

  ipcMain.handle(IPC.GET_BACKUP_CONTENT, (_e, _notebookId: string, backupPath: string) => {
    return getBackupContent(backupPath)
  })

  // ─── Search ────────────────────────────────────────────────────────────────

  ipcMain.handle(IPC.SEARCH, (_e, query: string) => search(query))
  ipcMain.handle(IPC.REBUILD_INDEX, () => { buildIndex(); return { success: true } })

  // ─── Clone ─────────────────────────────────────────────────────────────────

  ipcMain.handle(IPC.CLONE_REPO, async (_e, remoteUrl: string, destPath: string): Promise<CloneResult> => {
    const result = await cloneRepo(remoteUrl, destPath)
    if (result.success && result.localPath) {
      await openAndRegister(result.localPath)
    }
    return result
  })

  log.info('[ipc] All handlers registered')
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function openAndRegister(localPath: string): Promise<OpenRepoResult> {
  try {
    const notebook = await openRepo(localPath)
    if (!notebook) return { success: false, error: 'Not a git repository' }
    upsertNotebook(notebook)
    return { success: true, notebook }
  } catch (err: unknown) {
    return { success: false, error: String(err) }
  }
}
