import fs from 'fs'
import path from 'path'
import simpleGit from 'simple-git'
import { BACKUPS_DIR } from '../constants'
import type { ConflictBackup } from '@shared/types'

/**
 * After a pull --rebase that leaves conflicts, auto-resolve by taking
 * the remote ("theirs") version for every conflicted file.
 *
 * Workflow:
 *  1. Backup the ours version of each conflicted file to ~/MY-NOTEBOOK/backups/
 *  2. git checkout --theirs <file>  for each conflict
 *  3. git add <file>                mark resolved
 *  4. git rebase --continue
 */
export async function autoResolveConflicts(
  repoPath: string,
  notebookId: string,
): Promise<ConflictBackup[]> {
  const g = simpleGit(repoPath)
  const backups: ConflictBackup[] = []

  let status
  try {
    status = await g.status()
  } catch {
    return []
  }

  const conflicted = status.conflicted
  if (conflicted.length === 0) return []

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = buildBackupDir(notebookId, timestamp)
  fs.mkdirSync(backupDir, { recursive: true })

  for (const relPath of conflicted) {
    const absPath = path.join(repoPath, relPath)

    // 1 – backup ours before overwriting
    const backupPath = path.join(backupDir, relPath.replace(/\//g, '__'))
    try {
      if (fs.existsSync(absPath)) {
        fs.mkdirSync(path.dirname(backupPath), { recursive: true })
        fs.copyFileSync(absPath, backupPath)
      }
    } catch {
      // non-critical: continue even if backup fails
    }

    // 2 – accept remote (theirs)
    try {
      await g.checkout(['--theirs', '--', relPath])
    } catch {
      // If the file was deleted on remote side, remove it locally
      try {
        if (fs.existsSync(absPath)) fs.rmSync(absPath, { force: true })
      } catch {
        /* best-effort */
      }
    }

    // 3 – stage the resolved file
    try {
      await g.add(relPath)
    } catch {
      /* best-effort */
    }

    const remoteHash = await getRemoteHash(repoPath, relPath)

    backups.push({
      notebookId,
      relativePath: relPath,
      pageName: path.basename(relPath, path.extname(relPath)),
      backupPath,
      resolvedAt: Date.now(),
      remoteHash,
    })
  }

  // 4 – continue the rebase
  try {
    await g.env({ GIT_EDITOR: 'true' }).rebase(['--continue'])
  } catch {
    // If --continue still fails, abort and log it
    try {
      await g.rebase(['--abort'])
    } catch {
      /* best-effort */
    }
  }

  return backups
}

function buildBackupDir(notebookId: string, timestamp: string): string {
  const safeName = notebookId.replace(/[^a-zA-Z0-9._-]/g, '_')
  return path.join(BACKUPS_DIR, safeName, timestamp)
}

async function getRemoteHash(repoPath: string, relPath: string): Promise<string> {
  try {
    const g = simpleGit(repoPath)
    const output = await g.revparse([`MERGE_HEAD:${relPath}`])
    return output.trim().slice(0, 7)
  } catch {
    return 'unknown'
  }
}

/** List all backup sets for a notebook */
export function getConflictBackups(notebookId: string): ConflictBackup[] {
  const safeName = notebookId.replace(/[^a-zA-Z0-9._-]/g, '_')
  const notebookBackupDir = path.join(BACKUPS_DIR, safeName)
  if (!fs.existsSync(notebookBackupDir)) return []

  const backups: ConflictBackup[] = []
  const sessions = fs.readdirSync(notebookBackupDir)

  for (const session of sessions) {
    const sessionDir = path.join(notebookBackupDir, session)
    if (!fs.statSync(sessionDir).isDirectory()) continue

    const files = fs.readdirSync(sessionDir)
    for (const file of files) {
      backups.push({
        notebookId,
        relativePath: file.replace(/__/g, '/'),
        pageName: path.basename(file, path.extname(file)),
        backupPath: path.join(sessionDir, file),
        resolvedAt: new Date(session.replace(/-(\d{3})$/, '.$1')).getTime() || 0,
        remoteHash: 'unknown',
      })
    }
  }

  return backups
}

export function getBackupContent(backupPath: string): string {
  try {
    return fs.readFileSync(backupPath, 'utf-8')
  } catch {
    return ''
  }
}
