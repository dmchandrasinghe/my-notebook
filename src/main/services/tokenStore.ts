import { safeStorage } from 'electron'
import fs from 'fs'
import path from 'path'
import { APP_DATA_DIR } from '../constants'

const TOKEN_FILE = path.join(APP_DATA_DIR, 'tokens.enc')

function ensureDir(): void {
  fs.mkdirSync(APP_DATA_DIR, { recursive: true })
}

export function storeToken(service: string, token: string): void {
  ensureDir()
  const all = loadAll()
  all[service] = safeStorage.isEncryptionAvailable()
    ? safeStorage.encryptString(token).toString('base64')
    : Buffer.from(token).toString('base64')
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(all), { mode: 0o600 })
}

export function getToken(service: string): string | null {
  const all = loadAll()
  const stored = all[service]
  if (!stored) return null
  const buf = Buffer.from(stored, 'base64')
  return safeStorage.isEncryptionAvailable()
    ? safeStorage.decryptString(buf)
    : buf.toString()
}

export function deleteToken(service: string): void {
  const all = loadAll()
  delete all[service]
  ensureDir()
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(all), { mode: 0o600 })
}

function loadAll(): Record<string, string> {
  try {
    if (!fs.existsSync(TOKEN_FILE)) return {}
    const raw = fs.readFileSync(TOKEN_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}
