import { useState, useCallback, useEffect, useRef } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { motion, AnimatePresence } from "motion/react"
import { StatusBar, cn, Button } from "@sqlose/ui"
import { queryClient } from "./lib/query/queryClient"
import { api } from "./lib/api"
import type { QueryResult } from "@sqlose/shared"
import {
   TabBar,
   AppSidebar,
   SQLEditor,
   ResultsPanel,
   CommandPalette,
   SettingsPanel,
   Dashboard,
   TableBrowser,
} from "./components"
import { useEnvironmentStore } from "./stores/environmentStore"
import { useEditorStore } from "./stores/editorStore"
import { useWorkspaceStore } from "./stores/workspaceStore"
import { useSettingsStore } from "./stores/settingsStore"
import { useDatabaseStore } from "./stores/databaseStore"
import { useHistoryStore } from "./stores/historyStore"
import { isMac } from "./lib/types"
import {
   IconX,
   IconChevronRight,
   IconChevronDown,
   IconCopy,
   IconDownload,
   IconTrash,
   IconPlayerPlay,
   IconBomb,
} from "@tabler/icons-react"

async function copyResultsToClipboard(result: QueryResult, withHeaders: boolean) {
   const headers = result.columns.join("\t")
   const rows = result.rows
      .map(r =>
         result.columns
            .map(c => {
               const v = r[c]
               return v === null ? "NULL" : String(v)
            })
            .join("\t")
      )
      .join("\n")
   const text = withHeaders ? `${headers}\n${rows}` : rows
   try {
      await navigator.clipboard.writeText(text)
   } catch {
      const ta = document.createElement("textarea")
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
   }
}

function AppContent() {
   const [sidebarOpen, setSidebarOpen] = useState(true)
   const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
   const [paletteOpen, setPaletteOpen] = useState(false)
   const [settingsOpen, setSettingsOpen] = useState(false)
   const [executingTabId, setExecutingTabId] = useState<string | null>(null)
   const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null)
   const [resultsCollapsed, setResultsCollapsed] = useState(false)
   const [stuckEnvId, setStuckEnvId] = useState<string | null>(null)
   const prevExecutionRef = useRef<number>(0)

   const fetchEnvironments = useEnvironmentStore(s => s.fetchEnvironments)
   const selectedEnvironmentId = useEnvironmentStore(s => s.selectedEnvironmentId)
   const selectEnvironment = useEnvironmentStore(s => s.selectEnvironment)
   const startEnvironment = useEnvironmentStore(s => s.startEnvironment)
   const nukeEnvironment = useEnvironmentStore(s => s.nukeEnvironment)
   const environments = useEnvironmentStore(s => s.environments)

   const queryDraft = useEditorStore(s => s.queryDraft)
   const setQueryDraft = useEditorStore(s => s.setQueryDraft)
   const vimMode = useEditorStore(s => s.vimMode)
   const vimEnabled = useSettingsStore(s => s.vimModeEnabled)

   const tabs = useWorkspaceStore(s => s.tabs)
   const activeTabId = useWorkspaceStore(s => s.activeTabId)
   const activeTab = tabs.find(t => t.id === activeTabId)
   const updateTab = useWorkspaceStore(s => s.updateTab)
   const openTab = useWorkspaceStore(s => s.openTab)
   const closeTab = useWorkspaceStore(s => s.closeTab)
   const setActiveTab = useWorkspaceStore(s => s.setActiveTab)
   const paneSizes = useWorkspaceStore(s => s.paneSizes)
   const updatePaneSizes = useWorkspaceStore(s => s.updatePaneSizes)

   const addHistoryEntry = useHistoryStore(s => s.addEntry)
   const clearActiveTable = useDatabaseStore(s => s.setActiveTable)

   const RESULTS_MIN_HEIGHT = 80
   const RESULTS_MAX_HEIGHT = 800
   const SIDEBAR_MIN_WIDTH = 200
   const SIDEBAR_MAX_WIDTH = 400

   useEffect(() => {
      fetchEnvironments()
   }, [fetchEnvironments])

   useEffect(() => {
      if (activeTab) {
         if (activeTab.tableName) {
            clearActiveTable(activeTab.tableName)
         } else {
            clearActiveTable(null)
            setQueryDraft(activeTab.query)
         }
      }
   }, [activeTabId])

   useEffect(() => {
      if (!selectedEnvironmentId) {
         setStuckEnvId(null)
      } else if (stuckEnvId === null) {
         const env = environments.find(e => e.id === selectedEnvironmentId)
         if (env && env.status === "stopped" && env.containerId) {
            setStuckEnvId(env.id)
         }
      }
   }, [selectedEnvironmentId, environments, stuckEnvId])

   const handleNewQuery = useCallback(() => {
      const result = openTab()
      if (result.isOk()) {
         setQueryDraft("")
      }
   }, [openTab, setQueryDraft])

   const handleCloseTab = useCallback(() => {
      if (activeTabId) {
         closeTab(activeTabId)
      }
   }, [activeTabId, closeTab])

   const handleSwitchTab = useCallback(
      (direction: 1 | -1) => {
         const currentIndex = tabs.findIndex(t => t.id === activeTabId)
         if (currentIndex === -1) return
         const nextIndex = (currentIndex + direction + tabs.length) % tabs.length
         if (nextIndex !== currentIndex) {
            setActiveTab(tabs[nextIndex].id)
         }
      },
      [tabs, activeTabId, setActiveTab]
   )

   const handleExecuteQuery = useCallback(async () => {
      if (!selectedEnvironmentId || !queryDraft.trim() || !activeTabId) return

      const executionId = Date.now()
      prevExecutionRef.current = executionId

      setExecutingTabId(activeTabId)
      setExecutionTimeMs(null)

      updateTab(activeTabId, { isExecuting: true, error: null })

      const startTime = performance.now()
      const result = await api.query.execute(selectedEnvironmentId, queryDraft)
      const elapsed = Math.round(performance.now() - startTime)

      if (prevExecutionRef.current !== executionId) return

      setExecutionTimeMs(elapsed)
      setExecutingTabId(null)

      const selectedEnv = environments.find(e => e.id === selectedEnvironmentId)

      if (result.isOk()) {
         const qr = result.value
         updateTab(activeTabId, {
            isExecuting: false,
            result: qr,
            error: null,
            isDirty: false,
         })
         addHistoryEntry(
            queryDraft,
            selectedEnvironmentId,
            selectedEnv?.dbType ?? "sql",
            elapsed,
            qr.rowCount,
            "success",
            null
         )
      } else {
         updateTab(activeTabId, {
            isExecuting: false,
            result: null,
            error: result.error.message,
         })
         addHistoryEntry(
            queryDraft,
            selectedEnvironmentId,
            selectedEnv?.dbType ?? "sql",
            elapsed,
            0,
            "error",
            result.error.message
         )
      }
   }, [selectedEnvironmentId, queryDraft, activeTabId, updateTab, addHistoryEntry, environments])

   const isExecuting = executingTabId === activeTabId

   const handleQueryChange = useCallback(
      (value: string) => {
         setQueryDraft(value)
         if (activeTabId) {
            updateTab(activeTabId, { query: value, isDirty: true })
         }
      },
      [activeTabId, updateTab, setQueryDraft]
   )

   const handleClearResults = useCallback(() => {
      if (activeTabId) {
         updateTab(activeTabId, { result: null, error: null })
         setExecutionTimeMs(null)
      }
   }, [activeTabId, updateTab])

   const handleCopyResults = useCallback(
      (withHeaders: boolean) => {
         if (activeTab?.result) {
            copyResultsToClipboard(activeTab.result, withHeaders)
         }
      },
      [activeTab]
   )

   const handleOpenTable = useCallback(
      (tableName: string) => {
         const result = openTab(selectedEnvironmentId ?? undefined, { tableName, title: tableName })
         if (result.isOk()) {
            const tab = result.value
            setActiveTab(tab.id)
         }
      },
      [openTab, selectedEnvironmentId, setActiveTab]
   )

   const handleOpenQuery = useCallback(
      (sql: string) => {
         const result = openTab()
         if (result.isOk()) {
            const tab = result.value
            updateTab(tab.id, { query: sql })
            setQueryDraft(sql)
            setActiveTab(tab.id)
         }
      },
      [openTab, updateTab, setQueryDraft, setActiveTab]
   )

   const handleResultsDividerMouseDown = useCallback(
      (e: React.MouseEvent) => {
         e.preventDefault()
         const startY = e.clientY
         const startHeight = paneSizes.resultsHeight

         const handleMouseMove = (moveE: MouseEvent) => {
            const delta = startY - moveE.clientY
            const newHeight = Math.max(
               RESULTS_MIN_HEIGHT,
               Math.min(RESULTS_MAX_HEIGHT, startHeight + delta)
            )
            updatePaneSizes({ resultsHeight: Math.round(newHeight) })
         }

         const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove)
            document.removeEventListener("mouseup", handleMouseUp)
            document.body.style.cursor = ""
            document.body.style.userSelect = ""
         }

         document.addEventListener("mousemove", handleMouseMove)
         document.addEventListener("mouseup", handleMouseUp)
         document.body.style.cursor = "row-resize"
         document.body.style.userSelect = "none"
      },
      [paneSizes.resultsHeight, updatePaneSizes]
   )

   const handleSidebarResizeStart = useCallback(
      (e: React.MouseEvent) => {
         e.preventDefault()
         const startX = e.clientX
         const startWidth = paneSizes.sidebarWidth

         const handleMouseMove = (moveE: MouseEvent) => {
            const delta = moveE.clientX - startX
            const newWidth = Math.max(
               SIDEBAR_MIN_WIDTH,
               Math.min(SIDEBAR_MAX_WIDTH, startWidth + delta)
            )
            updatePaneSizes({ sidebarWidth: Math.round(newWidth) })
         }

         const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove)
            document.removeEventListener("mouseup", handleMouseUp)
            document.body.style.cursor = ""
            document.body.style.userSelect = ""
         }

         document.addEventListener("mousemove", handleMouseMove)
         document.addEventListener("mouseup", handleMouseUp)
         document.body.style.cursor = "col-resize"
         document.body.style.userSelect = "none"
      },
      [paneSizes.sidebarWidth, updatePaneSizes]
   )

   useEffect(() => {
      const isMacPlatform = isMac()

      const handleKeyDown = (e: KeyboardEvent) => {
         const mod = isMacPlatform ? e.metaKey : e.ctrlKey
         if (!mod) return

         if (e.key === "k") {
            e.preventDefault()
            setPaletteOpen(true)
            return
         }

         if (e.key === "Enter") {
            e.preventDefault()
            handleExecuteQuery()
            return
         }

         if (!e.shiftKey && e.key === "n") {
            e.preventDefault()
            handleNewQuery()
            return
         }

         if (e.key === "w") {
            e.preventDefault()
            handleCloseTab()
            return
         }

         if (e.key === "Tab") {
            e.preventDefault()
            handleSwitchTab(e.shiftKey ? -1 : 1)
            return
         }
      }

      document.addEventListener("keydown", handleKeyDown, true)
      return () => document.removeEventListener("keydown", handleKeyDown, true)
   }, [handleExecuteQuery, handleNewQuery, handleCloseTab, handleSwitchTab])

   const handleRestoreEnv = useCallback(async () => {
      if (stuckEnvId) {
         await startEnvironment(stuckEnvId)
         setStuckEnvId(null)
      }
   }, [stuckEnvId, startEnvironment])

   const handleExitAndNuke = useCallback(async () => {
      if (stuckEnvId) {
         await nukeEnvironment(stuckEnvId)
         selectEnvironment(null)
         setStuckEnvId(null)
      }
   }, [stuckEnvId, nukeEnvironment, selectEnvironment])

   const selectedEnv = selectedEnvironmentId
      ? (environments.find(e => e.id === selectedEnvironmentId) ?? null)
      : null

   return (
      <div className="h-screen w-screen overflow-hidden bg-transparent p-2">
         {selectedEnvironmentId ? (
            <div className="flex h-full w-full bg-bg-primary text-text-primary overflow-hidden rounded-xl selection:bg-accent/30 font-sans border border-white/[0.07] shadow-2xl relative">
               <div className="flex-1 min-w-0 flex">
                  {sidebarOpen && (
                     <div
                        style={{ width: sidebarCollapsed ? 56 : paneSizes.sidebarWidth }}
                        className="flex flex-col h-full bg-bg-secondary border-r border-border shadow-[4px_0_24px_rgba(0,0,0,0.2)] z-30 overflow-hidden shrink-0 transition-all duration-150"
                     >
                        <AppSidebar
                           onSettingsOpen={() => setSettingsOpen(true)}
                           onOpenTable={handleOpenTable}
                           onOpenQuery={handleOpenQuery}
                           collapsed={sidebarCollapsed}
                           onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                        />
                     </div>
                  )}
                  {sidebarOpen && !sidebarCollapsed && (
                     <div
                        className="relative w-1.5 cursor-col-resize bg-transparent hover:bg-accent/30 transition-colors shrink-0"
                        onMouseDown={handleSidebarResizeStart}
                     >
                        <div className="absolute inset-y-0 -left-1 -right-1" />
                     </div>
                  )}
                  <div className="flex-1 min-w-0 overflow-hidden">
                     <div className="flex flex-col h-full bg-bg-primary w-full relative">
                        {/* Top bar */}
                        <div className="h-10 flex items-center justify-between px-3 border-b border-border bg-bg-secondary/90 shrink-0 app-drag-region shadow-sm z-20 relative">
                           <div className="flex items-center gap-2 app-no-drag">
                              {!sidebarOpen && (
                                 <button
                                    onClick={() => setSidebarOpen(true)}
                                    className="h-6 w-6 rounded flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-quaternary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                                    aria-label="Open sidebar"
                                 >
                                    <ChevronRightIcon className="h-3.5 w-3.5" />
                                 </button>
                              )}
                              {sidebarOpen && sidebarCollapsed && (
                                 <button
                                    onClick={() => setSidebarCollapsed(false)}
                                    className="h-6 w-6 rounded flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-quaternary transition-colors"
                                    aria-label="Expand sidebar"
                                 >
                                    <ChevronRightIcon className="h-3.5 w-3.5" />
                                 </button>
                              )}
                           </div>

                           {/* Command palette trigger */}
                           <div className="flex-1 max-w-md mx-4 app-no-drag">
                              <button
                                 onClick={() => setPaletteOpen(true)}
                                 className="w-full flex items-center gap-2.5 bg-bg-tertiary hover:bg-bg-quaternary border border-border shadow-inner rounded-md px-3 py-1.5 text-[12px] text-text-muted transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                              >
                                 <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="13"
                                    height="13"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="opacity-60"
                                 >
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.3-4.3" />
                                 </svg>
                                 <span className="opacity-80 font-medium">
                                    Search tables, queries, commands...
                                 </span>
                                 <div className="ml-auto flex items-center gap-1 opacity-50">
                                    {isMac() ? (
                                       <>
                                          <kbd className="bg-bg-primary text-[10px] font-mono px-1.5 py-[2px] rounded border border-border/60 shadow-sm leading-none shrink-0">
                                             ⌘
                                          </kbd>
                                          <kbd className="bg-bg-primary text-[10px] font-mono px-1.5 py-[2px] rounded border border-border/60 shadow-sm leading-none shrink-0">
                                             K
                                          </kbd>
                                       </>
                                    ) : (
                                       <kbd className="bg-bg-primary text-[10px] font-mono px-1.5 py-[2px] rounded border border-border/60 shadow-sm leading-none shrink-0">
                                          Ctrl+K
                                       </kbd>
                                    )}
                                 </div>
                              </button>
                           </div>

                           <div className="flex items-center gap-1 app-no-drag">
                              <button
                                 onClick={() => selectEnvironment(null)}
                                 className="h-7 w-7 rounded flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-quaternary transition-colors"
                                 aria-label="Back to dashboard"
                              >
                                 <IconX className="h-4 w-4" />
                              </button>
                           </div>
                        </div>

                        {/* Tab bar */}
                        <div className="flex items-end h-9 border-b border-border/70 bg-bg-secondary/70 px-1 shrink-0 w-full z-10 relative">
                           <TabBar />
                        </div>

                        {/* Content: TableBrowser | Editor+Results | Empty */}
                        <div className="flex-1 min-h-0 overflow-hidden">
                           <AnimatePresence mode="wait">
                              {activeTab?.tableName ? (
                                 <motion.div
                                    key="table-browser"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.1 }}
                                    className="h-full"
                                 >
                                    <TableBrowser />
                                 </motion.div>
                              ) : activeTabId ? (
                                 <motion.div
                                    key="editor"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.1 }}
                                    className="flex flex-col h-full"
                                 >
                                    {/* Editor */}
                                    <div className="flex-1 flex flex-col min-h-0">
                                       <SQLEditor
                                          value={queryDraft}
                                          onChange={handleQueryChange}
                                          onExecute={handleExecuteQuery}
                                          onSettingsOpen={() => setSettingsOpen(true)}
                                          onCommandMode={() => setPaletteOpen(true)}
                                          isExecuting={isExecuting}
                                          executionTimeMs={executionTimeMs}
                                       />
                                    </div>

                                    {/* Boundary Resize Layer */}
                                    <div
                                       className="h-[3px] -mb-[3px] cursor-row-resize shrink-0 relative z-30 group transition-colors flex items-center justify-center select-none"
                                       onMouseDown={handleResultsDividerMouseDown}
                                    >
                                       <div
                                          className={cn(
                                             "absolute inset-x-0 top-0 h-[1px] w-full transition-colors",
                                             isExecuting
                                                ? "bg-accent/40"
                                                : "bg-transparent group-hover:bg-accent/25"
                                          )}
                                       />
                                       <div
                                          className={cn(
                                             "h-[2px] w-10 rounded-full absolute transition-opacity opacity-0 group-hover:opacity-100",
                                             isExecuting ? "bg-accent" : "bg-accent/50"
                                          )}
                                       />
                                    </div>

                                    {/* Results Panel */}
                                    <div
                                       className={cn(
                                          "flex flex-col shrink-0 bg-bg-primary shadow-[0_-4px_20px_rgba(0,0,0,0.35)] relative z-20 border-t border-border/60",
                                          resultsCollapsed && "overflow-hidden"
                                       )}
                                       style={{
                                          height: resultsCollapsed
                                             ? "34px"
                                             : `${paneSizes.resultsHeight}px`,
                                          minHeight: resultsCollapsed
                                             ? "34px"
                                             : `${RESULTS_MIN_HEIGHT}px`,
                                       }}
                                    >
                                       {/* Results Header */}
                                       <div className="flex items-center justify-between px-3 py-1 bg-bg-tertiary/80 shrink-0 border-b border-border/30">
                                          <div className="flex items-center gap-3">
                                             <button
                                                onClick={() =>
                                                   setResultsCollapsed(!resultsCollapsed)
                                                }
                                                className="flex items-center gap-1.5 rounded text-text-muted hover:text-text-primary transition-colors pr-1"
                                             >
                                                <div className="h-5 w-5 bg-bg-secondary border border-border/40 rounded flex items-center justify-center shadow-sm">
                                                   {resultsCollapsed ? (
                                                      <IconChevronRight className="h-3.5 w-3.5" />
                                                   ) : (
                                                      <IconChevronDown className="h-3.5 w-3.5" />
                                                   )}
                                                </div>
                                                <span className="text-[12px] font-semibold tracking-wide text-text-primary">
                                                   Results
                                                </span>
                                             </button>

                                             {activeTab?.result && (
                                                <div className="flex items-center gap-2 text-[11px] text-text-muted/80 font-sans tracking-wide border-l border-border/60 pl-3">
                                                   <span>
                                                      {activeTab.result.rowCount} row
                                                      {activeTab.result.rowCount !== 1 ? "s" : ""}
                                                   </span>
                                                   {executionTimeMs !== null && (
                                                      <>
                                                         <span className="opacity-40">•</span>
                                                         <span className="font-mono text-[10px]">
                                                            {executionTimeMs}ms
                                                         </span>
                                                      </>
                                                   )}
                                                </div>
                                             )}
                                             {isExecuting && (
                                                <div className="flex items-center gap-1.5 text-accent border-l border-border/60 pl-3">
                                                   <div className="h-3 w-3 rounded-full border-[2px] border-accent/30 border-t-accent animate-spin" />
                                                   <span className="text-[11px] font-medium tracking-wide">
                                                      Executing
                                                   </span>
                                                </div>
                                             )}
                                          </div>
                                          <div className="flex items-center gap-1">
                                             {activeTab?.result && (
                                                <>
                                                   <button
                                                      onClick={() => handleCopyResults(true)}
                                                      className="h-6 px-2 flex items-center gap-1.5 rounded text-[11px] font-medium text-text-muted hover:text-text-primary hover:bg-bg-quaternary transition-colors"
                                                      title="Copy results with headers"
                                                   >
                                                      <IconCopy className="h-3.5 w-3.5 opacity-70" />
                                                      Copy
                                                   </button>
                                                   <button
                                                      className="h-6 px-2 flex items-center gap-1.5 rounded text-[11px] font-medium text-text-muted hover:text-text-primary hover:bg-bg-quaternary transition-colors"
                                                      title="Export results"
                                                   >
                                                      <IconDownload className="h-3.5 w-3.5 opacity-70" />
                                                      Export
                                                   </button>
                                                   <div className="w-[1px] h-3.5 bg-border/80 mx-1" />
                                                   <button
                                                      onClick={handleClearResults}
                                                      className="h-6 w-6 flex items-center justify-center rounded text-text-muted hover:text-error hover:bg-error/10 transition-colors"
                                                      title="Clear results"
                                                   >
                                                      <IconTrash className="h-3.5 w-3.5 opacity-70" />
                                                   </button>
                                                </>
                                             )}
                                          </div>
                                       </div>
                                       {!resultsCollapsed && (
                                          <div className="flex-1 overflow-hidden z-0 relative">
                                             <ResultsPanel
                                                result={activeTab?.result ?? null}
                                                error={activeTab?.error ?? null}
                                                isExecuting={isExecuting}
                                                executionTimeMs={executionTimeMs}
                                                rowCount={activeTab?.result?.rowCount ?? null}
                                             />
                                          </div>
                                       )}
                                    </div>
                                 </motion.div>
                              ) : (
                                 <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.1 }}
                                    className="flex flex-col items-center justify-center h-full bg-bg-primary overflow-hidden"
                                 >
                                    <div className="flex flex-col items-center max-w-sm text-center">
                                       <div className="w-16 h-16 rounded-2xl bg-bg-secondary border border-border shadow-2xl flex items-center justify-center mb-6 opacity-80">
                                          <svg
                                             xmlns="http://www.w3.org/2000/svg"
                                             width="28"
                                             height="28"
                                             viewBox="0 0 24 24"
                                             fill="none"
                                             stroke="currentColor"
                                             strokeWidth="1.5"
                                             strokeLinecap="round"
                                             strokeLinejoin="round"
                                             className="text-text-muted"
                                          >
                                             <path d="m18 16 4-4-4-4" />
                                             <path d="m6 8-4 4 4 4" />
                                             <path d="m14.5 4-5 16" />
                                          </svg>
                                       </div>
                                       <h2 className="text-[15px] font-semibold text-text-primary mb-2 tracking-wide">
                                          Ready to write queries
                                       </h2>
                                       <p className="text-[13px] text-text-muted mb-8 leading-relaxed">
                                          Start interacting with your database by creating a new
                                          query tab or using the command system.
                                       </p>

                                       <div className="flex flex-col gap-2 w-full max-w-[280px]">
                                          <button
                                             onClick={handleNewQuery}
                                             className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg bg-bg-tertiary hover:bg-bg-quaternary border border-border/80 transition-colors group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                                          >
                                             <span className="text-[12px] font-medium text-text-secondary group-hover:text-text-primary">
                                                New Query Workspace
                                             </span>
                                             <div className="flex items-center gap-1 opacity-60">
                                                {isMac() ? (
                                                   <>
                                                      <kbd className="font-mono text-[10px] bg-bg-primary px-1.5 py-0.5 rounded shadow-sm border border-border/40">
                                                         ⌘
                                                      </kbd>
                                                      <kbd className="font-mono text-[10px] bg-bg-primary px-1.5 py-0.5 rounded shadow-sm border border-border/40">
                                                         N
                                                      </kbd>
                                                   </>
                                                ) : (
                                                   <kbd className="font-mono text-[10px] bg-bg-primary px-1.5 py-0.5 rounded shadow-sm border border-border/40">
                                                      Ctrl+N
                                                   </kbd>
                                                )}
                                             </div>
                                          </button>
                                          <button
                                             onClick={() => setPaletteOpen(true)}
                                             className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg bg-bg-tertiary hover:bg-bg-quaternary border border-border/80 transition-colors group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                                          >
                                             <span className="text-[12px] font-medium text-text-secondary group-hover:text-text-primary">
                                                Global Search
                                             </span>
                                             <div className="flex items-center gap-1 opacity-60">
                                                {isMac() ? (
                                                   <>
                                                      <kbd className="font-mono text-[10px] bg-bg-primary px-1.5 py-0.5 rounded shadow-sm border border-border/40">
                                                         ⌘
                                                      </kbd>
                                                      <kbd className="font-mono text-[10px] bg-bg-primary px-1.5 py-0.5 rounded shadow-sm border border-border/40">
                                                         K
                                                      </kbd>
                                                   </>
                                                ) : (
                                                   <kbd className="font-mono text-[10px] bg-bg-primary px-1.5 py-0.5 rounded shadow-sm border border-border/40">
                                                      Ctrl+K
                                                   </kbd>
                                                )}
                                             </div>
                                          </button>
                                       </div>
                                    </div>
                                 </motion.div>
                              )}
                           </AnimatePresence>
                        </div>
                        <StatusBar
                           vimMode={vimEnabled ? vimMode : undefined}
                           dbType={selectedEnv?.dbType}
                        />
                     </div>
                  </div>
               </div>
            </div>
         ) : (
            <Dashboard />
         )}
         <CommandPalette
            isOpen={paletteOpen}
            onClose={() => setPaletteOpen(false)}
            onExecuteQuery={handleExecuteQuery}
            onClearResults={handleClearResults}
            onOpenTable={handleOpenTable}
            onOpenQuery={handleOpenQuery}
         />
         <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

         {stuckEnvId && (
            <div
               className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
               onKeyDown={e => e.preventDefault()}
            >
               <div className="w-full max-w-md rounded-xl border border-border bg-bg-secondary p-8 shadow-2xl">
                  <div className="flex flex-col items-center text-center">
                     <div className="mb-5 h-14 w-14 rounded-full bg-warning/15 border border-warning/25 flex items-center justify-center">
                        <IconBomb className="h-6 w-6 text-warning" />
                     </div>
                     <h2 className="text-lg font-semibold text-text-primary mb-2">
                        Container Halted
                     </h2>
                     <p className="text-sm text-text-muted mb-1">
                        The database container for{" "}
                        <strong className="text-text-primary">
                           {selectedEnv?.name || selectedEnv?.dbType}
                        </strong>{" "}
                        is available but halted.
                     </p>
                     <p className="text-sm text-text-muted mb-6">
                        Would you like to restore it or nuke the environment?
                     </p>
                     <div className="flex gap-3 w-full">
                        <Button
                           variant="destructive"
                           size="default"
                           onClick={handleExitAndNuke}
                           className="flex-1 gap-2"
                        >
                           <IconBomb className="h-4 w-4" />
                           Exit &amp; Nuke
                        </Button>
                        <Button
                           variant="default"
                           size="default"
                           onClick={handleRestoreEnv}
                           className="flex-1 gap-2"
                        >
                           <IconPlayerPlay className="h-4 w-4" />
                           Restore
                        </Button>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   )
}

function ChevronRightIcon({ className }: { className?: string }) {
   return (
      <svg
         xmlns="http://www.w3.org/2000/svg"
         width="14"
         height="14"
         viewBox="0 0 24 24"
         fill="none"
         stroke="currentColor"
         strokeWidth="2"
         strokeLinecap="round"
         strokeLinejoin="round"
         className={className}
      >
         <path d="m9 18 6-6-6-6" />
      </svg>
   )
}

function App() {
   return (
      <QueryClientProvider client={queryClient}>
         <AppContent />
      </QueryClientProvider>
   )
}

export default App
