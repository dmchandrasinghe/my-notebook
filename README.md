# MY-NOTEBOOK

> Turn any GitHub repository into a structured, visual notebook — with offline editing, full history, and automatic sync.

[![CI](https://github.com/dmchandrasinghe/my-notebook/actions/workflows/ci.yml/badge.svg)](https://github.com/dmchandrasinghe/my-notebook/actions/workflows/ci.yml)
[![Release](https://github.com/dmchandrasinghe/my-notebook/actions/workflows/release.yml/badge.svg)](https://github.com/dmchandrasinghe/my-notebook/actions/workflows/release.yml)

---

## What it does

MY-NOTEBOOK maps a GitHub repository onto a familiar notebook metaphor:

| Git concept | Notebook concept |
|-------------|-----------------|
| Repository  | Notebook        |
| Folder      | Section         |
| `.md` file  | Page            |

Every time you open the app it silently pulls the latest changes (rebase strategy, remote wins on conflict) so your notes are always current. Edits are committed and pushed in the background on a 12-second cycle.

---

## Features

- **Notebook browser** — clone any GitHub repo as a notebook with a personal access token
- **Split-view editor** — Monaco editor on the left, live Markdown preview on the right
- **Drag-and-drop section tabs** — reorder section tabs by dragging them to any position
- **Auto-sync** — pull-rebase on startup + periodic push every 12 s
- **Conflict handling** — remote always wins; conflicted local version is saved as a dated backup
- **Full-text search** — Lunr.js index across all pages
- **Page history** — view every commit that touched a file, diff any two versions, revert to any revision
- **Conflict backups panel** — browse and restore auto-saved conflict backups
- **Secure token storage** — GitHub tokens encrypted with Electron `safeStorage` (OS keychain)

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Shell | Electron 35 |
| Build | electron-vite 3 |
| UI | React 19 + TypeScript 5.7 |
| State | Zustand 5 |
| Editor | Monaco Editor 4.7 |
| Markdown | markdown-it 14 |
| Diff view | diff2html 3.4 |
| Search | Lunr.js 2.3 |
| Git ops | simple-git 3.27 |
| Packaging | electron-builder 25 (NSIS) |
| Logging | electron-log 5 |

---

## Getting started (development)

### Prerequisites

- Node.js 22+
- Git

### Install & run

```bash
npm install
npm run dev
```

The app opens at a 1280 × 820 window. On first launch click **"Clone Notebook"** and enter:
- A GitHub repository URL (`https://github.com/owner/repo`)
- A GitHub personal access token with `repo` scope

---

## Building a Windows installer

```powershell
# One-command build → dist/MY-NOTEBOOK-Setup-0.x.x.exe
$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"   # skip code signing
npm run dist
```

> **Note (Windows):** If you see a symlink privilege error during build, enable **Windows Developer Mode** in  
> *Settings → System → For Developers* and re-run. GitHub Actions runners already have the required privilege.

Output files:

| File | Description |
|------|-------------|
| `dist/MY-NOTEBOOK-Setup-*.exe` | NSIS installer (install wizard, Start Menu shortcut, uninstaller) |
| `dist/win-unpacked/` | Portable unpacked build |

---

## Useful scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Launch in dev mode with hot-reload |
| `npm run build` | Compile all bundles (main + preload + renderer) |
| `npm run typecheck` | Full TypeScript check with no emit |
| `npm run dist` | Build + package Windows x64 NSIS installer |
| `npm run dist:dir` | Build + unpack only (no installer, faster iteration) |

---

## CI / CD (GitHub Actions)

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| **CI** ([ci.yml](.github/workflows/ci.yml)) | Every push / PR | Typecheck + build on Ubuntu |
| **Auto PR** ([auto-pr.yml](.github/workflows/auto-pr.yml)) | Push to any branch except `main`/`dev` | Opens a PR targeting `dev` automatically |
| **Release** ([release.yml](.github/workflows/release.yml)) | Push to `main` or tag `v*.*.*` | Builds Windows installer, uploads artifact; creates GitHub Release on tag push |

### Releasing a new version

```bash
# 1. Bump the version
npm version patch   # or minor / major

# 2. Push the tag — Release workflow triggers automatically
git push origin main --tags
```

---

## Project structure

```
src/
├── main/               # Electron main process
│   ├── index.ts        # BrowserWindow + IPC bootstrap
│   ├── constants.ts    # App-wide path constants
│   ├── ipc/
│   │   └── handlers.ts # All ipcMain.handle() registrations
│   └── services/
│       ├── fileService.ts
│       ├── gitService.ts
│       ├── syncEngine.ts
│       ├── syncScheduler.ts
│       ├── conflictHandler.ts
│       ├── historyService.ts
│       ├── searchService.ts
│       ├── tokenStore.ts
│       ├── metaStore.ts
│       └── pathValidator.ts
├── preload/
│   └── index.ts        # contextBridge API surface
├── renderer/
│   └── src/
│       ├── App.tsx
│       ├── store/
│       │   └── appStore.ts
│       ├── components/  # All UI components
│       └── styles/
└── shared/
    ├── types.ts         # Shared domain types
    └── ipcChannels.ts   # IPC channel name constants
resources/               # App icons (icon.ico / icon.png)
.github/workflows/       # CI/CD pipelines
```

---

## Adding an app icon

Place a **256 × 256 PNG** at `resources/icon.png` and a multi-size **ICO** at `resources/icon.ico`.  
To generate an ICO from a PNG:

```bash
magick resources/icon.png -define icon:auto-resize="256,128,96,64,48,32,16" resources/icon.ico
```

---

## License

MIT
