import { useRef, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@sqlose/ui"
import { IconX, IconPlus, IconLoader2, IconTable } from "@tabler/icons-react"
import type { Tab } from "../lib/types"
import { useWorkspaceStore } from "../stores/workspaceStore"

export function TabBar() {
   const tabs = useWorkspaceStore((s) => s.tabs)
   const activeTabId = useWorkspaceStore((s) => s.activeTabId)
   const openTab = useWorkspaceStore((s) => s.openTab)
   const closeTab = useWorkspaceStore((s) => s.closeTab)
   const setActiveTab = useWorkspaceStore((s) => s.setActiveTab)
   const moveTab = useWorkspaceStore((s) => s.moveTab)
   const dragItem = useRef<number | null>(null)
   const dragOverItem = useRef<number | null>(null)

   const handleDragStart = useCallback((index: number) => {
      dragItem.current = index
   }, [])

   const handleDragOver = useCallback((index: number) => {
      dragOverItem.current = index
   }, [])

   const handleDragEnd = useCallback(() => {
      if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
         moveTab(dragItem.current, dragOverItem.current)
      }
      dragItem.current = null
      dragOverItem.current = null
   }, [moveTab])

   return (
      <div className="flex h-full w-full items-end bg-transparent overflow-hidden">
         <div className="flex-1 flex items-end overflow-x-auto scrollbar-none h-full">
            <AnimatePresence mode="popLayout">
               {tabs.map((tab, index) => (
                  <TabItem
                     key={tab.id}
                     tab={tab}
                     isActive={tab.id === activeTabId}
                     onSelect={() => setActiveTab(tab.id)}
                     onClose={(e) => { e.stopPropagation(); closeTab(tab.id) }}
                     onDragStart={() => handleDragStart(index)}
                     onDragOver={() => handleDragOver(index)}
                     onDragEnd={handleDragEnd}
                  />
               ))}
            </AnimatePresence>
         </div>
         <button
            onClick={() => openTab()}
            className="flex items-center justify-center h-6 w-6 mx-1 mb-[3px] rounded hover:bg-bg-quaternary/80 text-text-muted hover:text-text-primary transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            aria-label="New tab"
         >
            <IconPlus className="h-3.5 w-3.5" />
         </button>
      </div>
   )
}

function TabItem({
   tab, isActive, onSelect, onClose, onDragStart, onDragOver, onDragEnd,
}: {
   tab: Tab
   isActive: boolean
   onSelect: () => void
   onClose: (e: React.MouseEvent) => void
   onDragStart: () => void
   onDragOver: () => void
   onDragEnd: () => void
}) {
   return (
      <motion.div
         layout
         initial={{ opacity: 0, x: -6 }}
         animate={{ opacity: 1, x: 0 }}
         exit={{ opacity: 0, x: 6 }}
         transition={{ duration: 0.1 }}
         draggable
         onDragStart={onDragStart}
         onDragOver={onDragOver}
         onDragEnd={onDragEnd}
         onClick={onSelect}
         className={cn(
            "group relative flex items-center gap-2 h-7 px-3 py-0 text-[12px] font-medium cursor-pointer select-none shrink-0 rounded-t-sm mx-[1px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
            isActive
               ? "bg-bg-primary text-text-primary border-t border-x border-border/70"
               : "text-text-muted hover:text-text-secondary hover:bg-bg-primary/40",
         )}
      >
         {tab.isExecuting && <IconLoader2 className="h-3 w-3 animate-spin text-accent shrink-0" />}
         {!tab.isExecuting && tab.isDirty && <span className="h-1.5 w-1.5 rounded-full bg-accent/70 shrink-0" />}
          {tab.tableName ? (
             <IconTable className="h-3 w-3 opacity-60 shrink-0" />
          ) : (
             <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 shrink-0"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          )}
         <span className="truncate max-w-36 text-[11px]">{tab.title}</span>
         <button
            onClick={onClose}
            className={cn(
               "flex items-center justify-center p-[2px] rounded opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
               "text-text-muted hover:text-text-primary hover:bg-bg-quaternary"
            )}
            aria-label="Close tab"
         >
            <IconX className="h-3 w-3" strokeWidth={2} />
         </button>
      </motion.div>
   )
}
