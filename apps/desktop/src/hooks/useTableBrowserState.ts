import { useCallback, useEffect, useMemo, useRef } from "react"
import { useWorkspaceStore } from "../stores/workspaceStore"
import { useDatabaseStore } from "../stores/databaseStore"
import { useEnvironmentStore } from "../stores/environmentStore"

export function useTableBrowserState() {
   const activeTab = useWorkspaceStore(s => {
      const tab = s.tabs.find(t => t.id === s.activeTabId)
      return tab ?? null
   })
   const tableName = activeTab?.tableName ?? null
   const tableNameRef = useRef(tableName)
   if (tableName) tableNameRef.current = tableName

   const tableData = useDatabaseStore(s => s.tableData)
   const tableDataLoading = useDatabaseStore(s => s.tableDataLoading)
   const tableDataError = useDatabaseStore(s => s.tableDataError)
   const fetchTableData = useDatabaseStore(s => s.fetchTableData)
   const tableColumns = useDatabaseStore(s => s.tableColumns)

   const selectedEnvironmentId = useEnvironmentStore(s => s.selectedEnvironmentId)
   const environments = useEnvironmentStore(s => s.environments)
   const selectedEnv = selectedEnvironmentId
      ? (environments.find(e => e.id === selectedEnvironmentId) ?? null)
      : null

   const schemaColumns = tableName ? tableColumns[tableName] : undefined

   useEffect(() => {
      if (tableName && selectedEnvironmentId && selectedEnv) {
         fetchTableData(selectedEnvironmentId, tableName, 1, 100)
      }
   }, [tableName, selectedEnvironmentId, selectedEnv, fetchTableData])

   const totalPages = useMemo(() => {
      if (!tableData) return 0
      return Math.ceil(tableData.totalCount / tableData.pageSize)
   }, [tableData])

   const handleRefresh = useCallback(() => {
      if (tableName && selectedEnvironmentId) {
         fetchTableData(
            selectedEnvironmentId,
            tableName,
            tableData?.page ?? 1,
            tableData?.pageSize ?? 100
         )
      }
   }, [tableName, selectedEnvironmentId, fetchTableData, tableData])

   const handlePrevPage = useCallback(() => {
      if (tableName && selectedEnvironmentId && tableData && tableData.page > 1) {
         fetchTableData(selectedEnvironmentId, tableName, tableData.page - 1, tableData.pageSize)
      }
   }, [tableName, selectedEnvironmentId, fetchTableData, tableData])

   const handleNextPage = useCallback(() => {
      if (tableName && selectedEnvironmentId && tableData && tableData.page < totalPages) {
         fetchTableData(selectedEnvironmentId, tableName, tableData.page + 1, tableData.pageSize)
      }
   }, [tableName, selectedEnvironmentId, fetchTableData, tableData, totalPages])

   const displayTableName = tableName ?? tableNameRef.current

   return {
      displayTableName,
      tableData,
      tableDataLoading,
      tableDataError,
      schemaColumns,
      totalPages,
      activeTab,
      handleRefresh,
      handlePrevPage,
      handleNextPage,
   }
}
