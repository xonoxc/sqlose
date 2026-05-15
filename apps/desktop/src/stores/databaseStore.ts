import { create } from "zustand"
import { listTables, getTableColumns, type ColumnInfo } from "../lib/schema"
import { api } from "../lib/api"
import type { DBType } from "@sqlose/shared"

export interface TableDataState {
   columns: string[]
   rows: Record<string, unknown>[]
   totalCount: number
   page: number
   pageSize: number
}

interface DatabaseStore {
   tables: string[]
   tableColumns: Record<string, ColumnInfo[]>
   schemaLoading: boolean
   schemaError: string | null
   loadingColumnIds: string[]

   expandedTableIds: string[]
   activeTableId: string | null
   keyboardFocusedIndex: number

   tableData: TableDataState | null
   tableDataLoading: boolean
   tableDataError: string | null

   setExpanded: (tableId: string) => void
   setActiveTable: (tableId: string | null) => void
   setKeyboardFocusedIndex: (index: number) => void
   fetchTables: (envId: string, dbType: DBType) => Promise<void>
   fetchColumns: (envId: string, tableName: string, dbType: DBType) => Promise<void>
   fetchTableData: (
      envId: string,
      tableName: string,
      page?: number,
      pageSize?: number
   ) => Promise<void>
   refreshTableData: (envId: string, tableName: string) => Promise<void>
   reset: () => void
}

export const useDatabaseStore = create<DatabaseStore>()((set, get) => ({
   tables: [],
   tableColumns: {},
   schemaLoading: false,
   schemaError: null,
   loadingColumnIds: [],

   expandedTableIds: [],
   activeTableId: null,
   keyboardFocusedIndex: -1,

   tableData: null,
   tableDataLoading: false,
   tableDataError: null,

   setExpanded: (tableId: string) => {
      const state = get()
      const isExpanded = state.expandedTableIds.includes(tableId)
      if (isExpanded) {
         set({ expandedTableIds: state.expandedTableIds.filter(id => id !== tableId) })
      } else {
         set({ expandedTableIds: [...state.expandedTableIds, tableId] })
      }
   },

   setActiveTable: (tableId: string | null) => {
      set({ activeTableId: tableId })
   },

   setKeyboardFocusedIndex: (index: number) => {
      set({ keyboardFocusedIndex: index })
   },

   fetchTables: async (envId: string, dbType: DBType) => {
      set({ schemaLoading: true, schemaError: null })
      try {
         const result = await listTables(envId, dbType)
         set({ tables: result, schemaLoading: false })
      } catch (err) {
         set({
            schemaError: err instanceof Error ? err.message : "Failed to load tables",
            schemaLoading: false,
         })
      }
   },

   fetchColumns: async (envId: string, tableName: string, dbType: DBType) => {
      const state = get()
      if (state.tableColumns[tableName]) return

      set({ loadingColumnIds: [...state.loadingColumnIds, tableName] })
      try {
         const columns = await getTableColumns(envId, tableName, dbType)
         set(state => ({
            tableColumns: { ...state.tableColumns, [tableName]: columns },
            loadingColumnIds: state.loadingColumnIds.filter(id => id !== tableName),
         }))
      } catch {
         set(state => ({
            tableColumns: { ...state.tableColumns, [tableName]: [] },
            loadingColumnIds: state.loadingColumnIds.filter(id => id !== tableName),
         }))
      }
   },

   fetchTableData: async (envId: string, tableName: string, page = 1, pageSize = 100) => {
      set({ tableDataLoading: true, tableDataError: null })
      const offset = (page - 1) * pageSize
      try {
         const countSql = `SELECT COUNT(*) as total FROM ${tableName}`
         const countResult = await api.query.execute(envId, countSql)
         let totalCount = 0
         if (countResult.isOk()) {
            totalCount = Number(countResult.value.rows[0]?.total ?? 0)
         }

         const dataSql = `SELECT * FROM ${tableName} LIMIT ${pageSize} OFFSET ${offset}`
         const dataResult = await api.query.execute(envId, dataSql)
         if (dataResult.isErr()) throw dataResult.error

         const qr = dataResult.value
         set({
            tableData: {
               columns: qr.columns,
               rows: qr.rows as Record<string, unknown>[],
               totalCount,
               page,
               pageSize,
            },
            tableDataLoading: false,
         })
      } catch (err) {
         set({
            tableDataError: err instanceof Error ? err.message : "Failed to load table data",
            tableDataLoading: false,
         })
      }
   },

   refreshTableData: async (envId: string, tableName: string) => {
      const state = get()
      const currentPage = state.tableData?.page ?? 1
      const pageSize = state.tableData?.pageSize ?? 100
      await get().fetchTableData(envId, tableName, currentPage, pageSize)
   },

   reset: () => {
      set({
         tables: [],
         tableColumns: {},
         schemaLoading: false,
         schemaError: null,
         loadingColumnIds: [],
         expandedTableIds: [],
         activeTableId: null,
         keyboardFocusedIndex: -1,
         tableData: null,
         tableDataLoading: false,
         tableDataError: null,
      })
   },
}))
