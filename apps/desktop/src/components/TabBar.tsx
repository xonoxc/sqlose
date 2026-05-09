import { useRef, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@sqlose/ui"
import { IconX, IconPlus, IconLoader2 } from "@tabler/icons-react"
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

   const handleClose = useCallback(
      (e: React.MouseEvent, tabId: string) => {
         e.stopPropagation()
         closeTab(tabId)
      },
      [closeTab],
   )

   return (
      <div className="flex h-full w-full items-end bg-transparent overflow-hidden">
         <div className="flex-1 flex items-end overflow-x-auto scrollbar-none h-full pl-2">
            <AnimatePresence mode="popLayout">
               {tabs.map((tab, index) => (
                  <TabItem
                     key={tab.id}
                     tab={tab}
                     isActive={tab.id === activeTabId}
                     onSelect={() => setActiveTab(tab.id)}
                     onClose={(e) => handleClose(e, tab.id)}
                     onDragStart={() => handleDragStart(index)}
                     onDragOver={() => handleDragOver(index)}
                     onDragEnd={handleDragEnd}
                  />
               ))}
            </AnimatePresence>
         </div>
         <button
            onClick={() => openTab()}
            className="flex items-center justify-center h-8 w-8 mx-2 mb-1 rounded-md hover:bg-bg-quaternary/80 text-text-muted hover:text-text-primary transition-all duration-200 shrink-0"
            aria-label="New tab"
         >
            <IconPlus className="h-4 w-4" />
         </button>
      </div>
   )
}

interface TabItemProps {
   tab: Tab
   isActive: boolean
   onSelect: () => void
   onClose: (e: React.MouseEvent) => void
   onDragStart: () => void
   onDragOver: () => void
   onDragEnd: () => void
}

function TabItem({ tab, isActive, onSelect, onClose, onDragStart, onDragOver, onDragEnd }: TabItemProps) {
   return (
      <motion.div
         layout
         initial={{ opacity: 0, x: -10 }}
         animate={{ opacity: 1, x: 0 }}
         exit={{ opacity: 0, x: 10 }}
         transition={{ type: "spring", stiffness: 400, damping: 30 }}
         draggable
         onDragStart={onDragStart}
         onDragOver={onDragOver}
         onDragEnd={onDragEnd}
         onClick={onSelect}
         className={cn(
            "group relative flex items-center justify-center gap-2.5 h-[34px] px-5 py-0 text-[13px] font-medium cursor-pointer select-none shrink-0 border-t border-x border-transparent",
            "transition-all duration-200 mt-auto rounded-t-lg mx-[1px]",
            isActive
               ? "bg-[#111111] text-text-primary shadow-sm border-[#1e1e1e]"
               : "bg-transparent text-text-secondary hover:bg-[#111111]/60 hover:text-text-primary"
         )}
      >
         {tab.isExecuting && <IconLoader2 className="h-3.5 w-3.5 animate-spin text-accent shrink-0" />}
         {!tab.isExecuting && tab.isDirty && <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />}
         
         <div className="flex items-center justify-center pt-0.5">
            {tab.type === "query" ? (
               <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 mr-2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            ) : (
               <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            )}
            <span className="truncate max-w-48 pb-[1px]">{tab.title}</span>
         </div>
         
         <button
            onClick={onClose}
            className={cn(
               "flex items-center justify-center p-[3px] ml-2 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 z-10",
               isActive ? "text-text-muted hover:text-text-primary hover:bg-[#222]" : "text-text-muted hover:text-text-primary hover:bg-[#222]",
            )}
            aria-label="Close tab"
         >
            <IconX className="h-3.5 w-3.5" strokeWidth={2.5} />
         </button>
         
         {/* Bottom indicator for active tab to cover the border */}
         {isActive && <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-[#111111]" />}
      </motion.div>
   )
}
