import sqlite3 from "sqlite3"
import { ok, err } from "neverthrow"
import { QueryError } from "@sqlose/shared"
import type { QueryResult, AsyncAppResult } from "@sqlose/shared"

function openDatabase(dbPath: string): Promise<sqlite3.Database> {
   return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath, error => {
         if (error) reject(error)
         else resolve(db)
      })
   })
}

function runQuery(
   db: sqlite3.Database,
   sql: string
): Promise<{ columns: string[]; rows: Record<string, unknown>[] }> {
   return new Promise((resolve, reject) => {
      db.all(sql, (error, rows) => {
         if (error) reject(error)
         else {
            const columns = rows.length > 0 ? Object.keys(rows[0] as Record<string, unknown>) : []
            resolve({ columns, rows: rows as Record<string, unknown>[] })
         }
      })
   })
}

function closeDatabase(db: sqlite3.Database): Promise<void> {
   return new Promise((resolve, reject) => {
      db.close(err => {
         if (err) reject(err)
         else resolve()
      })
   })
}

export function executeSQLiteQuery(dbPath: string, sql: string): AsyncAppResult<QueryResult> {
   return openDatabase(dbPath)
      .then(db => {
         const start = performance.now()
         return runQuery(db, sql).then(({ columns, rows }) => {
            const executionTimeMs = Math.round(performance.now() - start)
            return closeDatabase(db).then(() =>
               ok({
                  columns,
                  rows,
                  rowCount: rows.length,
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
