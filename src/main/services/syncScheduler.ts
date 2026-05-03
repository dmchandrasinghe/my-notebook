import { getNotebooks } from './metaStore'
import { syncNotebook } from './syncEngine'
import log from 'electron-log'

const PULL_INTERVAL_MS = 12_000   // poll remote every 12 s
const DEBOUNCE_AFTER_SAVE_MS = 30_000 // wait 30 s after last save before pushing

let pullTimer: ReturnType<typeof setInterval> | null = null
let debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map()
let started = false

export function startSyncScheduler(): void {
  if (started) return
  started = true

  pullTimer = setInterval(async () => {
    const notebooks = getNotebooks()
    for (const nb of notebooks) {
      if (!nb.remoteUrl) continue
      if (nb.syncStatus === 'pulling' || nb.syncStatus === 'pushing' || nb.syncStatus === 'committing') continue
      try {
        await syncNotebook(nb)
      } catch (err) {
        log.error(`[scheduler] sync error for ${nb.name}:`, err)
      }
    }
  }, PULL_INTERVAL_MS)
}

export function stopSyncScheduler(): void {
  if (pullTimer) {
    clearInterval(pullTimer)
    pullTimer = null
  }
  for (const t of debounceTimers.values()) clearTimeout(t)
  debounceTimers.clear()
  started = false
}

/**
 * Call after the user saves a page to schedule a debounced commit+push.
 */
export function scheduleSync(notebookId: string): void {
  const existing = debounceTimers.get(notebookId)
  if (existing) clearTimeout(existing)

  const timer = setTimeout(async () => {
    debounceTimers.delete(notebookId)
    const notebooks = getNotebooks()
    const nb = notebooks.find((n) => n.id === notebookId)
    if (!nb) return
    try {
      await syncNotebook(nb)
    } catch (err) {
      log.error(`[scheduler] debounced sync error for ${nb.name}:`, err)
    }
  }, DEBOUNCE_AFTER_SAVE_MS)

  debounceTimers.set(notebookId, timer)
}
