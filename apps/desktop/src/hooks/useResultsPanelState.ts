import { useState } from "react"
import type { QueryResult } from "@sqlose/shared"

export function useResultsPanelState(
   result: QueryResult | null,
   error: string | null,
   isExecuting: boolean,
   executionTimeMs: number | null,
   rowCount: number | null
) {
   const [activeTab, setActiveTab] = useState<"results" | "messages" | "stats" | "plan">("results")

   return {
      activeTab,
      setActiveTab,
      result,
      error,
      isExecuting,
      executionTimeMs,
      rowCount,
   }
}
