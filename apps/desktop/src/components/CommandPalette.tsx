import { motion, AnimatePresence } from "motion/react"
import { cn } from "@sqlose/ui"
import { IconSearch } from "@tabler/icons-react"
import { useCommandPaletteLogic } from "../hooks/useCommandPaletteLogic"

interface CommandPaletteProps {
   isOpen: boolean
   onClose: () => void
   onExecuteQuery?: () => void
   onClearResults?: () => void
   onOpenTable?: (tableName: string) => void
   onOpenQuery?: (sql: string) => void
}

export function CommandPalette({
   isOpen,
   onClose,
   onExecuteQuery,
   onClearResults,
   onOpenQuery,
}: CommandPaletteProps) {
   const {
      query,
      setQuery,
      selectedIndex,
      setSelectedIndex,
      inputRef,
      groupedItems,
      flatFiltered,
   } = useCommandPaletteLogic(isOpen, onClose, onExecuteQuery, onClearResults, onOpenQuery)

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
                  onClick={e => e.stopPropagation()}
               >
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
                     <IconSearch className="h-4 w-4 text-text-muted shrink-0" />
                     <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => {
                           setQuery(e.target.value)
                           setSelectedIndex(0)
                        }}
                        placeholder="Search tables, queries, commands..."
                        className="flex-1 bg-transparent text-[14px] font-medium text-text-primary outline-none placeholder:text-text-muted/60"
                     />
                     <kbd className="text-[10px] text-text-muted font-mono border border-border/50 bg-bg-secondary rounded px-1.5 py-0.5">
                        ESC
                     </kbd>
                  </div>
                  <div className="max-h-[55vh] overflow-y-auto py-1 custom-scrollbar">
                     {flatFiltered.length === 0 && (
                        <div className="px-4 py-10 text-center flex flex-col items-center">
                           <IconSearch className="h-7 w-7 text-text-muted/40 mb-2" />
                           <span className="text-sm text-text-muted">
                              No results for &ldquo;{query}&rdquo;
                           </span>
                        </div>
                     )}

                     {groupedItems.actions.length > 0 && (
                        <>
                           <div className="px-4 py-1.5 text-[10px] font-semibold tracking-wider text-text-muted uppercase">
                              Actions
                           </div>
                           {groupedItems.actions.map(item => {
                              const globalIndex = flatFiltered.indexOf(item)
                              return (
                                 <button
                                    key={item.id}
                                    onClick={() => {
                                       item.onSelect()
                                       onClose()
                                    }}
                                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                                    className={cn(
                                       "flex w-full items-center gap-3 px-4 py-2 text-left transition-all outline-none",
                                       globalIndex === selectedIndex
                                          ? "bg-bg-quaternary/60 text-text-primary"
                                          : "text-text-secondary"
                                    )}
                                 >
                                    <div
                                       className={cn(
                                          "flex items-center justify-center h-7 w-7 rounded shrink-0",
                                          globalIndex === selectedIndex
                                             ? "bg-bg-primary text-accent"
                                             : "bg-bg-quaternary text-text-muted"
                                       )}
                                    >
                                       {item.icon}
                                    </div>
                                    <div className="flex-1 min-w-0 flex items-center justify-between">
                                       <div className="flex flex-col">
                                          <span
                                             className={cn(
                                                "text-[13px] font-medium truncate",
                                                globalIndex === selectedIndex && "text-text-primary"
                                             )}
                                          >
                                             {item.label}
                                          </span>
                                          <span className="text-[11px] text-text-muted truncate">
                                             {item.description}
                                          </span>
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
                           <div className="px-4 py-1.5 text-[10px] font-semibold tracking-wider text-text-muted uppercase border-t border-border/20 mt-1">
                              Saved Queries
                           </div>
                           {groupedItems.saved.map(item => {
                              const globalIndex = flatFiltered.indexOf(item)
                              return (
                                 <button
                                    key={item.id}
                                    onClick={() => {
                                       item.onSelect()
                                       onClose()
                                    }}
                                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                                    className={cn(
                                       "flex w-full items-center gap-3 px-4 py-2 text-left transition-all outline-none",
                                       globalIndex === selectedIndex
                                          ? "bg-bg-quaternary/60 text-text-primary"
                                          : "text-text-secondary"
                                    )}
                                 >
                                    <div
                                       className={cn(
                                          "flex items-center justify-center h-7 w-7 rounded shrink-0",
                                          globalIndex === selectedIndex
                                             ? "bg-bg-primary text-accent"
                                             : "bg-bg-quaternary text-text-muted"
                                       )}
                                    >
                                       {item.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <span
                                          className={cn(
                                             "text-[13px] font-medium truncate block",
                                             globalIndex === selectedIndex && "text-text-primary"
                                          )}
                                       >
                                          {item.label}
                                       </span>
                                       <span className="text-[11px] text-text-muted truncate block">
                                          {item.description}
                                       </span>
                                    </div>
                                 </button>
                              )
                           })}
                        </>
                     )}

                     {groupedItems.history.length > 0 && (
                        <>
                           <div className="px-4 py-1.5 text-[10px] font-semibold tracking-wider text-text-muted uppercase border-t border-border/20 mt-1">
                              History
                           </div>
                           {groupedItems.history.map(item => {
                              const globalIndex = flatFiltered.indexOf(item)
                              return (
                                 <button
                                    key={item.id}
                                    onClick={() => {
                                       item.onSelect()
                                       onClose()
                                    }}
                                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                                    className={cn(
                                       "flex w-full items-center gap-3 px-4 py-2 text-left transition-all outline-none",
                                       globalIndex === selectedIndex
                                          ? "bg-bg-quaternary/60 text-text-primary"
                                          : "text-text-secondary"
                                    )}
                                 >
                                    <div
                                       className={cn(
                                          "flex items-center justify-center h-7 w-7 rounded shrink-0",
                                          globalIndex === selectedIndex
                                             ? "bg-bg-primary text-accent"
                                             : "bg-bg-quaternary text-text-muted"
                                       )}
                                    >
                                       {item.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <span
                                          className={cn(
                                             "text-[13px] font-medium truncate block font-mono text-[12px]",
                                             globalIndex === selectedIndex && "text-text-primary"
                                          )}
                                       >
                                          {item.label}
                                       </span>
                                       <span className="text-[11px] text-text-muted truncate block">
                                          {item.description}
                                       </span>
                                    </div>
                                 </button>
                              )
                           })}
                        </>
                     )}

                     {groupedItems.databases.length > 0 && (
                        <>
                           <div className="px-4 py-1.5 text-[10px] font-semibold tracking-wider text-text-muted uppercase border-t border-border/20 mt-1">
                              Databases
                           </div>
                           {groupedItems.databases.map(item => {
                              const globalIndex = flatFiltered.indexOf(item)
                              return (
                                 <button
                                    key={item.id}
                                    onClick={() => {
                                       item.onSelect()
                                       onClose()
                                    }}
                                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                                    className={cn(
                                       "flex w-full items-center gap-3 px-4 py-2 text-left transition-all outline-none",
                                       globalIndex === selectedIndex
                                          ? "bg-bg-quaternary/60 text-text-primary"
                                          : "text-text-secondary"
                                    )}
                                 >
                                    <div
                                       className={cn(
                                          "flex items-center justify-center h-7 w-7 rounded shrink-0",
                                          globalIndex === selectedIndex
                                             ? "bg-bg-primary text-accent"
                                             : "bg-bg-quaternary text-text-muted"
                                       )}
                                    >
                                       {item.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <span
                                          className={cn(
                                             "text-[13px] font-medium truncate block",
                                             globalIndex === selectedIndex && "text-text-primary"
                                          )}
                                       >
                                          {item.label}
                                       </span>
                                       <span className="text-[11px] text-text-muted truncate block">
                                          {item.description}
                                       </span>
                                    </div>
                                 </button>
                              )
                           })}
                        </>
                     )}

                     {groupedItems.tabs.length > 0 && (
                        <>
                           <div className="px-4 py-1.5 text-[10px] font-semibold tracking-wider text-text-muted uppercase border-t border-border/20 mt-1">
                              Open Tabs
                           </div>
                           {groupedItems.tabs.map(item => {
                              const globalIndex = flatFiltered.indexOf(item)
                              return (
                                 <button
                                    key={item.id}
                                    onClick={() => {
                                       item.onSelect()
                                       onClose()
                                    }}
                                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                                    className={cn(
                                       "flex w-full items-center gap-3 px-4 py-2 text-left transition-all outline-none",
                                       globalIndex === selectedIndex
                                          ? "bg-bg-quaternary/60 text-text-primary"
                                          : "text-text-secondary"
                                    )}
                                 >
                                    <div
                                       className={cn(
                                          "flex items-center justify-center h-7 w-7 rounded shrink-0",
                                          globalIndex === selectedIndex
                                             ? "bg-bg-primary text-accent"
                                             : "bg-bg-quaternary text-text-muted"
                                       )}
                                    >
                                       {item.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <span
                                          className={cn(
                                             "text-[13px] font-medium truncate block",
                                             globalIndex === selectedIndex && "text-text-primary"
                                          )}
                                       >
                                          {item.label}
                                       </span>
                                       <span className="text-[11px] text-text-muted truncate block">
                                          {item.description}
                                       </span>
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
