import { BrowserWindow } from 'electron'
import log from 'electron-log'
import { getStatus, pullRebase, commitAll, push, abortRebase } from './gitService'
import { autoResolveConflicts } from './conflictHandler'
import { upsertNotebook, getNotebooks } from './metaStore'
import { IPC } from '@shared/ipcChannels'
import type { Notebook, SyncResult, ConflictBackup } from '@shared/types'

// Emit an event to all renderer windows
function emit(channel: string, ...args: unknown[]): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, ...args)
    }
  }
}

function setSyncStatus(notebook: Notebook, status: Notebook['syncStatus'], error?: string): void {
  const updated: Notebook = { ...notebook, syncStatus: status, syncError: error }
  upsertNotebook(updated)
  emit(IPC.SYNC_STATUS_CHANGED, updated)
}

// ─── Single-notebook pull-rebase ──────────────────────────────────────────────

export async function syncNotebook(notebook: Notebook): Promise<SyncResult> {
  const { localPath, id: notebookId } = notebook

  // Skip if no remote
  if (!notebook.remoteUrl) {
    return { success: true, conflictsResolved: [] }
  }

  setSyncStatus(notebook, 'pulling')
  const allBackups: ConflictBackup[] = []

  try {
    await pullRebase(localPath)
  } catch (err: unknown) {
    const errMsg = String(err)

    // If pull --rebase left conflicts, auto-resolve them
    if (errMsg.includes('CONFLICT') || errMsg.includes('conflict')) {
      log.info(`[sync] Conflicts detected in ${notebook.name} – auto-resolving`)
      const backups = await autoResolveConflicts(localPath, notebookId)
      allBackups.push(...backups)

      for (const backup of backups) {
        emit(IPC.CONFLICT_RESOLVED, backup)
      }
    } else if (errMsg.includes('nothing to rebase') || errMsg.includes('is up to date')) {
      // Normal case – no upstream changes
    } else {
      log.warn(`[sync] pullRebase failed for ${notebook.name}: ${errMsg}`)
      setSyncStatus(notebook, 'error', errMsg)
      return { success: false, conflictsResolved: allBackups, error: errMsg }
    }
  }

  // Commit any dirty pages the user saved before the pull
  const status = await getStatus(localPath)
  if (status.hasChanges) {
    setSyncStatus(notebook, 'committing')
    const commitResult = await commitAll(localPath, 'Auto-save: local changes')
    if (!commitResult.success) {
      log.warn(`[sync] commit failed for ${notebook.name}: ${commitResult.error}`)
      setSyncStatus(notebook, 'error', commitResult.error)
      return { success: false, conflictsResolved: allBackups, error: commitResult.error }
    }
  }

  // Push if we have a remote
  if (notebook.remoteUrl) {
    setSyncStatus(notebook, 'pushing')
    const pushResult = await push(localPath)
    if (!pushResult.success) {
      log.warn(`[sync] push failed for ${notebook.name}: ${pushResult.error}`)
      setSyncStatus(notebook, 'error', pushResult.error)
      return { success: false, conflictsResolved: allBackups, error: pushResult.error }
    }
  }

  setSyncStatus({ ...notebook, lastSyncedAt: Date.now() }, 'synced')
  return { success: true, conflictsResolved: allBackups }
}

// ─── Startup sync (all notebooks) ────────────────────────────────────────────

export async function startupSync(): Promise<void> {
  const notebooks = getNotebooks()
  log.info(`[sync] Startup sync: ${notebooks.length} notebook(s)`)

  for (const nb of notebooks) {
    if (!nb.remoteUrl) continue
    setSyncStatus(nb, 'startup_sync')
    try {
      await syncNotebook(nb)
    } catch (err) {
      log.error(`[sync] Startup sync failed for ${nb.name}:`, err)
    }
  }

  emit(IPC.STARTUP_SYNC_COMPLETE)
}

// ─── Full sync on demand ──────────────────────────────────────────────────────

export async function syncNow(notebook: Notebook): Promise<SyncResult> {
  return syncNotebook(notebook)
}
