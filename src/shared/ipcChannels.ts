// All IPC channel names as constants – shared between main and renderer

export const IPC = {
  // ── Repo / notebook ──────────────────────────────────────────────────────
  OPEN_REPO_DIALOG: 'notebook:open-repo-dialog',
  OPEN_REPO_PATH: 'notebook:open-repo-path',
  GET_NOTEBOOKS: 'notebook:get-all',
  REMOVE_NOTEBOOK: 'notebook:remove',
  GET_REPO_TREE: 'notebook:get-tree',

  // ── Pages ─────────────────────────────────────────────────────────────────
  GET_PAGE_CONTENT: 'page:get-content',
  SAVE_PAGE: 'page:save',
  CREATE_PAGE: 'page:create',
  DELETE_PAGE: 'page:delete',
  RENAME_PAGE: 'page:rename',
  MOVE_PAGE: 'page:move',

  // ── Sections / folders ────────────────────────────────────────────────────
  CREATE_SECTION: 'section:create',
  DELETE_SECTION: 'section:delete',
  RENAME_SECTION: 'section:rename',
  MOVE_SECTION: 'section:move',

  // ── Git sync ──────────────────────────────────────────────────────────────
  GIT_STATUS: 'git:status',
  GIT_PULL_REBASE: 'git:pull-rebase',
  GIT_COMMIT: 'git:commit',
  GIT_PUSH: 'git:push',
  GIT_SYNC_NOW: 'git:sync-now',         // pull-rebase → commit → push

  // ── History ───────────────────────────────────────────────────────────────
  GET_FILE_HISTORY: 'history:get-file',
  GET_FILE_VERSION: 'history:get-version',
  REVERT_FILE: 'history:revert',
  GET_DIFF: 'history:get-diff',

  // ── Conflict backups ─────────────────────────────────────────────────────
  GET_CONFLICT_BACKUPS: 'conflict:get-backups',
  GET_BACKUP_CONTENT: 'conflict:get-backup-content',

  // ── Search ────────────────────────────────────────────────────────────────
  SEARCH: 'search:query',
  REBUILD_INDEX: 'search:rebuild',

  // ── Clone ─────────────────────────────────────────────────────────────────
  CLONE_REPO: 'repo:clone',

  // ── Push-to-renderer events (main → renderer) ─────────────────────────────
  SYNC_STATUS_CHANGED: 'event:sync-status-changed',
  CONFLICT_RESOLVED: 'event:conflict-resolved',
  FILE_CHANGED: 'event:file-changed',
  STARTUP_SYNC_COMPLETE: 'event:startup-sync-complete',
} as const
