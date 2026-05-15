import { type ReactNode } from "react"
import { cn } from "./cn"
import { VimIndicator, type VimMode } from "./vim-indicator"
import type { DBType } from "@sqlose/shared"

interface StatusBarProps {
   vimMode?: VimMode
   dbType?: DBType
   leftItems?: ReactNode
   className?: string
}

const dbTypeLabels: Record<DBType, string> = {
   postgres: "PG",
   mysql: "MySQL",
   sqlite: "SQLite",
}

export function StatusBar({ vimMode, dbType, leftItems, className }: StatusBarProps) {
   return (
      <div
         className={cn(
            "flex h-6 items-center justify-between border-t border-border bg-bg-primary px-3 text-[11px] font-sans text-text-muted shadow-[0_-1px_2px_rgba(0,0,0,0.1)] z-50 shrink-0",
            className
         )}
      >
         <div className="flex items-center gap-3 h-full">{leftItems}</div>
         <div className="flex items-center h-full">
            {vimMode && (
               <div className="flex items-center h-full border-l border-border/50 px-3">
                  <VimIndicator mode={vimMode} />
               </div>
            )}
            <div className="flex items-center h-full border-l border-border/50 px-3 tracking-wide">
               UTF-8
            </div>
            {dbType && (
               <div className="flex items-center h-full border-l border-border/50 px-3 tracking-wide font-medium">
                  {dbTypeLabels[dbType] ?? dbType}
               </div>
            )}
            <div className="flex items-center h-full border-l border-border/50 px-3 font-mono tracking-wide">
               Ln 1, Col 1
            </div>
         </div>
      </div>
   )
}
