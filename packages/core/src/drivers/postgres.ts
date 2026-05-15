import pg from "pg"
import { ok, err } from "neverthrow"
import { QueryError } from "@sqlose/shared"
import type { QueryResult, AsyncAppResult } from "@sqlose/shared"

export function executePostgresQuery(
   connectionString: string,
   sql: string
): AsyncAppResult<QueryResult> {
   const client = new pg.Client({ connectionString })

   return client
      .connect()
      .then(() => {
         const start = performance.now()
         return client.query(sql).then(result => {
            const executionTimeMs = Math.round(performance.now() - start)
            return ok({
               columns: result.fields.map(f => f.name),
               rows: result.rows as Record<string, unknown>[],
               rowCount: result.rowCount ?? result.rows.length,
               executionTimeMs,
            })
         })
      })
      .then(result => {
         return client.end().then(() => result)
      })
      .catch((e: Error) => {
         return client.end().then(() => {
            const message = e.message ?? ""
            if (message.toLowerCase().includes("syntax")) {
               return err(new QueryError("query:invalid_syntax", message))
            }
            return err(new QueryError("query:execution_failed", message))
         })
      })
}

export function testPostgresConnection(connectionString: string): AsyncAppResult<boolean> {
   const client = new pg.Client({ connectionString })

   return client
      .connect()
      .then(() => client.query("SELECT 1"))
      .then(() => {
         return client.end().then(() => ok(true))
      })
      .catch(() => {
         return client.end().then(() => ok(false))
      })
}
