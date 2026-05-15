import { describe, it, expect, afterEach, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import {
   useEnvironments,
   useDatasets,
   useCreateEnvironment,
   useDestroyEnvironment,
   useExecuteQuery,
   useImportCSV,
   usePreviewCSV,
   useEnvironmentDetail,
   useStartEnvironment,
   useStopEnvironment,
   useRestartEnvironment,
   useImportSQL,
   useImportDataset,
} from "./hooks"

const queryClient = new QueryClient({
   defaultOptions: { queries: { retry: false } },
})

function Wrapper({ children }: { children: ReactNode }) {
   return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

function mockSqlose() {
   const mock = {
      docker: {
         startEnv: vi
            .fn()
            .mockResolvedValue({
               success: true,
               data: { environmentId: "env-1", port: 5432, connectionString: "postgresql://..." },
            }),
         stopEnv: vi.fn().mockResolvedValue({ success: true, data: {} }),
         restartEnv: vi.fn().mockResolvedValue({ success: true, data: {} }),
         health: vi.fn().mockResolvedValue({ success: true, data: { healthy: true, uptime: 120 } }),
         cleanup: vi.fn(),
      },
      env: {
         create: vi
            .fn()
            .mockResolvedValue({
               success: true,
               data: {
                  id: "env-1",
                  name: "test",
                  dbType: "postgres",
                  status: "running",
                  port: 5432,
                  uptime: 120,
                  connectionString: "postgresql://localhost:5432/sqlose",
                  containerId: "container-1",
                  createdAt: "2025-01-01T00:00:00Z",
               },
            }),
         destroy: vi.fn().mockResolvedValue({ success: true, data: {} }),
         list: vi.fn().mockResolvedValue({ success: true, data: [] }),
         get: vi
            .fn()
            .mockResolvedValue({
               success: true,
               data: {
                  id: "env-1",
                  name: "test",
                  dbType: "postgres",
                  status: "running",
                  port: 5432,
                  uptime: 120,
                  connectionString: "postgresql://localhost:5432/sqlose",
                  containerId: "container-1",
                  createdAt: "2025-01-01T00:00:00Z",
               },
            }),
         duplicate: vi.fn(),
         reset: vi.fn(),
      },
      query: {
         execute: vi
            .fn()
            .mockResolvedValue({
               success: true,
               data: { columns: ["id"], rows: [], rowCount: 0, executionTimeMs: 5 },
            }),
      },
      import: {
         csv: vi
            .fn()
            .mockResolvedValue({
               success: true,
               data: { tableName: "users", rowCount: 5, columns: ["id", "name"] },
            }),
         sql: vi.fn().mockResolvedValue({ success: true, data: { tablesCreated: ["users"] } }),
         previewCSV: vi
            .fn()
            .mockResolvedValue({
               success: true,
               data: { columns: ["id"], preview: [{ id: "1" }] },
            }),
      },
      dataset: {
         list: vi.fn().mockResolvedValue({ success: true, data: [] }),
         import: vi
            .fn()
            .mockResolvedValue({ success: true, data: { tablesCreated: ["products"] } }),
      },
   }
   ;(window as unknown as Record<string, unknown>).sqlose = mock
}

beforeEach(() => {
   mockSqlose()
})

afterEach(() => {
   queryClient.clear()
})

describe("useEnvironments", () => {
   it("should return environments list", async () => {
      const { result } = renderHook(() => useEnvironments(), { wrapper: Wrapper })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toBeDefined()
   })
})

describe("useEnvironmentDetail", () => {
   it("should return null when no id provided", () => {
      const { result } = renderHook(() => useEnvironmentDetail(null), { wrapper: Wrapper })
      expect(result.current.isPending).toBe(true)
   })
})

describe("useDatasets", () => {
   it("should return dataset list", async () => {
      const { result } = renderHook(() => useDatasets(), { wrapper: Wrapper })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toBeDefined()
   })
})

describe("useCreateEnvironment", () => {
   it("should create environment", async () => {
      const { result } = renderHook(() => useCreateEnvironment(), { wrapper: Wrapper })
      result.current.mutate({ dbType: "postgres", name: "test" })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
   })
})

describe("useDestroyEnvironment", () => {
   it("should destroy environment", async () => {
      const { result } = renderHook(() => useDestroyEnvironment(), { wrapper: Wrapper })
      result.current.mutate("env-1")
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
   })
})

describe("useStartEnvironment", () => {
   it("should start environment", async () => {
      const { result } = renderHook(() => useStartEnvironment(), { wrapper: Wrapper })
      result.current.mutate("env-1")
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
   })
})

describe("useStopEnvironment", () => {
   it("should stop environment", async () => {
      const { result } = renderHook(() => useStopEnvironment(), { wrapper: Wrapper })
      result.current.mutate("env-1")
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
   })
})

describe("useRestartEnvironment", () => {
   it("should restart environment", async () => {
      const { result } = renderHook(() => useRestartEnvironment(), { wrapper: Wrapper })
      result.current.mutate("env-1")
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
   })
})

describe("useExecuteQuery", () => {
   it("should execute query", async () => {
      const { result } = renderHook(() => useExecuteQuery(), { wrapper: Wrapper })
      result.current.mutate({ environmentId: "env-1", sql: "SELECT 1" })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
   })
})

describe("useImportCSV", () => {
   it("should import CSV", async () => {
      const { result } = renderHook(() => useImportCSV(), { wrapper: Wrapper })
      result.current.mutate({
         environmentId: "env-1",
         fileName: "data.csv",
         content: "id,name\n1,a",
         tableName: "users",
      })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
   })
})

describe("useImportSQL", () => {
   it("should import SQL", async () => {
      const { result } = renderHook(() => useImportSQL(), { wrapper: Wrapper })
      result.current.mutate({
         environmentId: "env-1",
         fileName: "dump.sql",
         content: "CREATE TABLE",
         tableName: "",
      })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
   })
})

describe("useImportDataset", () => {
   it("should import dataset", async () => {
      const { result } = renderHook(() => useImportDataset(), { wrapper: Wrapper })
      result.current.mutate({ datasetId: "ds-1", environmentId: "env-1" })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
   })
})

describe("usePreviewCSV", () => {
   it("should preview CSV", async () => {
      const { result } = renderHook(() => usePreviewCSV(), { wrapper: Wrapper })
      result.current.mutate("id\n1")
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
   })
})
