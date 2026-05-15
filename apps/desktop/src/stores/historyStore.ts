import { create } from "zustand"
import { persist } from "zustand/middleware"
import { ok, type Result } from "neverthrow"
import { AppError } from "@sqlose/shared"
import type { HistoryEntry } from "../lib/types"
import { createHistoryEntry } from "../lib/types"

interface HistoryStore {
   entries: HistoryEntry[]

   addEntry: (
      sql: string,
      environmentId: string | null,
      dbType: string,
      duration: number,
      rowCount: number,
      status: "success" | "error",
      error: string | null
   ) => Result<HistoryEntry, AppError>
   clearHistory: () => Result<void, AppError>
   removeEntry: (id: string) => Result<void, AppError>
   getRecent: (limit?: number) => HistoryEntry[]
}

export const useHistoryStore = create<HistoryStore>()(
   persist(
      (set, get) => ({
         entries: [],

         addEntry: (sql, environmentId, dbType, duration, rowCount, status, error) => {
            const entry = createHistoryEntry(
               sql,
               environmentId,
               dbType,
               duration,
               rowCount,
               status,
               error
            )
            set(state => ({
               entries: [entry, ...state.entries].slice(0, 200),
            }))
            return ok(entry)
         },

         clearHistory: () => {
            set({ entries: [] })
            return ok(undefined)
         },

         removeEntry: (id: string) => {
            set(state => ({
               entries: state.entries.filter(e => e.id !== id),
            }))
            return ok(undefined)
         },

         getRecent: (limit = 20) => {
            return get().entries.slice(0, limit)
         },
      }),
      {
         name: "sqlose-history",
         partialize: state => ({
            entries: state.entries,
         }),
      }
   )
)
