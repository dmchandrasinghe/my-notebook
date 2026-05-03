import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git'
import path from 'path'
import fs from 'fs'
import type {
  Notebook,
  GitStatusResult,
  CommitResult,
  PushResult,
  CloneResult,
  FileHistoryEntry,
  DiffResult,
} from '@shared/types'
import { notebookId } from './metaStore'

function git(repoPath: string): SimpleGit {
  const options: Partial<SimpleGitOptions> = {
    baseDir: repoPath,
    binary: 'git',
    maxConcurrentProcesses: 1,
    trimmed: true,
  }
  return simpleGit(options)
}

// ─── Repo validation ──────────────────────────────────────────────────────────

export async function isGitRepo(localPath: string): Promise<boolean> {
  try {
    const result = await git(localPath).checkIsRepo()
    return result
  } catch {
    return false
  }
}

export async function openRepo(localPath: string): Promise<Notebook | null> {
  const valid = await isGitRepo(localPath)
  if (!valid) return null

  const g = git(localPath)
  let remoteUrl: string | undefined
  let currentBranch = 'main'

  try {
    const remotes = await g.getRemotes(true)
    const origin = remotes.find((r) => r.name === 'origin')
    remoteUrl = origin?.refs?.fetch
  } catch {
    // local-only repo — that's fine
  }

  try {
    const branch = await g.revparse(['--abbrev-ref', 'HEAD'])
    currentBranch = branch.trim()
  } catch {
    // detached HEAD or similar – keep default
  }

  const name = path.basename(localPath)

  return {
    id: notebookId(localPath),
    name,
    localPath: path.resolve(localPath),
    remoteUrl,
    currentBranch,
    syncStatus: 'synced',
  }
}

// ─── Clone ────────────────────────────────────────────────────────────────────

export async function cloneRepo(remoteUrl: string, destPath: string): Promise<CloneResult> {
  try {
    fs.mkdirSync(path.dirname(destPath), { recursive: true })
    await simpleGit().clone(remoteUrl, destPath)
    return { success: true, localPath: destPath }
  } catch (err: unknown) {
    return { success: false, error: String(err) }
  }
}

// ─── Git status ───────────────────────────────────────────────────────────────

export async function getStatus(repoPath: string): Promise<GitStatusResult> {
  try {
    const status = await git(repoPath).status()
    const files = [
      ...status.modified.map((f) => ({ path: f, status: 'modified' })),
      ...status.not_added.map((f) => ({ path: f, status: 'untracked' })),
      ...status.created.map((f) => ({ path: f, status: 'added' })),
      ...status.deleted.map((f) => ({ path: f, status: 'deleted' })),
      ...status.renamed.map((f) => ({ path: f.to, status: 'renamed' })),
    ]
    return { hasChanges: files.length > 0, files }
  } catch (err: unknown) {
    return { hasChanges: false, files: [] }
  }
}

// ─── Pull with rebase ─────────────────────────────────────────────────────────

/**
 * Pull with rebase. Returns the raw git output or throws on hard failure.
 * Conflict detection is handled by SyncEngine.
 */
export async function pullRebase(repoPath: string): Promise<string> {
  const g = git(repoPath)
  // simple-git's pull with rebase
  const result = await g.pull(['--rebase'])
  return JSON.stringify(result)
}

// ─── Commit ───────────────────────────────────────────────────────────────────

export async function commitAll(repoPath: string, message: string): Promise<CommitResult> {
  try {
    const g = git(repoPath)
    await g.add('.')
    const result = await g.commit(message)
    return { success: true, hash: result.commit }
  } catch (err: unknown) {
    return { success: false, error: String(err) }
  }
}

// ─── Push ─────────────────────────────────────────────────────────────────────

export async function push(repoPath: string): Promise<PushResult> {
  try {
    await git(repoPath).push()
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: String(err) }
  }
}

// ─── File history ─────────────────────────────────────────────────────────────

export async function getFileHistory(
  repoPath: string,
  relativePath: string,
): Promise<FileHistoryEntry[]> {
  try {
    const log = await git(repoPath).log({ file: relativePath, maxCount: 50 })
    return log.all.map((entry) => ({
      hash: entry.hash,
      shortHash: entry.hash.slice(0, 7),
      message: entry.message,
      author: entry.author_name,
      date: entry.date,
      timestamp: new Date(entry.date).getTime(),
      relativePath,
    }))
  } catch {
    return []
  }
}

export async function getFileVersion(
  repoPath: string,
  relativePath: string,
  commitHash: string,
): Promise<string> {
  try {
    const content = await git(repoPath).show([`${commitHash}:${relativePath}`])
    return content
  } catch {
    return ''
  }
}

export async function revertFile(
  repoPath: string,
  relativePath: string,
  commitHash: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await git(repoPath).checkout([commitHash, '--', relativePath])
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: String(err) }
  }
}

// ─── Diff ─────────────────────────────────────────────────────────────────────

export async function getFileDiff(
  repoPath: string,
  relativePath: string,
  fromHash: string,
  toHash = 'HEAD',
): Promise<DiffResult> {
  try {
    const g = git(repoPath)
    const unifiedDiff = await g.diff([fromHash, toHash, '--', relativePath])
    const before = await getFileVersion(repoPath, relativePath, fromHash)
    const after = await getFileVersion(repoPath, relativePath, toHash)
    return { before, after, unifiedDiff }
  } catch {
    return { before: '', after: '', unifiedDiff: '' }
  }
}

// ─── Branch info ──────────────────────────────────────────────────────────────

export async function getCurrentBranch(repoPath: string): Promise<string> {
  try {
    return (await git(repoPath).revparse(['--abbrev-ref', 'HEAD'])).trim()
  } catch {
    return 'unknown'
  }
}

// ─── Abort rebase (safety) ────────────────────────────────────────────────────

export async function abortRebase(repoPath: string): Promise<void> {
  try {
    await git(repoPath).rebase(['--abort'])
  } catch {
    // best-effort
  }
}
