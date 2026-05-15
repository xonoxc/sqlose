import mysql from "mysql2/promise"
import { ok, err } from "neverthrow"
import { QueryError } from "@sqlose/shared"
import type { QueryResult, AsyncAppResult } from "@sqlose/shared"

export function executeMySQLQuery(
   connectionString: string,
   sql: string
): AsyncAppResult<QueryResult> {
   return mysql
      .createConnection(connectionString)
      .then(connection => {
         const start = performance.now()
         return connection.query(sql).then(([rows, fields]) => {
            const executionTimeMs = Math.round(performance.now() - start)
            const fieldDescriptors = fields as mysql.FieldPacket[]
            const columns = fieldDescriptors?.map((f: mysql.FieldPacket) => f.name) ?? []

            return connection.end().then(() =>
               ok({
                  columns,
                  rows: (rows as Record<string, unknown>[]) ?? [],
                  rowCount: Array.isArray(rows) ? rows.length : 0,
                  executionTimeMs,
               })
            )
         })
      })
      .catch((e: Error) => {
         const message = e.message ?? ""
         if (message.toLowerCase().includes("syntax")) {
            return err(new QueryError("query:invalid_syntax", message))
         }
         return err(new QueryError("query:execution_failed", message))
      })
}

export function testMySQLConnection(connectionString: string): AsyncAppResult<boolean> {
   return mysql
      .createConnection(connectionString)
      .then(connection =>
         connection.query("SELECT 1").then(() => connection.end().then(() => ok(true)))
      )
      .catch(() => Promise.resolve(ok(false)))
}
