import { create } from "zustand"
import { persist } from "zustand/middleware"
import { ok, err, type Result } from "neverthrow"
import { AppError } from "@sqlose/shared"
import type { Tab, PaneSizes } from "../lib/types"
import { createTab, createDefaultPaneSizes, generateTabTitle } from "../lib/types"

interface WorkspaceStore {
   tabs: Tab[]
   activeTabId: string | null
   paneSizes: PaneSizes

   openTab: (environmentId?: string, overrides?: Partial<Tab>) => Result<Tab, AppError>
   closeTab: (tabId: string) => Result<{ closedId: string; newActiveId: string | null }, AppError>
   setActiveTab: (tabId: string) => Result<string, AppError>
   updateTab: (tabId: string, updates: Partial<Tab>) => Result<Tab, AppError>
   moveTab: (fromIndex: number, toIndex: number) => Result<void, AppError>
   updatePaneSizes: (updates: Partial<PaneSizes>) => Result<PaneSizes, AppError>
   getActiveTab: () => Tab | undefined
   resetWorkspace: () => void
}

const initialTab = createTab()

export const useWorkspaceStore = create<WorkspaceStore>()(
   persist(
      (set, get) => ({
         tabs: [initialTab],
         activeTabId: initialTab.id,
         paneSizes: createDefaultPaneSizes(),

         resetWorkspace: () => {
            const newTab = createTab()
            set({
               tabs: [newTab],
               activeTabId: newTab.id,
            })
         },

         openTab: (environmentId?: string, overrides?: Partial<Tab>) => {
            const tableName = overrides?.tableName
            const newTab = createTab(environmentId ?? null, tableName)
            const merged = { ...newTab, ...overrides }
            set(state => ({
               tabs: [...state.tabs, merged],
               activeTabId: merged.id,
            }))
            return ok(merged)
         },

         closeTab: (tabId: string) => {
            const state = get()
            const tabIndex = state.tabs.findIndex(t => t.id === tabId)

            if (tabIndex === -1) {
               return err(new AppError("env:not_found", `Tab ${tabId} not found`))
            }

            if (state.tabs.length === 1) {
               const newTab = createTab()
               set({
                  tabs: [newTab],
                  activeTabId: newTab.id,
               })
               return ok({ closedId: tabId, newActiveId: newTab.id })
            }

            const newTabs = state.tabs.filter(t => t.id !== tabId)
            let newActiveId = state.activeTabId

            if (state.activeTabId === tabId) {
               const newIndex = Math.min(tabIndex, newTabs.length - 1)
               newActiveId = newTabs[newIndex]?.id ?? null
            }

            set({
               tabs: newTabs,
               activeTabId: newActiveId,
            })

            return ok({ closedId: tabId, newActiveId })
         },

         setActiveTab: (tabId: string) => {
            const state = get()
            const exists = state.tabs.some(t => t.id === tabId)

            if (!exists) {
               return err(new AppError("env:not_found", `Tab ${tabId} not found`))
            }

            set({ activeTabId: tabId })
            return ok(tabId)
         },

         updateTab: (tabId: string, updates: Partial<Tab>) => {
            const state = get()
            const tabIndex = state.tabs.findIndex(t => t.id === tabId)

            if (tabIndex === -1) {
               return err(new AppError("env:not_found", `Tab ${tabId} not found`))
            }

            const current = state.tabs[tabIndex]
            const merged = { ...current, ...updates }

            // Auto-rename tab based on SQL content when query changes and tab has default title or is dirty
            if (updates.query !== undefined && updates.query !== current.query) {
               const newTitle = generateTabTitle(updates.query)
               if (newTitle !== current.title) {
                  merged.title = newTitle
               }
            }

            const newTabs = [...state.tabs]
            newTabs[tabIndex] = merged

            set({ tabs: newTabs })
            return ok(newTabs[tabIndex])
         },

         moveTab: (fromIndex: number, toIndex: number) => {
            const state = get()

            if (
               fromIndex < 0 ||
               fromIndex >= state.tabs.length ||
               toIndex < 0 ||
               toIndex >= state.tabs.length
            ) {
               return err(
                  new AppError(
                     "ipc:invalid_payload",
                     `Invalid tab indices: ${fromIndex} -> ${toIndex}`
                  )
               )
            }

            if (fromIndex === toIndex) {
               return ok(undefined)
            }

            const newTabs = [...state.tabs]
            const [moved] = newTabs.splice(fromIndex, 1)
            newTabs.splice(toIndex, 0, moved)

            set({ tabs: newTabs })
            return ok(undefined)
         },

         updatePaneSizes: (updates: Partial<PaneSizes>) => {
            const state = get()
            const newSizes = { ...state.paneSizes, ...updates }
            set({ paneSizes: newSizes })
            return ok(newSizes)
         },

         getActiveTab: () => {
            const state = get()
            return state.tabs.find(t => t.id === state.activeTabId)
         },
      }),
      {
         name: "sqlose-workspace",
         partialize: state => ({
            tabs: state.tabs.map(tab => ({
               ...tab,
               result: null,
               error: null,
               isExecuting: false,
            })),
            activeTabId: state.activeTabId,
            paneSizes: state.paneSizes,
         }),
      }
   )
)
