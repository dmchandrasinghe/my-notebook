import React, { useEffect } from 'react'
import { useAppStore } from './store/appStore'
import NotebookList from './components/NotebookList'
import SectionTabs from './components/SectionTabs'
import PageList from './components/PageList'
import ContentArea from './components/ContentArea'
import SyncStatusBar from './components/SyncStatusBar'
import SearchPanel from './components/SearchPanel'
import HistoryPanel from './components/HistoryPanel'
import ConflictPanel from './components/ConflictPanel'
import CloneDialog from './components/CloneDialog'
import type { Notebook } from '@shared/types'
import './styles/app.css'

declare global {
  interface Window {
    api: import('../../preload/index').AppApi
  }
}

export default function App(): React.ReactElement {
  const {
    setNotebooks,
    updateNotebook,
    searchOpen,
    historyOpen,
    conflictsOpen,
    cloneDialogOpen,
  } = useAppStore()

  // Load notebooks on mount
  useEffect(() => {
    window.api.getNotebooks().then(setNotebooks)
  }, [])

  // Listen for sync status changes from main
  useEffect(() => {
    const unsub = window.api.onSyncStatusChanged((nb: Notebook) => {
      updateNotebook(nb)
    })
    return unsub
  }, [])

  return (
    <div className="app-shell">
      {/* Far-left: vertical notebook tabs */}
      <NotebookList />

      <div className="main-area">
        {/* Top: horizontal section tabs */}
        <SectionTabs />

        <div className="content-row">
          {/* Center: paper content */}
          <ContentArea />

          {/* Right: page list */}
          <PageList />
        </div>

        {/* Bottom: sync status */}
        <SyncStatusBar />
      </div>

      {/* Overlay panels */}
      {searchOpen && <SearchPanel />}
      {historyOpen && <HistoryPanel />}
      {conflictsOpen && <ConflictPanel />}
      {cloneDialogOpen && <CloneDialog />}
    </div>
  )
}
