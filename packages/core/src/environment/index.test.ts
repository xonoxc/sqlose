import { describe, it, expect, vi, beforeEach, type Mock } from "vitest"
import { EnvironmentError } from "@sqlose/shared"
import {
   createEnvironmentRecord,
   getEnvironment,
   listEnvironments,
   updateEnvironment,
   destroyEnvironmentRecord,
   duplicateEnvironmentRecord,
   resetEnvironmentRecord,
} from "./index"
import * as store from "./store"

vi.mock("./store", () => ({
   loadEnvironments: vi.fn(),
   loadEnvironment: vi.fn(),
   saveEnvironment: vi.fn(),
   deleteEnvironment: vi.fn(),
}))

describe("Environment Lifecycle", () => {
   beforeEach(() => {
      vi.clearAllMocks()
   })

   describe("createEnvironmentRecord", () => {
      it("should create a new environment record", async () => {
         const result = await createEnvironmentRecord("postgres", "My PG")

         expect(result.isOk()).toBe(true)
         if (result.isOk()) {
            expect(result.value.dbType).toBe("postgres")
            expect(result.value.name).toBe("My PG")
            expect(result.value.status).toBe("creating")
            expect(result.value.id).toContain("env-")
            expect(store.saveEnvironment as Mock).toHaveBeenCalledOnce()
         }
      })

      it("should generate a default name when not provided", async () => {
         const result = await createEnvironmentRecord("mysql")

         expect(result.isOk()).toBe(true)
         if (result.isOk()) {
            expect(result.value.name).toContain("mysql-")
         }
      })

      it("should return error when save fails", async () => {
         ;(store.saveEnvironment as Mock).mockImplementationOnce(() => {
            throw new Error("Save failed")
         })

         const result = await createEnvironmentRecord("postgres")

         expect(result.isErr()).toBe(true)
         if (result.isErr()) {
            expect(result.error).toBeInstanceOf(EnvironmentError)
            expect(result.error.code).toBe("env:create_failed")
         }
      })
   })

   describe("getEnvironment", () => {
      it("should return an environment by id", async () => {
         const mockEnv = { id: "env-1", name: "Test", dbType: "postgres" } as never
         ;(store.loadEnvironment as Mock).mockReturnValue(mockEnv)

         const result = await getEnvironment("env-1")

         expect(result.isOk()).toBe(true)
         if (result.isOk()) {
            expect(result.value.id).toBe("env-1")
         }
      })

      it("should return EnvironmentError when not found", async () => {
         ;(store.loadEnvironment as Mock).mockReturnValue(null)

         const result = await getEnvironment("nonexistent")

         expect(result.isErr()).toBe(true)
         if (result.isErr()) {
            expect(result.error).toBeInstanceOf(EnvironmentError)
            expect(result.error.code).toBe("env:not_found")
         }
      })
   })

   describe("listEnvironments", () => {
      it("should return all environments", async () => {
         const mockEnvs = [{ id: "env-1" }, { id: "env-2" }] as never
         ;(store.loadEnvironments as Mock).mockReturnValue(mockEnvs)

         const result = await listEnvironments()

         expect(result.isOk()).toBe(true)
         if (result.isOk()) {
            expect(result.value).toHaveLength(2)
         }
      })

      it("should return empty array when no environments exist", async () => {
         ;(store.loadEnvironments as Mock).mockReturnValue([])

         const result = await listEnvironments()

         expect(result.isOk()).toBe(true)
         if (result.isOk()) {
            expect(result.value).toEqual([])
         }
      })
   })

   describe("updateEnvironment", () => {
      it("should update an environment", async () => {
         const mockEnv = { id: "env-1", name: "Old Name", status: "creating" }
         ;(store.loadEnvironment as Mock).mockReturnValue(mockEnv as never)

         const result = await updateEnvironment("env-1", { name: "New Name", status: "running" })

         expect(result.isOk()).toBe(true)
         if (result.isOk()) {
            expect(result.value.name).toBe("New Name")
            expect(result.value.status).toBe("running")
         }
         expect(store.saveEnvironment as Mock).toHaveBeenCalledOnce()
      })

      it("should return error when not found", async () => {
         ;(store.loadEnvironment as Mock).mockReturnValue(null)

         const result = await updateEnvironment("nonexistent", { name: "New" })

         expect(result.isErr()).toBe(true)
         if (result.isErr()) {
            expect(result.error.code).toBe("env:not_found")
         }
      })
   })

   describe("destroyEnvironmentRecord", () => {
      it("should destroy an environment", async () => {
         ;(store.loadEnvironment as Mock).mockReturnValue({ id: "env-1" } as never)

         const result = await destroyEnvironmentRecord("env-1")

         expect(result.isOk()).toBe(true)
         expect(store.deleteEnvironment as Mock).toHaveBeenCalledWith("env-1")
      })

      it("should return error when not found", async () => {
         ;(store.loadEnvironment as Mock).mockReturnValue(null)

         const result = await destroyEnvironmentRecord("nonexistent")

         expect(result.isErr()).toBe(true)
         if (result.isErr()) {
            expect(result.error.code).toBe("env:not_found")
         }
      })
   })

   describe("duplicateEnvironmentRecord", () => {
      it("should duplicate an environment", async () => {
         const mockEnv = { id: "env-1", name: "Test", dbType: "postgres" }
         ;(store.loadEnvironment as Mock).mockReturnValue(mockEnv as never)

         const result = await duplicateEnvironmentRecord("env-1")

         expect(result.isOk()).toBe(true)
         if (result.isOk()) {
            expect(result.value.name).toBe("Test (copy)")
            expect(result.value.status).toBe("creating")
            expect(result.value.id).not.toBe("env-1")
         }
         expect(store.saveEnvironment as Mock).toHaveBeenCalledOnce()
      })

      it("should return error when not found", async () => {
         ;(store.loadEnvironment as Mock).mockReturnValue(null)

         const result = await duplicateEnvironmentRecord("nonexistent")

         expect(result.isErr()).toBe(true)
         if (result.isErr()) {
            expect(result.error.code).toBe("env:not_found")
         }
      })
   })

   describe("resetEnvironmentRecord", () => {
      it("should reset an environment", async () => {
         const mockEnv = {
            id: "env-1",
            name: "Test",
            dbType: "postgres",
            status: "error",
            port: 5432,
            containerId: "abc",
         }
         ;(store.loadEnvironment as Mock).mockReturnValue(mockEnv as never)

         const result = await resetEnvironmentRecord("env-1")

         expect(result.isOk()).toBe(true)
         if (result.isOk()) {
            expect(result.value.status).toBe("creating")
            expect(result.value.port).toBe(0)
            expect(result.value.containerId).toBeNull()
            expect(result.value.name).toBe("Test")
         }
         expect(store.saveEnvironment as Mock).toHaveBeenCalledOnce()
      })

      it("should return error when not found", async () => {
         ;(store.loadEnvironment as Mock).mockReturnValue(null)

         const result = await resetEnvironmentRecord("nonexistent")

         expect(result.isErr()).toBe(true)
         if (result.isErr()) {
            expect(result.error.code).toBe("env:not_found")
         }
      })
   })
})
