import { describe, it, expect, beforeEach, vi } from "vitest"

const mockClient = vi.hoisted(() => ({
   connect: vi.fn(),
   query: vi.fn(),
   end: vi.fn(),
}))

vi.mock("pg", () => ({
   default: {
      Client: function Client() {
         return mockClient
      },
   },
}))

import { executePostgresQuery, testPostgresConnection } from "./postgres"

beforeEach(() => {
   mockClient.connect.mockReset()
   mockClient.query.mockReset()
   mockClient.end.mockReset()
})

describe("executePostgresQuery", () => {
   beforeEach(() => {
      mockClient.connect.mockResolvedValue(undefined)
      mockClient.query.mockResolvedValue({
         fields: [{ name: "id" }, { name: "name" }],
         rows: [{ id: 1, name: "test" }],
         rowCount: 1,
      })
      mockClient.end.mockResolvedValue(undefined)
   })

   it("should execute query and return results", async () => {
      const result = await executePostgresQuery(
         "postgresql://localhost:5432/test",
         "SELECT * FROM users"
      )
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
         expect(result.value.columns).toEqual(["id", "name"])
         expect(result.value.rowCount).toBe(1)
      }
   })

   it("should return syntax error for invalid SQL", async () => {
      mockClient.query.mockRejectedValue(new Error("syntax error at or near"))
      const result = await executePostgresQuery(
         "postgresql://localhost:5432/test",
         "SELECT INVALID"
      )
      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
         expect(result.error.code).toBe("query:invalid_syntax")
      }
   })

   it("should return execution error for connection failures", async () => {
      mockClient.query.mockRejectedValue(new Error("Connection refused"))
      const result = await executePostgresQuery("postgresql://localhost:5432/test", "SELECT 1")
      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
         expect(result.error.code).toBe("query:execution_failed")
      }
   })

   it("should handle connection failure", async () => {
      mockClient.connect.mockRejectedValue(new Error("connect ECONNREFUSED"))
      const result = await executePostgresQuery("postgresql://localhost:5432/test", "SELECT 1")
      expect(result.isErr()).toBe(true)
   })
})

describe("testPostgresConnection", () => {
   beforeEach(() => {
      mockClient.connect.mockResolvedValue(undefined)
      mockClient.query.mockResolvedValue({ rows: [{ "?column?": 1 }] })
      mockClient.end.mockResolvedValue(undefined)
   })

   it("should return true for successful connection", async () => {
      const result = await testPostgresConnection("postgresql://localhost:5432/test")
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
         expect(result.value).toBe(true)
      }
   })

   it("should return false for failed connection", async () => {
      mockClient.connect.mockRejectedValue(new Error("Connection failed"))
      const result = await testPostgresConnection("postgresql://localhost:5432/test")
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
         expect(result.value).toBe(false)
      }
   })
})
