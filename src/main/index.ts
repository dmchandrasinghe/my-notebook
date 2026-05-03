import { app, BrowserWindow, shell } from 'electron'
import path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import log from 'electron-log'
import { registerIpcHandlers } from './ipc/handlers'
import { startupSync } from './services/syncEngine'
import { startSyncScheduler, stopSyncScheduler } from './services/syncScheduler'

log.initialize()
log.info('[main] Starting MY-NOTEBOOK')

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    show: false,
    backgroundColor: '#f3f0e8',  // paper-like warm background
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  win.on('ready-to-show', () => win.show())

  win.webContents.setWindowOpenHandler(({ url }) => {
    // Open external links in the default browser, never inside the app
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  return win
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.mynotebook.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpcHandlers()

  createWindow()

  // Run pull-rebase for all known notebooks before renderer is interactive
  try {
    await startupSync()
  } catch (err) {
    log.error('[main] Startup sync error:', err)
  }

  startSyncScheduler()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  stopSyncScheduler()
  if (process.platform !== 'darwin') app.quit()
})
