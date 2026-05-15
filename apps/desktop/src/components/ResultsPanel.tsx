import { motion } from "motion/react"
import { ResultsTable, cn } from "@sqlose/ui"
import {
   IconAlertCircle,
   IconLoader2,
   IconDatabaseOff,
   IconTable,
   IconInfoCircle,
   IconChartBar,
   IconFileCode,
} from "@tabler/icons-react"
import type { QueryResult } from "@sqlose/shared"
import { useResultsPanelState } from "../hooks/useResultsPanelState"

interface ResultsPanelProps {
   result: QueryResult | null
   error: string | null
   isExecuting: boolean
   executionTimeMs: number | null
   rowCount: number | null
}

type ResultTab = "results" | "messages" | "stats" | "plan"

const tabs: { id: ResultTab; label: string; icon: React.ReactNode }[] = [
   { id: "results", label: "Results", icon: <IconTable className="h-3 w-3" /> },
   { id: "messages", label: "Messages", icon: <IconInfoCircle className="h-3 w-3" /> },
   { id: "stats", label: "Stats", icon: <IconChartBar className="h-3 w-3" /> },
   { id: "plan", label: "Query Plan", icon: <IconFileCode className="h-3 w-3" /> },
]

export function ResultsPanel({
   result,
   error,
   isExecuting,
   executionTimeMs,
   rowCount,
}: ResultsPanelProps) {
   const { activeTab, setActiveTab } = useResultsPanelState(
      result,
      error,
      isExecuting,
      executionTimeMs,
      rowCount
   )

   const tabContent = () => {
      switch (activeTab) {
         case "results":
            return <ResultsTab result={result} error={error} isExecuting={isExecuting} />
         case "messages":
            return <MessagesTab result={result} error={error} isExecuting={isExecuting} />
         case "stats":
            return (
               <StatsTab
                  result={result}
                  error={error}
                  isExecuting={isExecuting}
                  executionTimeMs={executionTimeMs}
                  rowCount={rowCount}
               />
            )
         case "plan":
            return <PlanTab />
      }
   }

   return (
      <div className="h-full bg-bg-primary flex flex-col">
         {/* Tab bar */}
         <div className="flex items-center gap-0.5 px-3 pt-2 pb-0 shrink-0 border-b border-border/30">
            {tabs.map(tab => {
               const isDisabled = tab.id === "plan" // Query Plan requires EXPLAIN support
               return (
                  <button
                     key={tab.id}
                     onClick={() => !isDisabled && setActiveTab(tab.id)}
                     disabled={isDisabled}
                     className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-t-sm transition-colors",
                        activeTab === tab.id
                           ? "text-text-primary bg-bg-primary border-t border-x border-border/40 -mb-px"
                           : "text-text-muted hover:text-text-secondary",
                        isDisabled && "opacity-30 cursor-not-allowed"
                     )}
                  >
                     {tab.icon}
                     {tab.label}
                  </button>
               )
            })}
         </div>
         <div className="flex-1 min-h-0 overflow-hidden">{tabContent()}</div>
      </div>
   )
}

function ResultsTab({
   result,
   error,
   isExecuting,
}: {
   result: QueryResult | null
   error: string | null
   isExecuting: boolean
}) {
   if (isExecuting) {
      return (
         <div className="flex items-center justify-center h-full bg-bg-primary">
            <div className="flex flex-col items-center justify-center gap-3 text-text-muted">
               <IconLoader2 className="h-6 w-6 animate-spin text-accent" />
               <span className="text-[13px] font-medium">Executing query...</span>
            </div>
         </div>
      )
   }

   if (error) {
      return (
         <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-4 p-6 bg-bg-primary h-full"
         >
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-error/10 shrink-0">
               <IconAlertCircle className="h-5 w-5 text-error" />
            </div>
            <div>
               <p className="text-[14px] font-semibold text-error mb-2">Query Execution Failed</p>
               <p className="text-[13px] text-text-secondary font-mono bg-bg-secondary p-3 rounded-md border border-border/50 max-w-4xl whitespace-pre-wrap">
                  {error}
               </p>
            </div>
         </motion.div>
      )
   }

   if (!result) {
      return (
         <div className="flex items-center justify-center h-full bg-bg-primary">
            <div className="flex flex-col items-center justify-center gap-3 text-text-muted/60 opacity-80">
               <IconDatabaseOff className="h-10 w-10 mb-1" />
               <span className="text-[13px] font-medium tracking-wide">Ready to run query</span>
               <div className="flex flex-col gap-1.5 mt-3">
                  <div className="flex items-center gap-2 text-[10px] font-mono bg-bg-secondary px-2.5 py-1 rounded border border-border/50">
                     <kbd className="bg-bg-primary px-1 py-0.5 rounded border border-border/40 text-[9px]">
                        ⌘
                     </kbd>
                     <kbd className="bg-bg-primary px-1 py-0.5 rounded border border-border/40 text-[9px]">
                        ↵
                     </kbd>
                     <span className="text-text-muted">Run query</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono bg-bg-secondary px-2.5 py-1 rounded border border-border/50">
                     <kbd className="bg-bg-primary px-1 py-0.5 rounded border border-border/40 text-[9px]">
                        ⌘
                     </kbd>
                     <kbd className="bg-bg-primary px-1 py-0.5 rounded border border-border/40 text-[9px]">
                        K
                     </kbd>
                     <span className="text-text-muted">Command palette</span>
                  </div>
               </div>
            </div>
         </div>
      )
   }

   return (
      <div className="h-full bg-bg-primary overflow-hidden flex flex-col">
         <div className="flex-1 min-h-0">
            <ResultsTable data={result.rows as Record<string, unknown>[]} />
         </div>
      </div>
   )
}

function MessagesTab({
   result,
   error,
   isExecuting,
}: {
   result: QueryResult | null
   error: string | null
   isExecuting: boolean
}) {
   if (isExecuting) {
      return (
         <div className="flex items-center justify-center h-full">
            <span className="text-[12px] text-text-muted">Query is running...</span>
         </div>
      )
   }

   if (error) {
      return (
         <div className="p-4">
            <div className="p-3 rounded bg-error/5 border border-error/20">
               <p className="text-[12px] font-medium text-error mb-1">Error</p>
               <pre className="text-[11px] text-text-secondary font-mono whitespace-pre-wrap">
                  {error}
               </pre>
            </div>
         </div>
      )
   }

   if (!result) {
      return (
         <div className="flex items-center justify-center h-full">
            <span className="text-[12px] text-text-muted/60">No messages</span>
         </div>
      )
   }

   return (
      <div className="p-4">
         <div className="p-3 rounded bg-success/5 border border-success/20">
            <p className="text-[12px] font-medium text-success">Query executed successfully</p>
            <p className="text-[11px] text-text-secondary mt-1">
               Returned {result.rowCount} row{result.rowCount !== 1 ? "s" : ""} in{" "}
               {result.executionTimeMs}ms
            </p>
         </div>
      </div>
   )
}

function StatsTab({
   result,
   error,
   isExecuting,
   executionTimeMs,
   rowCount,
}: {
   result: QueryResult | null
   error: string | null
   isExecuting: boolean
   executionTimeMs: number | null
   rowCount: number | null
}) {
   if (isExecuting) {
      return (
         <div className="flex items-center justify-center h-full">
            <span className="text-[12px] text-text-muted">Query is running...</span>
         </div>
      )
   }

   if (!result && !error) {
      return (
         <div className="flex items-center justify-center h-full">
            <span className="text-[12px] text-text-muted/60">Run a query to see statistics</span>
         </div>
      )
   }

   const stats = [
      {
         label: "Status",
         value: error ? "Failed" : "Success",
         color: error ? "text-error" : "text-success",
      },
      { label: "Duration", value: executionTimeMs !== null ? `${executionTimeMs}ms` : "—" },
      { label: "Row Count", value: rowCount !== null ? String(rowCount) : "—" },
      { label: "Columns", value: result ? String(result.columns.length) : "—" },
   ]

   return (
      <div className="p-4">
         <div className="grid grid-cols-2 gap-3">
            {stats.map(s => (
               <div key={s.label} className="p-3 rounded bg-bg-secondary border border-border/50">
                  <p className="text-[10px] font-semibold tracking-wide text-text-muted uppercase mb-1">
                     {s.label}
                  </p>
                  <p
                     className={cn(
                        "text-[13px] font-mono font-medium",
                        s.color || "text-text-primary"
                     )}
                  >
                     {s.value}
                  </p>
               </div>
            ))}
         </div>
         {result && (
            <div className="mt-3 p-3 rounded bg-bg-secondary border border-border/50">
               <p className="text-[10px] font-semibold tracking-wide text-text-muted uppercase mb-1">
                  Columns
               </p>
               <div className="flex flex-wrap gap-1.5">
                  {result.columns.map(col => (
                     <span
                        key={col}
                        className="text-[10px] font-mono text-text-secondary bg-bg-tertiary px-1.5 py-0.5 rounded border border-border/40"
                     >
                        {col}
                     </span>
                  ))}
               </div>
            </div>
         )}
      </div>
   )
}

function PlanTab() {
   return (
      <div className="flex flex-col items-center justify-center h-full text-text-muted/60">
         <IconFileCode className="h-8 w-8 mb-2" />
         <span className="text-[12px]">Query plan requires EXPLAIN support</span>
         <span className="text-[10px] mt-1">Run a query prefixed with EXPLAIN to see the plan</span>
      </div>
   )
}
