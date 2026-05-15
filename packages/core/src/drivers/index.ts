import { err } from "neverthrow"
import { QueryError } from "@sqlose/shared"
import type { DBType, QueryResult, AsyncAppResult } from "@sqlose/shared"
import { executePostgresQuery } from "./postgres"
import { executeMySQLQuery } from "./mysql"
import { executeSQLiteQuery } from "./sqlite"

export function executeQueryForDB(
   dbType: DBType,
   connectionString: string,
   sql: string
): AsyncAppResult<QueryResult> {
   switch (dbType) {
      case "postgres":
         return executePostgresQuery(connectionString, sql)
      case "mysql":
         return executeMySQLQuery(connectionString, sql)
      case "sqlite":
         return executeSQLiteQuery(connectionString, sql)
      default:
         return Promise.resolve(
            err(new QueryError("query:execution_failed", `Unsupported DB type: ${dbType}`))
         )
   }
}
