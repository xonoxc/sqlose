import { useState, useCallback, useEffect, useRef } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { ResizablePane } from "@sqlose/ui"
import { queryClient } from "./lib/query/queryClient"
import { api } from "./lib/api"
import {
   TabBar,
   AppSidebar,
   SQLEditor,
   ResultsPanel,
   CommandPalette,
   SettingsPanel,
} from "./components"
import { useEnvironmentStore } from "./stores/environmentStore"
import { useEditorStore } from "./stores/editorStore"
import { useWorkspaceStore } from "./stores/workspaceStore"

function AppContent() {
   const [sidebarOpen, setSidebarOpen] = useState(true)
   const [paletteOpen, setPaletteOpen] = useState(false)
   const [settingsOpen, setSettingsOpen] = useState(false)
   const [executingTabId, setExecutingTabId] = useState<string | null>(null)
   const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null)
   const prevExecutionRef = useRef<number>(0)

   const fetchEnvironments = useEnvironmentStore(s => s.fetchEnvironments)
   const selectedEnvironmentId = useEnvironmentStore(s => s.selectedEnvironmentId)

   const queryDraft = useEditorStore(s => s.queryDraft)

   const tabs = useWorkspaceStore(s => s.tabs)
   const activeTabId = useWorkspaceStore(s => s.activeTabId)
   const activeTab = tabs.find(t => t.id === activeTabId)
   const updateTab = useWorkspaceStore(s => s.updateTab)
   const paneSizes = useWorkspaceStore(s => s.paneSizes)
   const updatePaneSizes = useWorkspaceStore(s => s.updatePaneSizes)

   useEffect(() => {
      fetchEnvironments()
   }, [fetchEnvironments])

   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         if ((e.metaKey || e.ctrlKey) && e.key === "k") {
            e.preventDefault()
            setPaletteOpen(true)
         }
      }

      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
   }, [])

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

      if (result.isOk()) {
         const qr = result.value
         updateTab(activeTabId, {
            isExecuting: false,
            result: qr,
            error: null,
            isDirty: false,
         })
      } else {
         const errMsg = result.error.message
         updateTab(activeTabId, {
            isExecuting: false,
            result: null,
            error: errMsg,
         })
      }
   }, [selectedEnvironmentId, queryDraft, activeTabId, updateTab])

   const isExecuting = executingTabId === activeTabId

   return (
      <div className="h-screen w-screen overflow-hidden bg-transparent p-2">
         <div className="flex h-full w-full bg-[#0c0c0c] text-text-primary overflow-hidden rounded-xl selection:bg-accent/30 font-sans border border-white/10 shadow-2xl relative">
            <ResizablePane className="flex-1 min-w-0"
            left={
               sidebarOpen ? (
                  <div className="flex flex-col h-full bg-[#111111] border-r border-[#1e1e1e]">
                     <AppSidebar onSettingsOpen={() => setSettingsOpen(true)} onClose={() => setSidebarOpen(false)} />
                  </div>
               ) : undefined
            }
            right={
               <div className="flex flex-col h-full bg-[#0c0c0c] w-full relative">
                  {/* Global Top Header */}
                  <div className="h-14 flex items-center justify-between px-6 border-b border-[#1e1e1e] shrink-0 app-drag-region">
                     <div className="flex items-center gap-3 app-no-drag">
                        {!sidebarOpen && (
                           <button onClick={() => setSidebarOpen(true)} className="h-7 w-7 rounded-md flex items-center justify-center bg-[#161616] border border-[#222] text-text-muted hover:text-text-primary hover:bg-[#1e1e1e] transition-colors" aria-label="Open sidebar">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                           </button>
                        )}
                        <span className="text-[11px] font-semibold tracking-wider text-text-secondary uppercase border border-[#222] bg-[#161616] px-2.5 py-1 rounded-md">
                           SQL
                        </span>
                     </div>

                     <div className="flex-1 max-w-md mx-6 app-no-drag">
                        <button
                           onClick={() => setPaletteOpen(true)}
                           className="w-full flex items-center gap-3 bg-[#111111] hover:bg-[#161616] border border-[#222] rounded-full px-4 py-1.5 text-[13px] text-text-muted transition-all duration-200 shadow-sm"
                        >
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
                              className="opacity-70"
                           >
                              <circle cx="11" cy="11" r="8" />
                              <path d="m21 21-4.3-4.3" />
                           </svg>
                           <span className="font-medium opacity-80">Search or run commands...</span>
                           <div className="ml-auto flex items-center gap-1.5 opacity-60">
                              <kbd className="bg-[#1c1c1c] text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#333]">
                                 ⌘
                              </kbd>
                              <kbd className="bg-[#1c1c1c] text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#333]">
                                 K
                              </kbd>
                           </div>
                        </button>
                     </div>

                     <div className="flex items-center gap-4 app-no-drag">
                        <span className="text-[12px] text-text-muted font-medium bg-[#111111] px-3 py-1 rounded-full border border-[#222]">
                           Changes <span className="opacity-50 ml-1">0</span>
                        </span>
                        <div className="flex items-center gap-3 text-text-muted">
                           <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                           >
                              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                              <path d="M3 3v5h5" />
                              <path d="M12 7v5l4 2" />
                           </svg>
                        </div>
                     </div>
                  </div>

                  {/* Main Workspace Area */}
                  <div className="flex-1 flex flex-col min-h-0">
                     {/* Tab Bar Container */}
                     <div className="flex items-end h-[44px] border-b border-[#1e1e1e] bg-[#0c0c0c] px-2 pt-2 app-no-drag shrink-0 relative w-full">
                        <TabBar />
                     </div>

                     <div className="flex-1 flex flex-col h-full bg-[#0c0c0c]">
                        <div className="flex-1 flex flex-col min-h-0">
                           <SQLEditor
                              onExecute={handleExecuteQuery}
                              onSettingsOpen={() => setSettingsOpen(true)}
                              isExecuting={isExecuting}
                              executionTimeMs={executionTimeMs}
                           />
                        </div>

                        {/* Interactive Drag Handle / Divider */}
                        <div className="h-1 bg-[#1e1e1e] hover:bg-accent/40 cursor-row-resize transition-colors w-full shrink-0 relative z-10"></div>

                        <div
                           className="flex flex-col shrink-0 bg-[#0c0c0c]"
                           style={{ height: `${paneSizes.resultsHeight}px`, minHeight: "100px" }}
                        >
                           {/* Results Header */}
                           <div className="flex items-center justify-between px-6 py-3 border-b border-[#1e1e1e] shrink-0 bg-[#0c0c0c]">
                              <div className="flex items-center gap-4 text-text-muted">
                                 <button className="hover:text-text-primary transition-colors">
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
                                    >
                                       <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                       <line x1="9" x2="15" y1="9" y2="9" />
                                       <line x1="9" x2="15" y1="15" y2="15" />
                                    </svg>
                                 </button>
                                 <button className="hover:text-text-primary transition-colors">
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
                                    >
                                       <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                       <polyline points="7 10 12 15 17 10" />
                                       <line x1="12" x2="12" y1="15" y2="3" />
                                    </svg>
                                 </button>
                              </div>
                              <span className="text-[12px] text-text-muted font-mono">
                                 {activeTab?.result?.rowCount ?? 0} rows
                              </span>
                           </div>
                           <div className="flex-1 overflow-hidden z-0 relative">
                              <ResultsPanel
                                 result={activeTab?.result ?? null}
                                 error={activeTab?.error ?? null}
                                 isExecuting={isExecuting}
                              />
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            }
            defaultLeftWidth={paneSizes.sidebarWidth}
            minLeftWidth={200}
            maxLeftWidth={400}
            onResize={w => updatePaneSizes({ sidebarWidth: w })}
         />
         </div>
         <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
         <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
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
