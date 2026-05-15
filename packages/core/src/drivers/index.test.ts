import { describe, it, expect, vi } from "vitest"
import { executeQueryForDB } from "./index"

vi.mock("./postgres", () => ({
   executePostgresQuery: vi.fn(() =>
      Promise.resolve({
         isOk: () => true,
         value: { columns: ["id"], rows: [{ id: 1 }], rowCount: 1, executionTimeMs: 5 },
      })
   ),
}))

vi.mock("./mysql", () => ({
   executeMySQLQuery: vi.fn(() =>
      Promise.resolve({
         isOk: () => true,
         value: { columns: ["id"], rows: [{ id: 1 }], rowCount: 1, executionTimeMs: 5 },
      })
   ),
}))

vi.mock("./sqlite", () => ({
   executeSQLiteQuery: vi.fn(() =>
      Promise.resolve({
         isOk: () => true,
         value: { columns: ["id"], rows: [{ id: 1 }], rowCount: 1, executionTimeMs: 5 },
      })
   ),
}))

describe("executeQueryForDB", () => {
   it("should route to postgres driver", async () => {
      const result = await executeQueryForDB("postgres", "conn-string", "SELECT 1")
      expect(result.isOk()).toBe(true)
   })

   it("should route to mysql driver", async () => {
      const result = await executeQueryForDB("mysql", "conn-string", "SELECT 1")
      expect(result.isOk()).toBe(true)
   })

   it("should route to sqlite driver", async () => {
      const result = await executeQueryForDB("sqlite", "conn-string", "SELECT 1")
      expect(result.isOk()).toBe(true)
   })

   it("should return error for unsupported db type", async () => {
      const result = await executeQueryForDB("mongodb" as never, "conn-string", "SELECT 1")
      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr().code).toBe("query:execution_failed")
   })
})
