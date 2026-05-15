import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { useEnvironmentStore } from "../stores/environmentStore"
import { useWorkspaceStore } from "../stores/workspaceStore"
import { useSettingsStore } from "../stores/settingsStore"
import { useSavedQueriesStore } from "../stores/savedQueriesStore"
import { useHistoryStore } from "../stores/historyStore"
import { isMac } from "../lib/types"
import {
   IconDatabase,
   IconFileCode,
   IconPlayerPlay,
   IconDeviceFloppy,
   IconTrash,
   IconHistory,
   IconArrowLeftRight,
   IconEye,
   IconToggleLeft,
   IconToggleRight,
   IconBookmark,
   IconStar,
} from "@tabler/icons-react"

interface PaletteAction {
   id: string
   label: string
   description: string
   icon: React.ReactNode
   shortcut?: string
   category: "action" | "database" | "tab" | "saved" | "history"
   onSelect: () => void
}

export function useCommandPaletteLogic(
   isOpen: boolean,
   onClose: () => void,
   onExecuteQuery?: () => void,
   onClearResults?: () => void,
   onOpenQuery?: (sql: string) => void
) {
   const [query, setQuery] = useState("")
   const [selectedIndex, setSelectedIndex] = useState(0)
   const inputRef = useRef<HTMLInputElement>(null)

   const environments = useEnvironmentStore(s => s.environments)
   const selectEnvironment = useEnvironmentStore(s => s.selectEnvironment)
   const nukeEnvironment = useEnvironmentStore(s => s.nukeEnvironment)
   const openTab = useWorkspaceStore(s => s.openTab)
   const tabs = useWorkspaceStore(s => s.tabs)
   const activeTabId = useWorkspaceStore(s => s.activeTabId)
   const activeTab = tabs.find(t => t.id === activeTabId)
   const setActiveTab = useWorkspaceStore(s => s.setActiveTab)
   const vimModeEnabled = useSettingsStore(s => s.vimModeEnabled)
   const setVimModeEnabled = useSettingsStore(s => s.setVimModeEnabled)
   const savedQueries = useSavedQueriesStore(s => s.queries)
   const historyEntries = useHistoryStore(s => s.entries)

   const handleSelectEnvironment = useCallback(
      (envId: string) => {
         selectEnvironment(envId)
         openTab(envId)
      },
      [selectEnvironment, openTab]
   )

   const actions = useMemo<PaletteAction[]>(
      () => [
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
            onSelect: () => {},
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
            onSelect: () => {},
         },
         {
            id: "open-history",
            label: "Query History",
            description: "Browse past query executions",
            icon: <IconHistory className="h-4 w-4" />,
            category: "action",
            onSelect: () => {},
         },
         {
            id: "switch-db",
            label: "Switch Database",
            description: "Change active database connection",
            icon: <IconArrowLeftRight className="h-4 w-4" />,
            category: "action",
            onSelect: () => {
               if (environments.length > 0) {
                  const currentIdx = environments.findIndex(e => e.id === activeTab?.environmentId)
                  const nextIdx = (currentIdx + 1) % environments.length
                  handleSelectEnvironment(environments[nextIdx].id)
               }
            },
         },
         {
            id: "toggle-vim",
            label: vimModeEnabled ? "Disable Vim Mode" : "Enable Vim Mode",
            description: vimModeEnabled
               ? "Turn off Vim keybindings in the editor"
               : "Turn on Vim keybindings in the editor",
            icon: vimModeEnabled ? (
               <IconToggleRight className="h-4 w-4" />
            ) : (
               <IconToggleLeft className="h-4 w-4" />
            ),
            category: "action",
            onSelect: () => setVimModeEnabled(!vimModeEnabled),
         },
         {
            id: "nuke-env",
            label: "Nuke Environment",
            description:
               "Delete the active environment's container and data, but keep the environment for a fresh start",
            icon: <IconTrash className="h-4 w-4" />,
            category: "action",
            onSelect: () => {
               if (activeTab?.environmentId) {
                  nukeEnvironment(activeTab.environmentId)
               }
            },
         },
         ...environments.map(env => ({
            id: `env-${env.id}` as const,
            label: env.name || `${env.dbType} environment`,
            description: `${env.dbType} · ${env.status}`,
            icon: <IconDatabase className="h-4 w-4" />,
            shortcut: undefined as string | undefined,
            category: "database" as const,
            onSelect: () => handleSelectEnvironment(env.id),
         })),
         ...tabs
            .filter(t => t.id !== activeTabId)
            .map(tab => ({
               id: `tab-${tab.id}` as const,
               label: tab.title || "Untitled Query",
               description: `Switch to tab${tab.isDirty ? " · unsaved" : ""}`,
               icon: <IconEye className="h-4 w-4" />,
               shortcut: undefined as string | undefined,
               category: "tab" as const,
               onSelect: () => setActiveTab(tab.id),
            })),
         ...savedQueries.map(q => ({
            id: `sq-${q.id}` as const,
            label: q.name,
            description: q.sql.slice(0, 60),
            icon: <IconStar className="h-4 w-4 text-warning" />,
            shortcut: undefined as string | undefined,
            category: "saved" as const,
            onSelect: () => onOpenQuery?.(q.sql),
         })),
         ...historyEntries.slice(0, 10).map(entry => ({
            id: `hist-${entry.id}` as const,
            label: entry.sql.slice(0, 40) + (entry.sql.length > 40 ? "..." : ""),
            description: `${entry.dbType} · ${entry.duration}ms · ${entry.status}`,
            icon: <IconHistory className="h-4 w-4" />,
            shortcut: undefined as string | undefined,
            category: "history" as const,
            onSelect: () => onOpenQuery?.(entry.sql),
         })),
      ],
      [
         environments,
         tabs,
         activeTabId,
         activeTab,
         openTab,
         onExecuteQuery,
         onClearResults,
         handleSelectEnvironment,
         setActiveTab,
         vimModeEnabled,
         setVimModeEnabled,
         savedQueries,
         historyEntries,
         onOpenQuery,
         nukeEnvironment,
      ]
   )

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
      return [
         ...groupedItems.actions,
         ...groupedItems.databases,
         ...groupedItems.tabs,
         ...groupedItems.saved,
         ...groupedItems.history,
      ]
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
         if (e.key === "Escape") {
            e.preventDefault()
            onClose()
            return
         }
         if (e.key === "ArrowDown") {
            e.preventDefault()
            setSelectedIndex(p => Math.min(p + 1, flatFiltered.length - 1))
            return
         }
         if (e.key === "ArrowUp") {
            e.preventDefault()
            setSelectedIndex(p => Math.max(p - 1, 0))
            return
         }
         if (e.key === "Enter" && flatFiltered[selectedIndex]) {
            e.preventDefault()
            flatFiltered[selectedIndex].onSelect()
            onClose()
         }
      }
      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
   }, [isOpen, onClose, selectedIndex, flatFiltered])

   return {
      query,
      setQuery,
      selectedIndex,
      setSelectedIndex,
      inputRef,
      groupedItems,
      flatFiltered,
      activeTabId,
   }
}
