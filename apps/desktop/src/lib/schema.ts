import { api } from "./api"
import type { DBType } from "@sqlose/shared"

export interface ColumnInfo {
   name: string
   type: string
   nullable: boolean
   primaryKey: boolean
}

function getListTablesSQL(dbType: DBType): string {
   switch (dbType) {
      case "postgres":
         return `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`
      case "mysql":
         return `SELECT TABLE_NAME as table_name FROM information_schema.tables WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME`
      case "sqlite":
         return `SELECT name as table_name FROM sqlite_master WHERE type = 'table' ORDER BY name`
   }
}

function getColumnsSQL(dbType: DBType, table: string): string {
   const safeTable = table.replace(/'/g, "''")
   switch (dbType) {
      case "postgres":
         return `SELECT column_name, data_type, is_nullable, COALESCE(column_default, '') as column_default, COALESCE((SELECT true FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name WHERE tc.table_name = '${safeTable}' AND tc.constraint_type = 'PRIMARY KEY' AND kcu.column_name = c.column_name AND tc.table_schema = 'public'), false) as pk FROM information_schema.columns c WHERE table_name = '${safeTable}' AND table_schema = 'public' ORDER BY ordinal_position`
      case "mysql":
         return `SELECT COLUMN_NAME as column_name, DATA_TYPE as data_type, IS_NULLABLE as is_nullable, COALESCE(COLUMN_KEY, '') as column_key FROM information_schema.columns WHERE TABLE_NAME = '${safeTable}' AND TABLE_SCHEMA = DATABASE() ORDER BY ORDINAL_POSITION`
      case "sqlite":
         return `SELECT name as column_name, type as data_type, CASE WHEN "notnull" = 0 THEN 'YES' ELSE 'NO' END as is_nullable, pk FROM pragma_table_info('${safeTable}')`
   }
}

export async function listTables(envId: string, dbType: DBType): Promise<string[]> {
   const sql = getListTablesSQL(dbType)
   const result = await api.query.execute(envId, sql)
   if (result.isErr()) throw result.error
   return result.value.rows.map(r => String(r.table_name ?? "")).filter(Boolean)
}

export async function getTableColumns(
   envId: string,
   tableName: string,
   dbType: DBType
): Promise<ColumnInfo[]> {
   const sql = getColumnsSQL(dbType, tableName)
   const result = await api.query.execute(envId, sql)
   if (result.isErr()) throw result.error
   return result.value.rows.map(r => ({
      name: String(r.column_name ?? ""),
      type: String(r.data_type ?? ""),
      nullable: String(r.is_nullable ?? "YES") !== "NO",
      primaryKey: r.pk === 1 || r.pk === true || r.pk === "1" || r.column_key === "PRI",
   }))
}
