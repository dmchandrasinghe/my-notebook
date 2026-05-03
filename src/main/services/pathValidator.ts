import path from 'path'
import { REPOS_DIR } from '../constants'

/**
 * Ensure a resolved absolute path stays inside an allowed root.
 * Throws if the path escapes the root (path traversal prevention).
 */
export function assertPathInside(root: string, filePath: string): void {
  const resolved = path.resolve(root, filePath)
  const resolvedRoot = path.resolve(root)
  if (!resolved.startsWith(resolvedRoot + path.sep) && resolved !== resolvedRoot) {
    throw new Error(`Path traversal detected: "${filePath}" escapes root "${root}"`)
  }
}

/**
 * Resolve a relative path against a repo root, validating it stays inside.
 * Returns the absolute path.
 */
export function safeResolve(root: string, relative: string): string {
  assertPathInside(root, relative)
  return path.resolve(root, relative)
}

/**
 * Build a stable local folder name for a cloned repo.
 * e.g. "owner/repo-name" → "<REPOS_DIR>/owner__repo-name"
 */
export function repoLocalPath(owner: string, repoName: string): string {
  const safeName = `${owner}__${repoName}`.replace(/[^a-zA-Z0-9._-]/g, '_')
  return path.join(REPOS_DIR, safeName)
}
