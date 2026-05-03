import { getFileHistory, getFileVersion, getFileDiff, revertFile } from './gitService'
import type { FileHistoryEntry, DiffResult } from '@shared/types'

export async function fetchHistory(
  repoPath: string,
  relativePath: string,
): Promise<FileHistoryEntry[]> {
  return getFileHistory(repoPath, relativePath)
}

export async function fetchVersion(
  repoPath: string,
  relativePath: string,
  commitHash: string,
): Promise<string> {
  return getFileVersion(repoPath, relativePath, commitHash)
}

export async function fetchDiff(
  repoPath: string,
  relativePath: string,
  fromHash: string,
  toHash?: string,
): Promise<DiffResult> {
  return getFileDiff(repoPath, relativePath, fromHash, toHash)
}

export async function revert(
  repoPath: string,
  relativePath: string,
  commitHash: string,
): Promise<{ success: boolean; error?: string }> {
  return revertFile(repoPath, relativePath, commitHash)
}
