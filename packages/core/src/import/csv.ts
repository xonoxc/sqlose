import { ok, err } from "neverthrow"
import { ImportError } from "@sqlose/shared"
import type { ImportResult, AsyncAppResult } from "@sqlose/shared"

export interface CSVParsed {
   columns: string[]
   rows: Record<string, string>[]
}

export interface InferredSchema {
   tableName: string
   columns: { name: string; type: string }[]
}

export function parseCSV(content: string): AsyncAppResult<CSVParsed> {
   if (!content || content.trim().length === 0) {
      return Promise.resolve(err(new ImportError("import:parse_failed", "CSV has no content")))
   }

   const lines = content
      .trim()
      .split("\n")
      .filter(l => l.trim().length > 0)

   if (lines.length < 1) {
      return Promise.resolve(err(new ImportError("import:parse_failed", "CSV has no content")))
   }

   const columns = parseCSVLine(lines[0])
   if (columns.length === 0) {
      return Promise.resolve(err(new ImportError("import:parse_failed", "CSV has no columns")))
   }

   const rows: Record<string, string>[] = []
   for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      if (values.length === 0) continue
      if (values.length !== columns.length) {
         return Promise.resolve(
            err(
               new ImportError(
                  "import:parse_failed",
                  `Row ${i + 1} has ${values.length} values but expected ${columns.length}`
               )
            )
         )
      }
      const row: Record<string, string> = {}
      columns.forEach((col, idx) => {
         row[col] = values[idx]?.trim() ?? ""
      })
      rows.push(row)
   }

   return Promise.resolve(ok({ columns, rows }))
}

function parseCSVLine(line: string): string[] {
   const result: string[] = []
   let current = ""
   let inQuotes = false

   for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
         if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
            current += '"'
            i++
         } else {
            inQuotes = !inQuotes
         }
      } else if (char === "," && !inQuotes) {
         result.push(current)
         current = ""
      } else {
         current += char
      }
   }
   result.push(current)

   return result
}

export function inferSchema(
   columns: string[],
   rows: Record<string, string>[],
   tableName: string
): InferredSchema {
   const schema: InferredSchema = { tableName, columns: [] }

   for (const col of columns) {
      const values = rows.map(r => r[col]).filter(v => v !== "")
      const colType = inferColumnType(values)
      schema.columns.push({ name: col, type: colType })
   }

   return schema
}

function inferColumnType(values: string[]): string {
   if (values.length === 0) return "TEXT"

   const ints = values.every(v => /^-?\d+$/.test(v.trim()))
   if (ints) return "INTEGER"

   const floats = values.every(v => /^-?\d+\.?\d*$/.test(v.trim()))
   if (floats) return "REAL"

   const dates = values.every(v => !isNaN(Date.parse(v)))
   if (dates) return "TIMESTAMP"

   return "TEXT"
}

export function generateCreateTableSQL(schema: InferredSchema): string {
   const colDefs = schema.columns.map(c => `"${c.name}" ${c.type}`).join(",\n   ")
   return `CREATE TABLE IF NOT EXISTS "${schema.tableName}" (\n   ${colDefs}\n);`
}

export function generateInsertSQL(
   tableName: string,
   columns: string[],
   rows: Record<string, string>[]
): string[] {
   return rows.map(row => {
      const values = columns.map(col => {
         const val = row[col] ?? ""
         return escapeSQLValue(val)
      })
      return `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(", ")}) VALUES (${values.join(", ")});`
   })
}

function escapeSQLValue(value: string): string {
   if (value === "") return "NULL"
   const num = Number(value)
   if (!isNaN(num) && value.trim() !== "") return value
   return `'${value.replace(/'/g, "''")}'`
}

export function importCSV(content: string, tableName: string): AsyncAppResult<ImportResult> {
   return parseCSV(content).then(parseResult => {
      if (parseResult.isErr()) return err(parseResult.error)

      const { columns, rows } = parseResult.value

      return ok({
         tableName,
         rowCount: rows.length,
         columns,
      } as ImportResult)
   })
}

export function previewCSV(
   content: string
): AsyncAppResult<{ columns: string[]; preview: Record<string, string>[] }> {
   return parseCSV(content).then(parseResult => {
      if (parseResult.isErr()) return err(parseResult.error)

      const { columns, rows } = parseResult.value
      return ok({
         columns,
         preview: rows.slice(0, 5),
      })
   })
}
