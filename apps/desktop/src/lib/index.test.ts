import { describe, it, expect } from "vitest"
import { createTab, createDefaultPaneSizes, createDefaultKeybindings } from "../lib/types"
import { unwrapResult, unwrapAsyncResult, QueryError } from "../lib/query/adapters"
import { ok, err } from "neverthrow"
import { AppError } from "@sqlose/shared"
import { queryKeys } from "../lib/query/keys"

describe("types utilities", () => {
   describe("createTab", () => {
      it("should create a tab with default values", () => {
         const tab = createTab()
         expect(tab.id).toBeDefined()
         expect(tab.type).toBe("query")
         expect(tab.title).toBe("New Query")
         expect(tab.environmentId).toBeNull()
         expect(tab.isDirty).toBe(false)
         expect(tab.isExecuting).toBe(false)
         expect(tab.query).toBe("")
         expect(tab.result).toBeNull()
         expect(tab.error).toBeNull()
         expect(tab.createdAt).toBeDefined()
      })

      it("should create a tab with provided environmentId", () => {
         const tab = createTab("env-123")
         expect(tab.environmentId).toBe("env-123")
      })

      it("should create tabs with unique IDs", () => {
         const tab1 = createTab()
         const tab2 = createTab()
         expect(tab1.id).not.toBe(tab2.id)
      })
   })

   describe("createDefaultPaneSizes", () => {
      it("should return default pane sizes", () => {
         const sizes = createDefaultPaneSizes()
         expect(sizes.sidebarWidth).toBe(280)
         expect(sizes.editorHeight).toBe(300)
         expect(sizes.resultsHeight).toBe(300)
      })
   })

   describe("createDefaultKeybindings", () => {
      it("should return default keybindings", () => {
         const bindings = createDefaultKeybindings()
         expect(Array.isArray(bindings)).toBe(true)
         expect(bindings.length).toBeGreaterThan(0)

         const executeBinding = bindings.find(b => b.action === "query.execute")
         expect(executeBinding).toBeDefined()

         const paletteBinding = bindings.find(b => b.action === "palette.open")
         expect(paletteBinding).toBeDefined()
      })
   })
})

describe("query adapters", () => {
   describe("unwrapResult", () => {
      it("should unwrap Ok result and return value", () => {
         const result = ok({ data: "test" })
         expect(unwrapResult(result)).toEqual({ data: "test" })
      })

      it("should throw error for Err result", () => {
         const appError = new AppError("env:not_found", "Environment not found")
         const result = err(appError)
         expect(() => unwrapResult(result)).toThrow(appError)
      })
   })

   describe("unwrapAsyncResult", () => {
      it("should unwrap async Ok result", async () => {
         const promise = Promise.resolve(ok({ value: 42 }))
         const result = await unwrapAsyncResult(promise)
         expect(result).toEqual({ value: 42 })
      })

      it("should reject with error for async Err result", async () => {
         const appError = new AppError("query:timeout", "Query timed out")
         const promise = Promise.resolve(err(appError))
         await expect(unwrapAsyncResult(promise)).rejects.toThrow(appError)
      })
   })

   describe("QueryError", () => {
      it("should wrap AppError", () => {
         const appError = new AppError("docker:port_conflict", "Port already in use")
         const queryError = new QueryError(appError)

         expect(queryError).toBeInstanceOf(Error)
         expect(queryError.name).toBe("QueryError")
         expect(queryError.code).toBe("docker:port_conflict")
         expect(queryError.message).toBe("Port already in use")
         expect(queryError.appError).toBe(appError)
      })

      describe("fromError", () => {
         it("should convert AppError to QueryError", () => {
            const appError = new AppError("import:parse_failed", "CSV parse error")
            const queryError = QueryError.fromError(appError)

            expect(queryError).toBeInstanceOf(QueryError)
            expect(queryError.code).toBe("import:parse_failed")
         })

         it("should convert regular Error to QueryError", () => {
            const error = new Error("Something went wrong")
            const queryError = QueryError.fromError(error)

            expect(queryError).toBeInstanceOf(QueryError)
            expect(queryError.code).toBe("ipc:invalid_payload")
         })

         it("should convert string error to QueryError", () => {
            const queryError = QueryError.fromError("string error")
            expect(queryError).toBeInstanceOf(QueryError)
            expect(queryError.message).toBe("string error")
         })
      })
   })
})

describe("query keys", () => {
   it("should have environments list key", () => {
      const key = queryKeys.environments.list()
      expect(key).toEqual(["sqlose", "environments", "list"])
   })

   it("should have environments detail key with id", () => {
      const key = queryKeys.environments.detail("env-123")
      expect(key).toEqual(["sqlose", "environments", "detail", "env-123"])
   })

   it("should have environments health key with id", () => {
      const key = queryKeys.environments.health("env-123")
      expect(key).toEqual(["sqlose", "environments", "health", "env-123"])
   })

   it("should have datasets list key", () => {
      const key = queryKeys.datasets.list()
      expect(key).toEqual(["sqlose", "datasets", "list"])
   })

   it("should have query result key", () => {
      const key = queryKeys.query.result("env-1", "abc123")
      expect(key).toEqual(["sqlose", "query", "result", "env-1", "abc123"])
   })
})
