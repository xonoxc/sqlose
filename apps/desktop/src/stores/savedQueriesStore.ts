import { create } from "zustand"
import { persist } from "zustand/middleware"
import { ok, err, type Result } from "neverthrow"
import { AppError } from "@sqlose/shared"
import type { SavedQuery } from "../lib/types"
import { createSavedQuery } from "../lib/types"

interface SavedQueriesStore {
   queries: SavedQuery[]

   saveQuery: (
      name: string,
      sql: string,
      tags?: string[],
      environmentId?: string | null
   ) => Result<SavedQuery, AppError>
   updateQuery: (
      id: string,
      updates: Partial<Pick<SavedQuery, "name" | "sql" | "tags">>
   ) => Result<SavedQuery, AppError>
   deleteQuery: (id: string) => Result<void, AppError>
   getQuery: (id: string) => SavedQuery | undefined
   getQueriesByTag: (tag: string) => SavedQuery[]
}

export const useSavedQueriesStore = create<SavedQueriesStore>()(
   persist(
      (set, get) => ({
         queries: [],

         saveQuery: (name, sql, tags = [], environmentId = null) => {
            const q = createSavedQuery(name, sql, tags, environmentId)
            set(state => ({
               queries: [...state.queries, q],
            }))
            return ok(q)
         },

         updateQuery: (id, updates) => {
            const state = get()
            const idx = state.queries.findIndex(q => q.id === id)
            if (idx === -1) {
               return err(new AppError("env:not_found", `Saved query ${id} not found`))
            }
            const updated = {
               ...state.queries[idx],
               ...updates,
               updatedAt: new Date().toISOString(),
            }
            const queries = [...state.queries]
            queries[idx] = updated
            set({ queries })
            return ok(updated)
         },

         deleteQuery: id => {
            set(state => ({
               queries: state.queries.filter(q => q.id !== id),
            }))
            return ok(undefined)
         },

         getQuery: id => {
            return get().queries.find(q => q.id === id)
         },

         getQueriesByTag: tag => {
            return get().queries.filter(q => q.tags.includes(tag))
         },
      }),
      {
         name: "sqlose-saved-queries",
         partialize: state => ({
            queries: state.queries,
         }),
      }
   )
)
