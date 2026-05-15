import { cn, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@sqlose/ui"
import {
   IconChevronRight,
   IconDatabase,
   IconTable,
   IconRefresh,
   IconKey,
   IconSearch,
   IconHistory,
   IconBookmark,
   IconCode,
   IconFileCode,
   IconLayoutSidebarLeftCollapse,
   IconSettings,
   IconClock,
   IconStar,
   IconCircleDot,
} from "@tabler/icons-react"
import { useSidebarState } from "../hooks/useSidebarState"
import type { Environment } from "@sqlose/shared"

interface AppSidebarProps {
   onSettingsOpen: () => void
   onOpenTable: (tableName: string) => void
   onOpenQuery: (sql: string) => void
   collapsed: boolean
   onToggleCollapse: () => void
}

export function AppSidebar({
   onSettingsOpen,
   onOpenTable,
   onOpenQuery,
   collapsed,
   onToggleCollapse,
}: AppSidebarProps) {
   const {
      environments,
      selectedEnvironmentId,
      savedQueries,
      savedQueryNamesBySql,
      historyEntries,
      tables,
      tableColumns,
      schemaLoading,
      schemaError,
      loadingColumnIds,
      expandedTableIds,
      activeTableId,
      keyboardFocusedIndex,
      filteredTables,
      search,
      setSearch,
      activeNav,
      setActiveNav,
      tableTreeExpanded,
      setTableTreeExpanded,
      tableListRef,
      handleSelect,
      handleTableClick,
      handleChevronClick,
      handleRefresh,
      handleNavClick,
      handleKeyDown,
      handleTableDoubleClick,
      openTab,
   } = useSidebarState(onOpenTable)

   if (collapsed) {
      return (
         <div className="flex h-full flex-col bg-bg-secondary text-text-secondary w-full border-r border-border/50 items-center py-2 gap-1">
            <button
               onClick={onToggleCollapse}
               className="h-8 w-8 rounded flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-quaternary transition-colors"
               aria-label="Expand sidebar"
            >
               <IconLayoutSidebarLeftCollapse className="h-4 w-4 rotate-180" />
            </button>
            <div className="w-6 h-px bg-border/60 my-1" />

            <button
               onClick={() => setActiveNav("playground")}
               className={cn(
                  "h-8 w-8 rounded flex items-center justify-center transition-colors",
                  activeNav === "playground"
                     ? "text-accent bg-accent/10"
                     : "text-text-muted hover:text-text-primary hover:bg-bg-quaternary"
               )}
               aria-label="Playground"
            >
               <IconCode className="h-4 w-4" />
            </button>
            <button
               onClick={() => setActiveNav("saved")}
               className={cn(
                  "h-8 w-8 rounded flex items-center justify-center transition-colors",
                  activeNav === "saved"
                     ? "text-accent bg-accent/10"
                     : "text-text-muted hover:text-text-primary hover:bg-bg-quaternary"
               )}
               aria-label="Saved Queries"
            >
               <IconBookmark className="h-4 w-4" />
            </button>
            <button
               onClick={() => setActiveNav("history")}
               className={cn(
                  "h-8 w-8 rounded flex items-center justify-center transition-colors",
                  activeNav === "history"
                     ? "text-accent bg-accent/10"
                     : "text-text-muted hover:text-text-primary hover:bg-bg-quaternary"
               )}
               aria-label="History"
            >
               <IconHistory className="h-4 w-4" />
            </button>
            <div className="w-6 h-px bg-border/60 my-1" />
            <button
               onClick={() => setTableTreeExpanded(!tableTreeExpanded)}
               className={cn(
                  "h-8 w-8 rounded flex items-center justify-center transition-colors",
                  tableTreeExpanded
                     ? "text-accent bg-accent/10"
                     : "text-text-muted hover:text-text-primary hover:bg-bg-quaternary"
               )}
               aria-label="Tables"
            >
               <IconTable className="h-4 w-4" />
            </button>
         </div>
      )
   }

   return (
      <div className="flex h-full flex-col bg-bg-secondary text-text-secondary w-full border-r border-border/50">
         {/* Header: DB Selector + Actions */}
         <div className="flex items-center justify-between w-full app-no-drag gap-1 px-3 pt-3 pb-2 shrink-0 app-drag-region">
            <Select value={selectedEnvironmentId ?? ""} onValueChange={handleSelect}>
               <SelectTrigger className="w-full bg-transparent border-transparent shadow-none hover:bg-bg-quaternary/30 focus:ring-0 px-2 h-9 transition-colors truncate">
                  <div className="flex items-center gap-2 truncate">
                     <div className="h-6 w-6 rounded bg-bg-tertiary border border-border flex items-center justify-center text-accent shrink-0">
                        <IconDatabase className="h-3.5 w-3.5" />
                     </div>
                     <SelectValue placeholder="Select Database" />
                  </div>
               </SelectTrigger>
               <SelectContent className="border-border/80 bg-bg-tertiary min-w-[200px] shadow-2xl">
                  {environments.map((env: Environment) => (
                     <SelectItem
                        key={env.id}
                        value={env.id}
                        className="text-[12px] hover:bg-bg-quaternary"
                     >
                        {env.name || `${env.dbType} ${env.port}`}
                     </SelectItem>
                  ))}
               </SelectContent>
            </Select>
            <div className="flex items-center shrink-0">
               <button
                  onClick={onSettingsOpen}
                  className="h-7 w-7 rounded flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-quaternary transition-colors"
                  aria-label="Settings"
               >
                  <IconSettings className="h-3.5 w-3.5" />
               </button>
               <button
                  onClick={onToggleCollapse}
                  className="h-7 w-7 rounded flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-quaternary transition-colors"
                  aria-label="Collapse sidebar"
               >
                  <IconLayoutSidebarLeftCollapse className="h-3.5 w-3.5" />
               </button>
            </div>
         </div>

         <div className="flex-1 flex flex-col min-h-0 custom-scrollbar overflow-y-auto">
            {/* WORKSPACE Section */}
            <div className="px-3 pt-1 pb-0.5">
               <div className="flex items-center gap-1.5 px-2 py-1.5 mb-0.5">
                  <span className="text-[10px] font-semibold tracking-widest uppercase text-text-muted/60">
                     Workspace
                  </span>
               </div>
               <div className="flex flex-col gap-0.5">
                  <NavItem
                     icon={<IconCode className="h-3.5 w-3.5" />}
                     label="Playground"
                     active={activeNav === "playground"}
                     onClick={() => handleNavClick("playground")}
                  />
                  <NavItem
                     icon={<IconBookmark className="h-3.5 w-3.5" />}
                     label="Saved Queries"
                     badge={savedQueries.length > 0 ? String(savedQueries.length) : undefined}
                     active={activeNav === "saved"}
                     onClick={() => handleNavClick("saved")}
                  />
                  <NavItem
                     icon={<IconHistory className="h-3.5 w-3.5" />}
                     label="History"
                     badge={historyEntries.length > 0 ? String(historyEntries.length) : undefined}
                     active={activeNav === "history"}
                     onClick={() => handleNavClick("history")}
                  />
               </div>
            </div>

            {/* Active nav panel */}
            {activeNav === "playground" && (
               <div className="mx-3 mb-2 p-2 rounded-md bg-bg-tertiary/50 border border-border/40">
                  <button
                     onClick={() => {
                        openTab()
                        setActiveNav(null)
                     }}
                     className="flex w-full items-center gap-2 px-2 py-1.5 rounded text-[11px] text-text-secondary hover:text-text-primary hover:bg-bg-quaternary/50 transition-colors"
                  >
                     <IconFileCode className="h-3.5 w-3.5" />
                     <span>New Query</span>
                  </button>
               </div>
            )}

            {activeNav === "saved" && (
               <div className="mx-3 mb-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {savedQueries.length === 0 ? (
                     <div className="px-2 py-4 text-center">
                        <IconBookmark className="h-5 w-5 text-text-muted/30 mx-auto mb-1" />
                        <p className="text-[10px] text-text-muted/60">No saved queries yet</p>
                     </div>
                  ) : (
                     savedQueries.map(q => (
                        <button
                           key={q.id}
                           onClick={() => {
                              onOpenQuery(q.sql)
                              setActiveNav(null)
                           }}
                           className="flex w-full items-center gap-2 px-2 py-1.5 rounded text-[11px] text-text-secondary hover:text-text-primary hover:bg-bg-quaternary/40 transition-colors text-left"
                        >
                           <IconStar className="h-3 w-3 text-warning shrink-0" />
                           <span className="truncate flex-1">{q.name}</span>
                           {q.tags.length > 0 && (
                              <span className="text-[9px] text-text-muted/60 font-mono">
                                 {q.tags[0]}
                              </span>
                           )}
                        </button>
                     ))
                  )}
               </div>
            )}

            {activeNav === "history" && (
               <div className="mx-3 mb-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {historyEntries.length === 0 ? (
                     <div className="px-2 py-4 text-center">
                        <IconClock className="h-5 w-5 text-text-muted/30 mx-auto mb-1" />
                        <p className="text-[10px] text-text-muted/60">No query history yet</p>
                     </div>
                  ) : (
                     historyEntries.slice(0, 15).map(entry => (
                        <button
                           key={entry.id}
                           onClick={() => {
                              onOpenQuery(entry.sql)
                              setActiveNav(null)
                           }}
                           className="flex w-full items-center gap-2 px-2 py-1.5 rounded text-[11px] text-text-secondary hover:text-text-primary hover:bg-bg-quaternary/40 transition-colors text-left"
                        >
                           <div
                              className={cn(
                                 "h-1.5 w-1.5 rounded-full shrink-0",
                                 entry.status === "success" ? "bg-success" : "bg-error"
                              )}
                           />
                           <span className="truncate flex-1">
                              {savedQueryNamesBySql.get(entry.sql.trim()) ?? (
                                 <span className="font-mono text-[10px]">
                                    {entry.sql.slice(0, 40)}
                                    {entry.sql.length > 40 ? "..." : ""}
                                 </span>
                              )}
                           </span>
                           <span className="text-[9px] text-text-muted/60 font-mono shrink-0">
                              {entry.duration}ms
                           </span>
                        </button>
                     ))
                  )}
               </div>
            )}

            {/* DATABASE Section */}
            <div className="flex-1 flex flex-col min-h-0 border-t border-border/40 mt-1">
               <div className="flex items-center justify-between px-4 py-2 group sticky top-0 bg-bg-secondary z-10">
                  <button
                     onClick={() => setTableTreeExpanded(!tableTreeExpanded)}
                     className="flex items-center gap-1.5"
                  >
                     <IconChevronRight
                        className={cn(
                           "h-3 w-3 text-text-muted transition-transform",
                           tableTreeExpanded && "rotate-90"
                        )}
                     />
                     <span className="text-[10px] font-semibold tracking-widest uppercase text-text-muted/60">
                        Tables
                     </span>
                  </button>
                  {tableTreeExpanded && (
                     <div className="flex items-center gap-0.5">
                        <button
                           onClick={handleRefresh}
                           disabled={schemaLoading}
                           className="h-6 w-6 rounded flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-quaternary transition-colors disabled:opacity-40"
                           aria-label="Refresh tables"
                        >
                           <IconRefresh
                              className={cn("h-3 w-3", schemaLoading && "animate-spin")}
                           />
                        </button>
                     </div>
                  )}
               </div>

               {tableTreeExpanded && (
                  <div className="flex-1 flex flex-col min-h-0 px-2">
                     {/* Search */}
                     <div className="pb-2 px-1">
                        <div className="flex items-center gap-2 bg-bg-tertiary rounded border border-border px-2.5 py-1.5">
                           <IconSearch className="h-3 w-3 text-text-muted shrink-0" />
                           <input
                              type="text"
                              value={search}
                              onChange={e => setSearch(e.target.value)}
                              placeholder="Search tables..."
                              className="flex-1 bg-transparent text-[11px] text-text-primary outline-none placeholder:text-text-muted/60"
                           />
                        </div>
                     </div>

                     {/* Table List */}
                     <div
                        ref={tableListRef}
                        className="flex-1 overflow-y-auto custom-scrollbar pb-2"
                        onKeyDown={handleKeyDown}
                        tabIndex={0}
                        role="listbox"
                        aria-label="Database tables"
                     >
                        {schemaLoading && tables.length === 0 && (
                           <div className="flex items-center justify-center py-6">
                              <div className="flex flex-col items-center gap-2">
                                 <div className="h-3 w-3 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                                 <span className="text-[10px] text-text-muted">
                                    Loading tables...
                                 </span>
                              </div>
                           </div>
                        )}

                        {schemaError && !schemaLoading && (
                           <div className="mx-1 mt-2 p-2 rounded bg-error/5 border border-error/20">
                              <p className="text-[10px] text-error font-medium mb-1">
                                 Failed to load schema
                              </p>
                              <p className="text-[9px] text-text-muted leading-relaxed">
                                 {schemaError}
                              </p>
                           </div>
                        )}

                        {!schemaLoading &&
                           !schemaError &&
                           tables.length === 0 &&
                           selectedEnvironmentId && (
                              <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                                 <IconTable className="h-6 w-6 text-text-muted/30 mb-1" />
                                 <span className="text-[11px] text-text-muted">
                                    No tables found
                                 </span>
                              </div>
                           )}

                        {!schemaLoading && filteredTables.length === 0 && tables.length > 0 && (
                           <div className="flex items-center justify-center py-6">
                              <span className="text-[11px] text-text-muted">
                                 No matching tables
                              </span>
                           </div>
                        )}

                        {filteredTables.map((tableName, index) => {
                           const isActive = activeTableId === tableName
                           const isExpanded = expandedTableIds.includes(tableName)
                           const isFocused = keyboardFocusedIndex === index
                           const columns = tableColumns[tableName]
                           const isLoadingColumns = loadingColumnIds.includes(tableName)

                           return (
                              <div key={tableName}>
                                 <div
                                    role="option"
                                    aria-selected={isActive}
                                    className={cn(
                                       "flex w-full items-center gap-1.5 rounded-md px-1.5 py-1.5 text-[12px] font-medium transition-all duration-150 outline-none cursor-pointer group",
                                       isActive
                                          ? "bg-accent/10 text-accent border-l-[2.5px] border-accent"
                                          : "text-text-secondary hover:text-text-primary hover:bg-bg-quaternary/30 border-l-[2.5px] border-transparent",
                                       isFocused && "ring-1 ring-accent/40"
                                    )}
                                    onClick={() => handleTableClick(tableName)}
                                    onDoubleClick={() => handleTableDoubleClick(tableName)}
                                 >
                                    {/* Chevron button - separate from table selection */}
                                    <button
                                       onClick={e => handleChevronClick(e, tableName)}
                                       className={cn(
                                          "h-4 w-4 rounded flex items-center justify-center shrink-0 transition-colors",
                                          "hover:bg-bg-quaternary/60 hover:text-text-primary",
                                          isExpanded && "text-accent"
                                       )}
                                       aria-label={
                                          isExpanded ? "Collapse columns" : "Expand columns"
                                       }
                                       tabIndex={-1}
                                    >
                                       <IconChevronRight
                                          className={cn(
                                             "h-2.5 w-2.5 transition-transform duration-160 ease-out",
                                             isExpanded && "rotate-90"
                                          )}
                                       />
                                    </button>

                                    <IconTable
                                       className={cn(
                                          "h-3.5 w-3.5 shrink-0 opacity-70",
                                          isActive && "opacity-100"
                                       )}
                                    />
                                    <span className="truncate flex-1 text-left">{tableName}</span>

                                    {columns && (
                                       <span className="text-[9px] text-text-muted/50 font-mono shrink-0">
                                          {columns.length}
                                       </span>
                                    )}
                                    {isLoadingColumns && (
                                       <div className="h-2.5 w-2.5 rounded-full border-[1.5px] border-accent border-t-transparent animate-spin shrink-0" />
                                    )}
                                 </div>

                                 {/* Expanded columns */}
                                 {isExpanded && (
                                    <div className="overflow-hidden transition-all duration-200 ease-out">
                                       {isLoadingColumns && !columns && (
                                          <div className="flex items-center gap-2 pl-6 py-1.5">
                                             <div className="h-2 w-2 rounded-full border-[1.5px] border-accent border-t-transparent animate-spin" />
                                             <span className="text-[9px] text-text-muted">
                                                Loading...
                                             </span>
                                          </div>
                                       )}
                                       {columns && columns.length === 0 && !isLoadingColumns && (
                                          <div className="py-1 pl-6 pr-2 text-[9px] text-text-muted italic">
                                             No columns
                                          </div>
                                       )}
                                       {columns && columns.length > 0 && (
                                          <div className="ml-3 border-l border-border/50 pl-2 pb-1 space-y-[1px]">
                                             {columns.map(col => (
                                                <div
                                                   key={col.name}
                                                   className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-bg-quaternary/20 transition-colors group/col"
                                                >
                                                   {col.primaryKey ? (
                                                      <IconKey className="h-2.5 w-2.5 shrink-0 text-amber-400" />
                                                   ) : (
                                                      <IconCircleDot className="h-2 w-2 shrink-0 text-text-muted/30" />
                                                   )}
                                                   <span className="text-[10px] font-mono text-text-primary truncate">
                                                      {col.name}
                                                   </span>
                                                   <span className="text-[8px] font-mono text-text-muted/50 truncate ml-auto">
                                                      {col.type}
                                                   </span>
                                                   <span
                                                      className={cn(
                                                         "text-[7px] font-mono px-1 rounded shrink-0 leading-none py-[2px]",
                                                         col.nullable
                                                            ? "text-text-muted/40 bg-bg-tertiary/50"
                                                            : "text-error/50 bg-error/5"
                                                      )}
                                                   >
                                                      {col.nullable ? "NULL" : "NN"}
                                                   </span>
                                                </div>
                                             ))}
                                          </div>
                                       )}
                                    </div>
                                 )}
                              </div>
                           )
                        })}
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
   )
}

function NavItem({
   icon,
   label,
   badge,
   active,
   onClick,
}: {
   icon: React.ReactNode
   label: string
   badge?: string
   active?: boolean
   onClick: () => void
}) {
   return (
      <button
         onClick={onClick}
         className={cn(
            "flex w-full items-center gap-2.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all outline-none focus-visible:ring-1 focus-visible:ring-accent",
            active
               ? "bg-accent/10 text-accent"
               : "text-text-secondary hover:text-text-primary hover:bg-bg-quaternary/40"
         )}
      >
         <span className={cn("shrink-0", active ? "text-accent" : "text-text-muted")}>{icon}</span>
         <span className="truncate flex-1 text-left">{label}</span>
         {badge && (
            <span className="text-[9px] font-mono text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded">
               {badge}
            </span>
         )}
      </button>
   )
}
