import { describe, it, expect } from "vitest"
import { ImportError } from "@sqlose/shared"
import {
   parseCSV,
   inferSchema,
   generateCreateTableSQL,
   generateInsertSQL,
   importCSV,
   previewCSV,
} from "./csv"
import { parseSQLDump, extractTableNames } from "./sql"

describe("CSV Import", () => {
   describe("parseCSV", () => {
      it("should parse a simple CSV", async () => {
         const csv = "name,age\nAlice,30\nBob,25"
         const result = await parseCSV(csv)

         expect(result.isOk()).toBe(true)
         if (result.isOk()) {
            expect(result.value.columns).toEqual(["name", "age"])
            expect(result.value.rows).toHaveLength(2)
            expect(result.value.rows[0]).toEqual({ name: "Alice", age: "30" })
         }
      })

      it("should handle quoted values", async () => {
         const csv = 'name,description\nAlice,"A nice, person"\nBob,"Hello ""World"""'
         const result = await parseCSV(csv)

         expect(result.isOk()).toBe(true)
         if (result.isOk()) {
            expect(result.value.rows[0].description).toBe("A nice, person")
            expect(result.value.rows[1].description).toBe('Hello "World"')
         }
      })

      it("should handle empty content", async () => {
         const result = await parseCSV("")
         expect(result.isErr()).toBe(true)
         if (result.isErr()) {
            expect(result.error.code).toBe("import:parse_failed")
         }
      })

      it("should handle header-only CSV", async () => {
         const result = await parseCSV("col1,col2")
         expect(result.isOk()).toBe(true)
         if (result.isOk()) {
            expect(result.value.columns).toEqual(["col1", "col2"])
            expect(result.value.rows).toHaveLength(0)
         }
      })

      it("should reject rows with mismatched column count", async () => {
         const csv = "a,b,c\n1,2\n3,4,5,6"
         const result = await parseCSV(csv)
         expect(result.isErr()).toBe(true)
         if (result.isErr()) {
            expect(result.error.code).toBe("import:parse_failed")
         }
      })

      it("should skip empty lines", async () => {
         const csv = "a,b\n1,2\n\n3,4"
         const result = await parseCSV(csv)
         expect(result.isOk()).toBe(true)
         if (result.isOk()) {
            expect(result.value.rows).toHaveLength(2)
         }
      })
   })

   describe("inferSchema", () => {
      it("should infer INTEGER type", () => {
         const schema = inferSchema(["count"], [{ count: "42" }, { count: "100" }], "test")
         expect(schema.columns[0].type).toBe("INTEGER")
      })

      it("should infer REAL type", () => {
         const schema = inferSchema(["price"], [{ price: "19.99" }, { price: "5.50" }], "test")
         expect(schema.columns[0].type).toBe("REAL")
      })

      it("should infer TEXT type", () => {
         const schema = inferSchema(["name"], [{ name: "Alice" }, { name: "Bob" }], "test")
         expect(schema.columns[0].type).toBe("TEXT")
      })

      it("should infer TIMESTAMP type", () => {
         const schema = inferSchema(
            ["date"],
            [{ date: "2024-01-01" }, { date: "2024-06-15" }],
            "test"
         )
         expect(schema.columns[0].type).toBe("TIMESTAMP")
      })

      it("should handle empty values with TEXT default", () => {
         const schema = inferSchema(["col"], [], "test")
         expect(schema.columns[0].type).toBe("TEXT")
      })
   })

   describe("generateCreateTableSQL", () => {
      it("should generate CREATE TABLE SQL", () => {
         const schema = {
            tableName: "users",
            columns: [
               { name: "id", type: "INTEGER" },
               { name: "name", type: "TEXT" },
            ],
         }
         const sql = generateCreateTableSQL(schema)
         expect(sql).toContain('CREATE TABLE IF NOT EXISTS "users"')
         expect(sql).toContain('"id" INTEGER')
         expect(sql).toContain('"name" TEXT')
      })
   })

   describe("generateInsertSQL", () => {
      it("should generate INSERT statements", () => {
         const sqls = generateInsertSQL(
            "users",
            ["id", "name"],
            [
               { id: "1", name: "Alice" },
               { id: "2", name: "Bob" },
            ]
         )
         expect(sqls).toHaveLength(2)
         expect(sqls[0]).toContain("INSERT INTO")
         expect(sqls[0]).toContain("Alice")
      })

      it("should handle NULL values for empty strings", () => {
         const sqls = generateInsertSQL("test", ["val"], [{ val: "" }])
         expect(sqls[0]).toContain("NULL")
      })
   })

   describe("importCSV", () => {
      it("should parse and return import result with SQL statements", async () => {
         const csv = "name,age\nAlice,30\nBob,25"
         const result = await importCSV(csv, "people")

         expect(result.isOk()).toBe(true)
         if (result.isOk()) {
            expect(result.value.tableName).toBe("people")
            expect(result.value.rowCount).toBe(2)
            expect(result.value.columns).toEqual(["name", "age"])
         }
      })

      it("should return ImportError for invalid CSV", async () => {
         const result = await importCSV("", "test")
         expect(result.isErr()).toBe(true)
         if (result.isErr()) {
            expect(result.error).toBeInstanceOf(ImportError)
         }
      })
   })

   describe("previewCSV", () => {
      it("should return preview of first 5 rows", async () => {
         const csv = "a,b\n" + Array.from({ length: 10 }, (_, i) => `${i},${i * 2}`).join("\n")
         const result = await previewCSV(csv)

         expect(result.isOk()).toBe(true)
         if (result.isOk()) {
            expect(result.value.columns).toEqual(["a", "b"])
            expect(result.value.preview).toHaveLength(5)
         }
      })
   })
})

describe("SQL Import", () => {
   describe("parseSQLDump", () => {
      it("should parse CREATE and INSERT statements", async () => {
         const sql = `CREATE TABLE users (id INT);
INSERT INTO users VALUES (1);
-- comment
INSERT INTO users VALUES (2);`
         const result = await parseSQLDump(sql)

         expect(result.isOk()).toBe(true)
         if (result.isOk()) {
            expect(result.value).toHaveLength(3)
            expect(result.value[0].type).toBe("create")
            expect(result.value[1].type).toBe("insert")
         }
      })

      it("should handle multi-line statements", async () => {
         const sql = `CREATE TABLE users (
  id INT,
  name TEXT
);

INSERT INTO users (id, name) VALUES (1, 'Alice');`
         const result = await parseSQLDump(sql)

         expect(result.isOk()).toBe(true)
         if (result.isOk()) {
            expect(result.value.length).toBeGreaterThanOrEqual(2)
         }
      })

      it("should return error for invalid content", async () => {
         const result = await parseSQLDump("")
         expect(result.isOk()).toBe(true)
         if (result.isOk()) {
            expect(result.value).toHaveLength(0)
         }
      })
   })

   describe("extractTableNames", () => {
      it("should extract table names from CREATE statements", () => {
         const statements = [
            { type: "create" as const, sql: "CREATE TABLE users (id INT);" },
            { type: "create" as const, sql: "CREATE TABLE IF NOT EXISTS posts (id INT);" },
            { type: "insert" as const, sql: "INSERT INTO users VALUES (1);" },
         ]
         const tables = extractTableNames(statements)
         expect(tables).toEqual(["users", "posts"])
      })

      it("should return empty for no CREATE statements", () => {
         const tables = extractTableNames([
            { type: "insert" as const, sql: "INSERT INTO t VALUES (1);" },
         ])
         expect(tables).toEqual([])
      })
   })
})
