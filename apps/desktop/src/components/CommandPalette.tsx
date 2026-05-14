import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@sqlose/ui"
import {
   IconSearch, IconDatabase, IconFileCode, IconPlayerPlay, IconDeviceFloppy,
   IconTrash, IconHistory, IconArrowLeftRight, IconEye,
   IconToggleLeft, IconToggleRight, IconBookmark, IconStar,
} from "@tabler/icons-react"
import { useEnvironmentStore } from "../stores/environmentStore"
import { useWorkspaceStore } from "../stores/workspaceStore"
import { useSettingsStore } from "../stores/settingsStore"
import { useSavedQueriesStore } from "../stores/savedQueriesStore"
import { useHistoryStore } from "../stores/historyStore"
import { isMac } from "../lib/types"

interface CommandPaletteProps {
   isOpen: boolean
   onClose: () => void
   onExecuteQuery?: () => void
   onClearResults?: () => void
   onOpenTable?: (tableName: string) => void
   onOpenQuery?: (sql: string) => void
}

interface PaletteAction {
   id: string
   label: string
   description: string
   icon: React.ReactNode
   shortcut?: string
   category: "action" | "database" | "tab" | "saved" | "history"
   onSelect: () => void
}

export function CommandPalette({ isOpen, onClose, onExecuteQuery, onClearResults, onOpenQuery }: CommandPaletteProps) {
   const [query, setQuery] = useState("")
   const [selectedIndex, setSelectedIndex] = useState(0)
   const inputRef = useRef<HTMLInputElement>(null)

   const environments = useEnvironmentStore((s) => s.environments)
   const selectEnvironment = useEnvironmentStore((s) => s.selectEnvironment)
   const openTab = useWorkspaceStore((s) => s.openTab)
   const tabs = useWorkspaceStore((s) => s.tabs)
   const activeTabId = useWorkspaceStore((s) => s.activeTabId)
   const activeTab = tabs.find(t => t.id === activeTabId)
   const setActiveTab = useWorkspaceStore((s) => s.setActiveTab)
   const vimModeEnabled = useSettingsStore((s) => s.vimModeEnabled)
   const setVimModeEnabled = useSettingsStore((s) => s.setVimModeEnabled)
   const savedQueries = useSavedQueriesStore((s) => s.queries)
   const historyEntries = useHistoryStore((s) => s.entries)

   const handleSelectEnvironment = useCallback(
      (envId: string) => {
         selectEnvironment(envId)
         openTab(envId)
      },
      [selectEnvironment, openTab],
   )

   const actions = useMemo<PaletteAction[]>(() => [
      {
         id: "new-query",
         label: "New Query",
         description: "Open a new query tab",
         icon: <IconFileCode className="h-4 w-4" />,
          shortcut: isMac() ? "⌘N" : "Ctrl+N",
         category: "action",
         onSelect: () => openTab(),
      },
      {
         id: "run-query",
         label: "Run Query",
         description: "Execute the current query",
         icon: <IconPlayerPlay className="h-4 w-4" />,
          shortcut: isMac() ? "⌘⏎" : "Ctrl+↵",
         category: "action",
         onSelect: () => onExecuteQuery?.(),
      },
      {
         id: "save-query",
         label: "Save Query",
         description: "Save the current query",
         icon: <IconDeviceFloppy className="h-4 w-4" />,
          shortcut: isMac() ? "⌘S" : "Ctrl+S",
         category: "action",
         onSelect: () => { /* save handled in editor */ },
      },
      {
         id: "clear-results",
         label: "Clear Results",
         description: "Clear the current query results",
         icon: <IconTrash className="h-4 w-4" />,
         category: "action",
         onSelect: () => onClearResults?.(),
      },
      {
         id: "open-saved",
         label: "Saved Queries",
         description: "Browse saved queries",
         icon: <IconBookmark className="h-4 w-4" />,
         category: "action",
         onSelect: () => { /* opens in sidebar */ },
      },
      {
         id: "open-history",
         label: "Query History",
         description: "Browse past query executions",
         icon: <IconHistory className="h-4 w-4" />,
         category: "action",
         onSelect: () => { /* opens in sidebar */ },
      },
       {
          id: "switch-db",
          label: "Switch Database",
          description: "Change active database connection",
          icon: <IconArrowLeftRight className="h-4 w-4" />,
          category: "action",
          onSelect: () => {
             const envs = environments
             if (envs.length > 0) {
                const currentIdx = envs.findIndex(e => e.id === activeTab?.environmentId)
                const nextIdx = (currentIdx + 1) % envs.length
                handleSelectEnvironment(envs[nextIdx].id)
             }
          },
       },
       {
          id: "toggle-vim",
          label: vimModeEnabled ? "Disable Vim Mode" : "Enable Vim Mode",
          description: vimModeEnabled ? "Turn off Vim keybindings in the editor" : "Turn on Vim keybindings in the editor",
          icon: vimModeEnabled ? <IconToggleRight className="h-4 w-4" /> : <IconToggleLeft className="h-4 w-4" />,
          category: "action",
          onSelect: () => setVimModeEnabled(!vimModeEnabled),
       },
       ...environments.map((env) => ({
         id: `env-${env.id}`,
         label: env.name || `${env.dbType} environment`,
         description: `${env.dbType} · ${env.status}`,
         icon: <IconDatabase className="h-4 w-4" />,
         shortcut: undefined as string | undefined,
         category: "database" as const,
         onSelect: () => handleSelectEnvironment(env.id),
      })),
      ...tabs.filter(t => t.id !== activeTabId).map((tab) => ({
         id: `tab-${tab.id}`,
         label: tab.title || "Untitled Query",
         description: `Switch to tab${tab.isDirty ? " · unsaved" : ""}`,
         icon: <IconEye className="h-4 w-4" />,
         shortcut: undefined as string | undefined,
         category: "tab" as const,
         onSelect: () => setActiveTab(tab.id),
      })),
      ...savedQueries.map((q) => ({
         id: `sq-${q.id}`,
         label: q.name,
         description: q.sql.slice(0, 60),
         icon: <IconStar className="h-4 w-4 text-warning" />,
         shortcut: undefined as string | undefined,
         category: "saved" as const,
         onSelect: () => onOpenQuery?.(q.sql),
      })),
      ...historyEntries.slice(0, 10).map((entry) => ({
         id: `hist-${entry.id}`,
         label: entry.sql.slice(0, 40) + (entry.sql.length > 40 ? "..." : ""),
         description: `${entry.dbType} · ${entry.duration}ms · ${entry.status}`,
         icon: <IconHistory className="h-4 w-4" />,
         shortcut: undefined as string | undefined,
         category: "history" as const,
         onSelect: () => onOpenQuery?.(entry.sql),
      })),
    ], [environments, tabs, activeTabId, openTab, onExecuteQuery, onClearResults, handleSelectEnvironment, setActiveTab, vimModeEnabled, setVimModeEnabled, savedQueries, historyEntries, onOpenQuery])

   const groupedItems = useMemo(() => {
      if (!query) {
         return {
            actions: actions.filter(a => a.category === "action"),
            databases: actions.filter(a => a.category === "database"),
            tabs: actions.filter(a => a.category === "tab"),
            saved: actions.filter(a => a.category === "saved"),
            history: actions.filter(a => a.category === "history"),
         }
      }
      const q = query.toLowerCase()

      const score = (item: PaletteAction): number => {
         const label = item.label.toLowerCase()
         const desc = item.description.toLowerCase()
         if (label === q) return 100
         if (label.startsWith(q)) return 90
         if (label.includes(q)) return 70
         if (desc.includes(q)) return 40

         const words = q.split(/\s+/)
         const allWordsMatch = words.every(w => label.includes(w) || desc.includes(w))
         if (allWordsMatch && words.length > 1) return 50
         if (words.some(w => label.includes(w))) return 30

         return 0
      }

      const scored = actions.map(a => ({ ...a, score: score(a) })).filter(a => a.score > 0)
      scored.sort((a, b) => b.score - a.score)

      return {
         actions: scored.filter(a => a.category === "action"),
         databases: scored.filter(a => a.category === "database"),
         tabs: scored.filter(a => a.category === "tab"),
         saved: scored.filter(a => a.category === "saved"),
         history: scored.filter(a => a.category === "history"),
      }
   }, [actions, query])

   const flatFiltered = useMemo(() => {
      return [...groupedItems.actions, ...groupedItems.databases, ...groupedItems.tabs, ...groupedItems.saved, ...groupedItems.history]
   }, [groupedItems])

   useEffect(() => {
      if (isOpen) {
         setQuery("")
         setSelectedIndex(0)
         setTimeout(() => inputRef.current?.focus(), 50)
      }
   }, [isOpen])

   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         if (!isOpen) return
         if (e.key === "Escape") { e.preventDefault(); onClose(); return }
         if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(p => Math.min(p + 1, flatFiltered.length - 1)); return }
         if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex(p => Math.max(p - 1, 0)); return }
         if (e.key === "Enter" && flatFiltered[selectedIndex]) {
            e.preventDefault()
            flatFiltered[selectedIndex].onSelect()
            onClose()
         }
      }
      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
   }, [isOpen, onClose, selectedIndex, flatFiltered])

   return (
      <AnimatePresence>
         {isOpen && (
            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               transition={{ duration: 0.1 }}
               className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-black/40 backdrop-blur-[2px]"
               onClick={onClose}
            >
               <motion.div
                  initial={{ opacity: 0, scale: 0.97, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: -10 }}
                  transition={{ duration: 0.1 }}
                  className="w-full max-w-xl bg-bg-primary/95 backdrop-blur-xl rounded-lg border border-border shadow-2xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
               >
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
                     <IconSearch className="h-4 w-4 text-text-muted shrink-0" />
                     <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
                        placeholder="Search tables, queries, commands..."
                        className="flex-1 bg-transparent text-[14px] font-medium text-text-primary outline-none placeholder:text-text-muted/60"
                     />
                     <kbd className="text-[10px] text-text-muted font-mono border border-border/50 bg-bg-secondary rounded px-1.5 py-0.5">ESC</kbd>
                  </div>
                  <div className="max-h-[55vh] overflow-y-auto py-1 custom-scrollbar">
                     {flatFiltered.length === 0 && (
                        <div className="px-4 py-10 text-center flex flex-col items-center">
                           <IconSearch className="h-7 w-7 text-text-muted/40 mb-2" />
                           <span className="text-sm text-text-muted">No results for &ldquo;{query}&rdquo;</span>
                        </div>
                     )}

                     {groupedItems.actions.length > 0 && (
                        <>
                           <div className="px-4 py-1.5 text-[10px] font-semibold tracking-wider text-text-muted uppercase">Actions</div>
                              {groupedItems.actions.map((item) => {
                              const globalIndex = flatFiltered.indexOf(item)
                              return (
                                 <button
                                    key={item.id}
                                    onClick={() => { item.onSelect(); onClose() }}
                                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                                    className={cn(
                                       "flex w-full items-center gap-3 px-4 py-2 text-left transition-all outline-none",
                                       globalIndex === selectedIndex ? "bg-bg-quaternary/60 text-text-primary" : "text-text-secondary",
                                    )}
                                 >
                                    <div className={cn(
                                       "flex items-center justify-center h-7 w-7 rounded shrink-0",
                                       globalIndex === selectedIndex ? "bg-bg-primary text-accent" : "bg-bg-quaternary text-text-muted",
                                    )}>
                                       {item.icon}
                                    </div>
                                    <div className="flex-1 min-w-0 flex items-center justify-between">
                                       <div className="flex flex-col">
                                          <span className={cn("text-[13px] font-medium truncate", globalIndex === selectedIndex && "text-text-primary")}>{item.label}</span>
                                          <span className="text-[11px] text-text-muted truncate">{item.description}</span>
                                       </div>
                                       {item.shortcut && (
                                          <kbd className="text-[10px] font-mono text-text-muted ml-3 border border-border/40 bg-bg-quaternary px-1.5 py-0.5 rounded shrink-0">
                                             {item.shortcut}
                                          </kbd>
                                       )}
                                    </div>
                                 </button>
                              )
                           })}
                        </>
                     )}

                     {groupedItems.saved.length > 0 && (
                        <>
                           <div className="px-4 py-1.5 text-[10px] font-semibold tracking-wider text-text-muted uppercase border-t border-border/20 mt-1">Saved Queries</div>
                           {groupedItems.saved.map((item) => {
                              const globalIndex = flatFiltered.indexOf(item)
                              return (
                                 <button
                                    key={item.id}
                                    onClick={() => { item.onSelect(); onClose() }}
                                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                                    className={cn(
                                       "flex w-full items-center gap-3 px-4 py-2 text-left transition-all outline-none",
                                       globalIndex === selectedIndex ? "bg-bg-quaternary/60 text-text-primary" : "text-text-secondary",
                                    )}
                                 >
                                    <div className={cn(
                                       "flex items-center justify-center h-7 w-7 rounded shrink-0",
                                       globalIndex === selectedIndex ? "bg-bg-primary text-accent" : "bg-bg-quaternary text-text-muted",
                                    )}>
                                       {item.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <span className={cn("text-[13px] font-medium truncate block", globalIndex === selectedIndex && "text-text-primary")}>{item.label}</span>
                                       <span className="text-[11px] text-text-muted truncate block">{item.description}</span>
                                    </div>
                                 </button>
                              )
                           })}
                        </>
                     )}

                     {groupedItems.history.length > 0 && (
                        <>
                           <div className="px-4 py-1.5 text-[10px] font-semibold tracking-wider text-text-muted uppercase border-t border-border/20 mt-1">History</div>
                           {groupedItems.history.map((item) => {
                              const globalIndex = flatFiltered.indexOf(item)
                              return (
                                 <button
                                    key={item.id}
                                    onClick={() => { item.onSelect(); onClose() }}
                                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                                    className={cn(
                                       "flex w-full items-center gap-3 px-4 py-2 text-left transition-all outline-none",
                                       globalIndex === selectedIndex ? "bg-bg-quaternary/60 text-text-primary" : "text-text-secondary",
                                    )}
                                 >
                                    <div className={cn(
                                       "flex items-center justify-center h-7 w-7 rounded shrink-0",
                                       globalIndex === selectedIndex ? "bg-bg-primary text-accent" : "bg-bg-quaternary text-text-muted",
                                    )}>
                                       {item.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <span className={cn("text-[13px] font-medium truncate block font-mono text-[12px]", globalIndex === selectedIndex && "text-text-primary")}>{item.label}</span>
                                       <span className="text-[11px] text-text-muted truncate block">{item.description}</span>
                                    </div>
                                 </button>
                              )
                           })}
                        </>
                     )}

                     {groupedItems.databases.length > 0 && (
                        <>
                           <div className="px-4 py-1.5 text-[10px] font-semibold tracking-wider text-text-muted uppercase border-t border-border/20 mt-1">Databases</div>
                           {groupedItems.databases.map((item) => {
                              const globalIndex = flatFiltered.indexOf(item)
                              return (
                                 <button
                                    key={item.id}
                                    onClick={() => { item.onSelect(); onClose() }}
                                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                                    className={cn(
                                       "flex w-full items-center gap-3 px-4 py-2 text-left transition-all outline-none",
                                       globalIndex === selectedIndex ? "bg-bg-quaternary/60 text-text-primary" : "text-text-secondary",
                                    )}
                                 >
                                    <div className={cn(
                                       "flex items-center justify-center h-7 w-7 rounded shrink-0",
                                       globalIndex === selectedIndex ? "bg-bg-primary text-accent" : "bg-bg-quaternary text-text-muted",
                                    )}>
                                       {item.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <span className={cn("text-[13px] font-medium truncate block", globalIndex === selectedIndex && "text-text-primary")}>{item.label}</span>
                                       <span className="text-[11px] text-text-muted truncate block">{item.description}</span>
                                    </div>
                                 </button>
                              )
                           })}
                        </>
                     )}

                     {groupedItems.tabs.length > 0 && (
                        <>
                           <div className="px-4 py-1.5 text-[10px] font-semibold tracking-wider text-text-muted uppercase border-t border-border/20 mt-1">Open Tabs</div>
                           {groupedItems.tabs.map((item) => {
                              const globalIndex = flatFiltered.indexOf(item)
                              return (
                                 <button
                                    key={item.id}
                                    onClick={() => { item.onSelect(); onClose() }}
                                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                                    className={cn(
                                       "flex w-full items-center gap-3 px-4 py-2 text-left transition-all outline-none",
                                       globalIndex === selectedIndex ? "bg-bg-quaternary/60 text-text-primary" : "text-text-secondary",
                                    )}
                                 >
                                    <div className={cn(
                                       "flex items-center justify-center h-7 w-7 rounded shrink-0",
                                       globalIndex === selectedIndex ? "bg-bg-primary text-accent" : "bg-bg-quaternary text-text-muted",
                                    )}>
                                       {item.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <span className={cn("text-[13px] font-medium truncate block", globalIndex === selectedIndex && "text-text-primary")}>{item.label}</span>
                                       <span className="text-[11px] text-text-muted truncate block">{item.description}</span>
                                    </div>
                                 </button>
                              )
                           })}
                        </>
                     )}
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
   )
}
