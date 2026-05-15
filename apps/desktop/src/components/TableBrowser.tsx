import { ResultsTable, cn } from "@sqlose/ui"
import {
   IconRefresh,
   IconPlus,
   IconFilter,
   IconDownload,
   IconChevronLeft,
   IconChevronRight,
   IconTable,
   IconAlertCircle,
} from "@tabler/icons-react"
import { motion, AnimatePresence } from "motion/react"
import { useTableBrowserState } from "../hooks/useTableBrowserState"

export function TableBrowser() {
   const {
      displayTableName,
      tableData,
      tableDataLoading,
      tableDataError,
      schemaColumns,
      totalPages,
      handleRefresh,
      handlePrevPage,
      handleNextPage,
   } = useTableBrowserState()

   if (!displayTableName) return null

   return (
      <div className="flex flex-col h-full bg-bg-primary overflow-hidden">
         {/* Toolbar */}
         <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-bg-secondary/50 shrink-0">
            <div className="flex items-center gap-2">
               <div className="flex items-center gap-2 text-text-primary">
                  <IconTable className="h-4 w-4 text-accent" />
                  <span className="text-[13px] font-semibold">{displayTableName}</span>
               </div>
               {schemaColumns && (
                  <span className="text-[10px] text-text-muted/60 font-mono bg-bg-tertiary px-1.5 py-0.5 rounded">
                     {schemaColumns.length} column{schemaColumns.length !== 1 ? "s" : ""}
                  </span>
               )}
               {tableData && (
                  <span className="text-[10px] text-text-muted/60 font-mono">
                     {tableData.totalCount} row{tableData.totalCount !== 1 ? "s" : ""}
                  </span>
               )}
            </div>

            <div className="flex items-center gap-1">
               <ToolbarButton
                  onClick={handleRefresh}
                  disabled={tableDataLoading}
                  title="Refresh data"
               >
                  <IconRefresh className={cn("h-3.5 w-3.5", tableDataLoading && "animate-spin")} />
               </ToolbarButton>
               <ToolbarButton disabled title="Insert row (coming soon)">
                  <IconPlus className="h-3.5 w-3.5" />
               </ToolbarButton>
               <ToolbarButton disabled title="Filter (coming soon)">
                  <IconFilter className="h-3.5 w-3.5" />
               </ToolbarButton>
               <ToolbarButton disabled title="Export (coming soon)">
                  <IconDownload className="h-3.5 w-3.5" />
               </ToolbarButton>
            </div>
         </div>

         {/* Data grid */}
         <div className="flex-1 min-h-0 overflow-hidden">
            {tableDataLoading && !tableData ? (
               <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-2">
                     <div className="h-5 w-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                     <span className="text-[11px] text-text-muted">Loading data...</span>
                  </div>
               </div>
            ) : tableDataError ? (
               <div className="flex items-start gap-3 p-6">
                  <IconAlertCircle className="h-5 w-5 text-error shrink-0 mt-0.5" />
                  <div>
                     <p className="text-[13px] font-semibold text-error mb-1">
                        Failed to load table data
                     </p>
                     <p className="text-[11px] text-text-secondary font-mono">{tableDataError}</p>
                  </div>
               </div>
            ) : tableData && tableData.rows.length > 0 ? (
               <AnimatePresence mode="wait">
                  <motion.div
                     key={`${displayTableName}-${tableData.page}`}
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     transition={{ duration: 0.12 }}
                     className="h-full"
                  >
                     <ResultsTable data={tableData.rows} emptyMessage="No rows" />
                  </motion.div>
               </AnimatePresence>
            ) : (
               <div className="flex flex-col items-center justify-center h-full text-text-muted/60">
                  <IconTable className="h-8 w-8 mb-2 opacity-40" />
                  <span className="text-[12px]">No data</span>
               </div>
            )}
         </div>

         {/* Pagination bar */}
         {tableData && tableData.totalCount > 0 && (
            <div className="flex items-center justify-between px-4 py-1.5 border-t border-border/40 bg-bg-secondary/30 shrink-0">
               <div className="text-[10px] text-text-muted/60 font-mono">
                  Showing {(tableData.page - 1) * tableData.pageSize + 1}–
                  {Math.min(tableData.page * tableData.pageSize, tableData.totalCount)} of{" "}
                  {tableData.totalCount}
               </div>
               <div className="flex items-center gap-2">
                  <button
                     onClick={handlePrevPage}
                     disabled={tableData.page <= 1}
                     className={cn(
                        "h-6 w-6 rounded flex items-center justify-center transition-colors",
                        tableData.page <= 1
                           ? "text-text-muted/30 cursor-not-allowed"
                           : "text-text-muted hover:text-text-primary hover:bg-bg-quaternary"
                     )}
                     aria-label="Previous page"
                  >
                     <IconChevronLeft className="h-3 w-3" />
                  </button>
                  <span className="text-[10px] font-mono text-text-muted/80 min-w-[4rem] text-center tabular-nums">
                     Page {tableData.page} of {totalPages || 1}
                  </span>
                  <button
                     onClick={handleNextPage}
                     disabled={tableData.page >= totalPages}
                     className={cn(
                        "h-6 w-6 rounded flex items-center justify-center transition-colors",
                        tableData.page >= totalPages
                           ? "text-text-muted/30 cursor-not-allowed"
                           : "text-text-muted hover:text-text-primary hover:bg-bg-quaternary"
                     )}
                     aria-label="Next page"
                  >
                     <IconChevronRight className="h-3 w-3" />
                  </button>
               </div>
            </div>
         )}
      </div>
   )
}

function ToolbarButton({
   children,
   onClick,
   disabled,
   title,
}: {
   children: React.ReactNode
   onClick?: () => void
   disabled?: boolean
   title?: string
}) {
   return (
      <button
         onClick={onClick}
         disabled={disabled}
         title={title}
         className={cn(
            "h-7 w-7 rounded flex items-center justify-center transition-colors",
            disabled
               ? "text-text-muted/30 cursor-not-allowed"
               : "text-text-muted hover:text-text-primary hover:bg-bg-quaternary"
         )}
      >
         {children}
      </button>
   )
}
