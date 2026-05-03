import path from 'path'
import os from 'os'

export const APP_NAME = 'MY-NOTEBOOK'

/** Root directory for all app data */
export const APP_DATA_DIR = path.join(os.homedir(), APP_NAME)

/** Where cloned repos are stored */
export const REPOS_DIR = path.join(APP_DATA_DIR, 'repos')

/** Where pre-rebase conflict backups are stored */
export const BACKUPS_DIR = path.join(APP_DATA_DIR, 'backups')

/** Local app metadata file (notebooks registry, colours, etc.) */
export const META_FILE = path.join(APP_DATA_DIR, 'metadata.json')

/** Extensions treated as Pages */
export const PAGE_EXTENSIONS = new Set(['.md', '.markdown'])

/** Folders/files ignored when scanning the repo tree */
export const IGNORED_NAMES = new Set([
  '.git',
  'node_modules',
  '.DS_Store',
  'Thumbs.db',
  '.vscode',
  '.idea',
])
