import { motion } from "motion/react"
import { ResultsTable } from "@sqlose/ui"
import { IconAlertCircle, IconLoader2, IconDatabaseOff } from "@tabler/icons-react"
import type { QueryResult } from "@sqlose/shared"

interface ResultsPanelProps {
   result: QueryResult | null
   error: string | null
   isExecuting: boolean
}

export function ResultsPanel({ result, error, isExecuting }: ResultsPanelProps) {
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
               <p className="text-[13px] text-text-secondary font-mono bg-bg-secondary p-3 rounded-md border border-border/50 max-w-4xl whitespace-pre-wrap">{error}</p>
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
               <span className="text-[11px] font-mono bg-bg-secondary px-2 py-0.5 rounded border border-border/50 mt-1 uppercase">Run to view data</span>
            </div>
         </div>
      )
   }

   return (
      <div className="h-full bg-bg-primary overflow-hidden flex flex-col">
         <div className="flex-1 min-h-0">
            <ResultsTable
               data={result.rows as Record<string, unknown>[]}
            />
         </div>
      </div>
   )
}
