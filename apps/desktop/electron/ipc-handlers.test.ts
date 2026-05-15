// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Environment, DBType } from "@sqlose/shared"
import type { IPCSerializedResult } from "./ipc-handlers"

const { mockHandle, mockCore } = vi.hoisted(() => ({
   mockHandle: vi.fn(),
   mockCore: {
      createEnvironment: vi.fn(),
      startEnvironment: vi.fn(),
      stopEnvironment: vi.fn(),
      restartEnvironment: vi.fn(),
      healthCheck: vi.fn(),
      destroyContainer: vi.fn(),
      cleanupOrphans: vi.fn(),
      createEnvironmentRecord: vi.fn(),
      getEnvironment: vi.fn(),
      listEnvironments: vi.fn(),
      updateEnvironment: vi.fn(),
      destroyEnvironmentRecord: vi.fn(),
      duplicateEnvironmentRecord: vi.fn(),
      resetEnvironmentRecord: vi.fn(),
      loadEnvironment: vi.fn(),
      releasePort: vi.fn(),
      executeQuery: vi.fn(),
      importCSV: vi.fn(),
      previewCSV: vi.fn(),
      parseSQLDump: vi.fn(),
      extractTableNames: vi.fn(),
      listDatasets: vi.fn(),
      getDatasetSQL: vi.fn(),
   },
}))

vi.mock("electron", () => ({
   ipcMain: { handle: mockHandle },
}))

vi.mock("@sqlose/core", () => mockCore)

const { registerAllHandlers } = await import("./ipc-handlers")

function makeEnv(overrides: Partial<Environment> = {}): Environment {
   return {
      id: "env-1",
      name: "test-env",
      dbType: "postgres",
      status: "running",
      port: 5432,
      uptime: 100,
      connectionString: "postgresql://localhost:5432/sqlose",
      containerId: "container-1",
      createdAt: "2025-01-01T00:00:00Z",
      ...overrides,
   }
}

const mockOk = <T>(value: T) =>
   Promise.resolve({ isOk: () => true, isErr: () => false, value, error: undefined })
const mockErr = (code: string, message = "something went wrong") =>
   Promise.resolve({
      isOk: () => false,
      isErr: () => true,
      error: { code, message, name: "AppError" },
      value: undefined,
   })

type HandlerFn = (event: unknown, payload: unknown) => Promise<IPCSerializedResult<unknown>>
let handlers: Record<string, HandlerFn>

beforeEach(() => {
   vi.clearAllMocks()
   handlers = {}
   mockHandle.mockImplementation((_channel: string, handler: HandlerFn) => {
      handlers[_channel] = handler
   })
   registerAllHandlers()
})

describe("registerAllHandlers", () => {
   it("should register handlers for all IPC channels", () => {
      const channels = Object.keys(handlers)
      expect(channels).toContain("docker:start-env")
      expect(channels).toContain("docker:stop-env")
      expect(channels).toContain("docker:restart-env")
      expect(channels).toContain("docker:health")
      expect(channels).toContain("docker:cleanup")
      expect(channels).toContain("env:create")
      expect(channels).toContain("env:destroy")
      expect(channels).toContain("env:list")
      expect(channels).toContain("env:get")
      expect(channels).toContain("env:duplicate")
      expect(channels).toContain("env:reset")
      expect(channels).toContain("query:execute")
      expect(channels).toContain("import:csv")
      expect(channels).toContain("import:sql")
      expect(channels).toContain("import:preview-csv")
      expect(channels).toContain("dataset:list")
      expect(channels).toContain("dataset:import")
   })
})

describe("payload validation", () => {
   const channelsRequiringEnvId = [
      "docker:start-env",
      "docker:stop-env",
      "docker:restart-env",
      "docker:health",
      "env:destroy",
      "env:get",
      "env:duplicate",
      "env:reset",
   ] as const

   for (const channel of channelsRequiringEnvId) {
      it(`${channel} should reject missing environmentId`, async () => {
         const result = (await handlers[channel](null, {})) as IPCSerializedResult<unknown>
         expect(result.success).toBe(false)
         if (!result.success) {
            expect(result.error.code).toBe("ipc:invalid_payload")
         }
      })

      it(`${channel} should reject null payload`, async () => {
         const result = (await handlers[channel](null, null)) as IPCSerializedResult<unknown>
         expect(result.success).toBe(false)
         if (!result.success) {
            expect(result.error.code).toBe("ipc:invalid_payload")
         }
      })
   }

   it("query:execute should reject missing sql", async () => {
      const result = (await handlers["query:execute"](null, {
         environmentId: "env-1",
      })) as IPCSerializedResult<unknown>
      expect(result.success).toBe(false)
      if (!result.success) {
         expect(result.error.code).toBe("ipc:invalid_payload")
      }
   })

   it("env:create should reject invalid dbType", async () => {
      const result = (await handlers["env:create"](null, {
         dbType: "mongodb",
      })) as IPCSerializedResult<unknown>
      expect(result.success).toBe(false)
      if (!result.success) {
         expect(result.error.code).toBe("ipc:invalid_payload")
      }
   })
})

describe("docker:start-env", () => {
   it("should return error if environment not found", async () => {
      mockCore.loadEnvironment.mockReturnValue(null)
      const result = (await handlers["docker:start-env"](null, {
         environmentId: "nonexistent",
      })) as IPCSerializedResult<unknown>
      expect(result.success).toBe(false)
      if (!result.success) expect(result.error.code).toBe("env:not_found")
   })

   it("should start container and return env info", async () => {
      const env = makeEnv()
      mockCore.loadEnvironment.mockReturnValue(env)
      mockCore.startEnvironment.mockReturnValue(mockOk(undefined))
      mockCore.healthCheck.mockReturnValue(mockOk({ healthy: true, uptime: 200 }))
      mockCore.updateEnvironment.mockReturnValue(mockOk(env))

      const result = (await handlers["docker:start-env"](null, {
         environmentId: "env-1",
      })) as IPCSerializedResult<{ environmentId: string; port: number; connectionString: string }>

      expect(result.success).toBe(true)
      if (result.success) {
         expect(result.data.environmentId).toBe("env-1")
         expect(result.data.port).toBe(5432)
      }
   })

   it("should handle sqlite (no container needed)", async () => {
      const env = makeEnv({ dbType: "sqlite", port: 0, containerId: "" })
      mockCore.loadEnvironment.mockReturnValue(env)
      mockCore.updateEnvironment.mockReturnValue(mockOk(env))

      const result = (await handlers["docker:start-env"](null, {
         environmentId: "env-1",
      })) as IPCSerializedResult<unknown>
      expect(result.success).toBe(true)
      expect(mockCore.startEnvironment).not.toHaveBeenCalled()
   })

   it("should forward Docker errors", async () => {
      mockCore.loadEnvironment.mockReturnValue(makeEnv())
      mockCore.startEnvironment.mockReturnValue(mockErr("docker:container_failed"))

      const result = (await handlers["docker:start-env"](null, {
         environmentId: "env-1",
      })) as IPCSerializedResult<unknown>
      expect(result.success).toBe(false)
      if (!result.success) expect(result.error.code).toBe("docker:container_failed")
   })
})

describe("docker:stop-env", () => {
   it("should stop container and update status", async () => {
      mockCore.loadEnvironment.mockReturnValue(makeEnv())
      mockCore.stopEnvironment.mockReturnValue(mockOk(undefined))
      mockCore.updateEnvironment.mockReturnValue(mockOk(makeEnv({ status: "stopped" })))

      const result = (await handlers["docker:stop-env"](null, {
         environmentId: "env-1",
      })) as IPCSerializedResult<unknown>
      expect(result.success).toBe(true)
      expect(mockCore.stopEnvironment).toHaveBeenCalledWith("container-1")
   })

   it("should handle sqlite", async () => {
      mockCore.loadEnvironment.mockReturnValue(makeEnv({ dbType: "sqlite", containerId: "" }))
      mockCore.updateEnvironment.mockReturnValue(mockOk(makeEnv({ status: "stopped" })))

      const result = (await handlers["docker:stop-env"](null, {
         environmentId: "env-1",
      })) as IPCSerializedResult<unknown>
      expect(result.success).toBe(true)
      expect(mockCore.stopEnvironment).not.toHaveBeenCalled()
   })
})

describe("docker:restart-env", () => {
   it("should restart container and update status", async () => {
      mockCore.loadEnvironment.mockReturnValue(makeEnv())
      mockCore.restartEnvironment.mockReturnValue(mockOk(undefined))
      mockCore.updateEnvironment.mockReturnValue(mockOk(makeEnv()))

      const result = (await handlers["docker:restart-env"](null, {
         environmentId: "env-1",
      })) as IPCSerializedResult<unknown>
      expect(result.success).toBe(true)
      expect(mockCore.restartEnvironment).toHaveBeenCalledWith("container-1")
   })
})

describe("docker:health", () => {
   it("should return health status", async () => {
      mockCore.loadEnvironment.mockReturnValue(makeEnv())
      mockCore.healthCheck.mockReturnValue(mockOk({ healthy: true, uptime: 300 }))

      const result = (await handlers["docker:health"](null, {
         environmentId: "env-1",
      })) as IPCSerializedResult<{ healthy: boolean; uptime: number }>
      expect(result.success).toBe(true)
      if (result.success) {
         expect(result.data.healthy).toBe(true)
         expect(result.data.uptime).toBe(300)
      }
   })

   it("should return healthy for sqlite", async () => {
      mockCore.loadEnvironment.mockReturnValue(makeEnv({ dbType: "sqlite", containerId: "" }))
      const result = (await handlers["docker:health"](null, {
         environmentId: "env-1",
      })) as IPCSerializedResult<{ healthy: boolean; uptime: number }>
      expect(result.success).toBe(true)
      if (result.success) {
         expect(result.data.healthy).toBe(true)
      }
   })
})

describe("docker:cleanup", () => {
   it("should return cleaned count", async () => {
      mockCore.cleanupOrphans.mockReturnValue(mockOk(3))

      const result = (await handlers["docker:cleanup"](null, {})) as IPCSerializedResult<{
         cleaned: number
      }>
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.cleaned).toBe(3)
   })

   it("should forward errors", async () => {
      mockCore.cleanupOrphans.mockReturnValue(mockErr("docker:cleanup_failed"))
      const result = (await handlers["docker:cleanup"](null, {})) as IPCSerializedResult<unknown>
      expect(result.success).toBe(false)
      if (!result.success) expect(result.error.code).toBe("docker:cleanup_failed")
   })
})

describe("env:create", () => {
   it("should create environment record (postgres — no container yet)", async () => {
      const env = makeEnv({ status: "creating", port: 0, containerId: null, connectionString: "" })
      mockCore.createEnvironmentRecord.mockReturnValue(mockOk(env))

      const result = (await handlers["env:create"](null, {
         dbType: "postgres" as DBType,
      })) as IPCSerializedResult<Environment>
      expect(result.success).toBe(true)
      if (result.success) {
         expect(result.data.status).toBe("creating")
      }
      expect(mockCore.createEnvironmentRecord).toHaveBeenCalledWith("postgres", undefined)
   })
})

describe("docker:create-container", () => {
   it("should create Docker container and update environment", async () => {
      const env = makeEnv({ status: "creating", port: 0, containerId: null, connectionString: "" })
      const dockerResult = {
         port: 5432,
         containerId: "container-1",
         connectionString: "postgresql://localhost:5432/sqlose",
      }
      const updatedEnv = makeEnv()

      mockCore.loadEnvironment.mockReturnValue(env)
      mockCore.createEnvironment.mockReturnValue(mockOk(dockerResult))
      mockCore.healthCheck.mockReturnValue(mockOk({ healthy: true, uptime: 0 }))
      mockCore.updateEnvironment.mockReturnValue(mockOk(updatedEnv))

      const result = (await handlers["docker:create-container"](null, {
         environmentId: "env-1",
      })) as IPCSerializedResult<Environment>
      expect(result.success).toBe(true)
      if (result.success) {
         expect(result.data.status).toBe("running")
      }
      expect(mockCore.createEnvironment).toHaveBeenCalledWith("postgres")
   })

   it("should destroy record if Docker creation fails", async () => {
      const env = makeEnv({ id: "env-1", status: "creating" })
      mockCore.loadEnvironment.mockReturnValue(env)
      mockCore.createEnvironment.mockReturnValue(
         mockErr("docker:container_failed", "port conflict")
      )

      await handlers["docker:create-container"](null, { environmentId: "env-1" })
      expect(mockCore.destroyEnvironmentRecord).toHaveBeenCalledWith("env-1")
   })
})

describe("env:destroy", () => {
   it("should destroy container and environment record", async () => {
      mockCore.loadEnvironment.mockReturnValue(makeEnv())
      mockCore.destroyContainer.mockReturnValue(mockOk(undefined))

      const result = (await handlers["env:destroy"](null, {
         environmentId: "env-1",
      })) as IPCSerializedResult<unknown>
      expect(result.success).toBe(true)
      expect(mockCore.destroyContainer).toHaveBeenCalledWith("container-1")
      expect(mockCore.destroyEnvironmentRecord).toHaveBeenCalledWith("env-1")
   })

   it("should release port when destroying", async () => {
      mockCore.loadEnvironment.mockReturnValue(makeEnv({ port: 5432 }))
      mockCore.destroyContainer.mockReturnValue(mockOk(undefined))

      await handlers["env:destroy"](null, { environmentId: "env-1" })
      expect(mockCore.releasePort).toHaveBeenCalledWith(5432)
   })
})

describe("env:list", () => {
   it("should return list of environments", async () => {
      const envs = [makeEnv()]
      mockCore.listEnvironments.mockReturnValue(mockOk(envs))

      const result = (await handlers["env:list"](null, {})) as IPCSerializedResult<Environment[]>
      expect(result.success).toBe(true)
      if (result.success) expect(result.data).toEqual(envs)
   })
})

describe("env:get", () => {
   it("should return a single environment", async () => {
      const env = makeEnv()
      mockCore.getEnvironment.mockReturnValue(mockOk(env))

      const result = (await handlers["env:get"](null, {
         environmentId: "env-1",
      })) as IPCSerializedResult<Environment>
      expect(result.success).toBe(true)
      if (result.success) expect(result.data).toEqual(env)
   })
})

describe("env:duplicate", () => {
   it("should duplicate environment record", async () => {
      const dupe = makeEnv({ id: "env-2", name: "test-env (copy)" })
      mockCore.duplicateEnvironmentRecord.mockReturnValue(mockOk(dupe))

      const result = (await handlers["env:duplicate"](null, {
         environmentId: "env-1",
      })) as IPCSerializedResult<Environment>
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.id).toBe("env-2")
   })
})

describe("env:reset", () => {
   it("should reset environment record", async () => {
      const reset = makeEnv({ status: "creating", port: 0, containerId: null })
      mockCore.resetEnvironmentRecord.mockReturnValue(mockOk(reset))

      const result = (await handlers["env:reset"](null, {
         environmentId: "env-1",
      })) as IPCSerializedResult<Environment>
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.status).toBe("creating")
   })
})

describe("query:execute", () => {
   it("should execute query and return results", async () => {
      const queryResult = {
         columns: ["id", "name"],
         rows: [{ id: 1, name: "test" }],
         rowCount: 1,
         executionTimeMs: 10,
      }
      mockCore.executeQuery.mockReturnValue(mockOk(queryResult))

      const result = (await handlers["query:execute"](null, {
         environmentId: "env-1",
         sql: "SELECT * FROM test",
      })) as IPCSerializedResult<unknown>
      expect(result.success).toBe(true)
      if (result.success) expect(result.data).toEqual(queryResult)
   })

   it("should forward query errors", async () => {
      mockCore.executeQuery.mockReturnValue(mockErr("query:execution_failed", "syntax error"))
      const result = (await handlers["query:execute"](null, {
         environmentId: "env-1",
         sql: "BAD SQL",
      })) as IPCSerializedResult<unknown>
      expect(result.success).toBe(false)
      if (!result.success) expect(result.error.message).toBe("syntax error")
   })
})

describe("import:csv", () => {
   it("should parse CSV and return import result", async () => {
      const importResult = { tableName: "my_table", rowCount: 3, columns: ["id", "name"] }
      mockCore.importCSV.mockReturnValue(mockOk(importResult))

      const result = (await handlers["import:csv"](null, {
         environmentId: "env-1",
         fileName: "data.csv",
         content: "id,name\n1,foo",
         format: "csv",
      })) as IPCSerializedResult<unknown>

      expect(result.success).toBe(true)
      if (result.success) expect(result.data).toEqual(importResult)
   })

   it("should reject missing fields", async () => {
      const result = (await handlers["import:csv"](null, {
         environmentId: "env-1",
      })) as IPCSerializedResult<unknown>
      expect(result.success).toBe(false)
   })
})

describe("import:sql", () => {
   it("should parse SQL dump and return table names", async () => {
      mockCore.parseSQLDump.mockReturnValue(
         mockOk([{ type: "create", sql: "CREATE TABLE t (id INT)" }])
      )
      mockCore.extractTableNames.mockReturnValue(["t"])

      const result = (await handlers["import:sql"](null, {
         environmentId: "env-1",
         fileName: "dump.sql",
         content: "CREATE TABLE t (id INT);",
         format: "sql",
      })) as IPCSerializedResult<{ tablesCreated: string[] }>

      expect(result.success).toBe(true)
      if (result.success) expect(result.data.tablesCreated).toEqual(["t"])
   })
})

describe("import:preview-csv", () => {
   it("should preview CSV content", async () => {
      const preview = { columns: ["id", "name"], preview: [{ id: "1", name: "foo" }] }
      mockCore.previewCSV.mockReturnValue(mockOk(preview))

      const result = (await handlers["import:preview-csv"](null, {
         content: "id,name\n1,foo",
      })) as IPCSerializedResult<unknown>
      expect(result.success).toBe(true)
      if (result.success) expect(result.data).toEqual(preview)
   })
})

describe("dataset:list", () => {
   it("should return datasets", async () => {
      const datasets = [
         {
            id: "ds-1",
            name: "Test",
            description: "desc",
            category: "ecommerce",
            dbTypes: ["postgres"],
         },
      ]
      mockCore.listDatasets.mockReturnValue(mockOk(datasets))

      const result = (await handlers["dataset:list"](null, {})) as IPCSerializedResult<unknown>
      expect(result.success).toBe(true)
      if (result.success) expect(result.data).toEqual(datasets)
   })
})

describe("dataset:import", () => {
   it("should import dataset SQL into environment", async () => {
      const sql = "CREATE TABLE t (id INT); INSERT INTO t VALUES (1);"
      mockCore.getDatasetSQL.mockReturnValue(mockOk(sql))
      mockCore.loadEnvironment.mockReturnValue(makeEnv())
      mockCore.parseSQLDump.mockReturnValue(
         mockOk([
            { type: "create", sql: "CREATE TABLE t (id INT)" },
            { type: "insert", sql: "INSERT INTO t VALUES (1)" },
         ])
      )
      mockCore.extractTableNames.mockReturnValue(["t"])
      mockCore.executeQuery.mockReturnValue(
         mockOk({ columns: [], rows: [], rowCount: 0, executionTimeMs: 1 })
      )

      const result = (await handlers["dataset:import"](null, {
         datasetId: "ds-1",
         environmentId: "env-1",
      })) as IPCSerializedResult<{ tablesCreated: string[] }>
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.tablesCreated).toEqual(["t"])
      expect(mockCore.executeQuery).toHaveBeenCalledTimes(2)
   })

   it("should reject missing environment", async () => {
      mockCore.getDatasetSQL.mockReturnValue(mockOk("SELECT 1"))
      mockCore.loadEnvironment.mockReturnValue(null)

      const result = (await handlers["dataset:import"](null, {
         datasetId: "ds-1",
         environmentId: "env-nonexistent",
      })) as IPCSerializedResult<unknown>
      expect(result.success).toBe(false)
      if (!result.success) expect(result.error.code).toBe("env:not_found")
   })
})
