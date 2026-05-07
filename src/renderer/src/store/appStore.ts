import { create } from 'zustand'
import type { Notebook, Section, Page, SyncStatus } from '@shared/types'

interface AppState {
  // ─── Notebooks ─────────────────────────────────────────────────────────────
  notebooks: Notebook[]
  activeNotebookId: string | null
  setNotebooks: (nbs: Notebook[]) => void
  setActiveNotebook: (id: string | null) => void
  updateNotebook: (nb: Notebook) => void

  // ─── Sections & Pages ──────────────────────────────────────────────────────
  sections: Section[]
  pages: Page[]
  activeSectionId: string | null
  activePageId: string | null
  setSections: (sections: Section[]) => void
  setPages: (pages: Page[]) => void
  setActiveSection: (id: string | null) => void
  setActivePage: (id: string | null) => void
  reorderSections: (fromIdx: number, toIdx: number) => void

  // ─── Editor ────────────────────────────────────────────────────────────────
  pageContent: string
  isDirty: boolean
  isEditMode: boolean
  setPageContent: (content: string) => void
  setDirty: (dirty: boolean) => void
  setEditMode: (edit: boolean) => void

  // ─── Sync status ───────────────────────────────────────────────────────────
  syncStatuses: Record<string, SyncStatus>
  setSyncStatus: (notebookId: string, status: SyncStatus) => void

  // ─── Search ────────────────────────────────────────────────────────────────
  searchOpen: boolean
  searchQuery: string
  setSearchOpen: (open: boolean) => void
  setSearchQuery: (q: string) => void

  // ─── UI panels ─────────────────────────────────────────────────────────────
  historyOpen: boolean
  conflictsOpen: boolean
  cloneDialogOpen: boolean
  setHistoryOpen: (open: boolean) => void
  setConflictsOpen: (open: boolean) => void
  setCloneDialogOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  notebooks: [],
  activeNotebookId: null,
  setNotebooks: (notebooks) => set({ notebooks }),
  setActiveNotebook: (activeNotebookId) => set({ activeNotebookId }),
  updateNotebook: (nb) =>
    set((s) => ({
      notebooks: s.notebooks.map((n) => (n.id === nb.id ? nb : n)),
    })),

  sections: [],
  pages: [],
  activeSectionId: null,
  activePageId: null,
  setSections: (sections) => set({ sections }),
  setPages: (pages) => set({ pages }),
  setActiveSection: (activeSectionId) => set({ activeSectionId }),
  setActivePage: (activePageId) => set({ activePageId }),
  reorderSections: (fromIdx, toIdx) =>
    set((s) => {
      const next = [...s.sections]
      const [moved] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, moved)
      return { sections: next }
    }),

  pageContent: '',
  isDirty: false,
  isEditMode: false,
  setPageContent: (pageContent) => set({ pageContent }),
  setDirty: (isDirty) => set({ isDirty }),
  setEditMode: (isEditMode) => set({ isEditMode }),

  syncStatuses: {},
  setSyncStatus: (notebookId, status) =>
    set((s) => ({ syncStatuses: { ...s.syncStatuses, [notebookId]: status } })),

  searchOpen: false,
  searchQuery: '',
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  historyOpen: false,
  conflictsOpen: false,
  cloneDialogOpen: false,
  setHistoryOpen: (historyOpen) => set({ historyOpen }),
  setConflictsOpen: (conflictsOpen) => set({ conflictsOpen }),
  setCloneDialogOpen: (cloneDialogOpen) => set({ cloneDialogOpen }),
}))
