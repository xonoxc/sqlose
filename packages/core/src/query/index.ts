import { err } from "neverthrow"
import { QueryError } from "@sqlose/shared"
import type { QueryResult, AsyncAppResult } from "@sqlose/shared"
import { executeQueryForDB } from "../drivers"
import { loadEnvironment } from "../environment/store"

export function executeQuery(environmentId: string, sql: string): AsyncAppResult<QueryResult> {
   const env = loadEnvironment(environmentId)
   if (!env) {
      return Promise.resolve(
         err(new QueryError("query:connection_failed", `Environment ${environmentId} not found`))
      )
   }
   if (env.status !== "running") {
      return Promise.resolve(
         err(new QueryError("query:connection_failed", "Environment is not running"))
      )
   }

   return executeQueryForDB(env.dbType, env.connectionString, sql)
}

export function buildQueryHistory(
   environmentId: string,
   sql: string,
   result: QueryResult | null,
   error: string | null
) {
   return {
      id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      environmentId,
      sql,
      result,
      error,
      executedAt: new Date().toISOString(),
   }
}
