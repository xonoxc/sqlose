import { describe, it, expect, vi, beforeEach, type Mock } from "vitest"
import { DockerError } from "@sqlose/shared"
import {
   createEnvironment,
   healthCheck,
   cleanupOrphans,
   destroyContainer,
   startEnvironment,
   stopEnvironment,
   restartEnvironment,
   __setDocker,
} from "./index"
import * as portModule from "./port"

vi.mock("./port", () => ({
   findAvailablePort: vi.fn(),
   reservePort: vi.fn(),
   releasePort: vi.fn(),
}))

vi.mock("../drivers/postgres", () => ({
   testPostgresConnection: vi.fn(),
}))

vi.mock("../drivers/mysql", () => ({
   testMySQLConnection: vi.fn(),
}))

function makeMockDocker(
   overrides: Partial<{
      createContainer: ReturnType<typeof vi.fn>
      getContainer: ReturnType<typeof vi.fn>
      listContainers: ReturnType<typeof vi.fn>
      pull: ReturnType<typeof vi.fn>
   }> = {}
) {
   const mockContainer = {
      id: "mock-container-id",
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
      restart: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      inspect: vi.fn().mockResolvedValue({
         State: { Running: true, StartedAt: new Date(Date.now() - 5000).toISOString() },
      }),
   }

   const followProgress = vi
      .fn()
      .mockImplementation((_stream, onFinished: (err: Error | null) => void) => {
         onFinished(null)
      })

   return {
      createContainer: overrides.createContainer ?? vi.fn().mockResolvedValue(mockContainer),
      getContainer: overrides.getContainer ?? vi.fn().mockReturnValue(mockContainer),
      listContainers: overrides.listContainers ?? vi.fn().mockResolvedValue([]),
      pull:
         overrides.pull ??
         vi
            .fn()
            .mockImplementation(
               (
                  _image: string,
                  _opts: unknown,
                  callback: (err: Error | null, stream: unknown) => void
               ) => {
                  callback(null, "mock-stream")
               }
            ),
      modem: { followProgress },
   }
}

const mockOkBool = (value: boolean) =>
   Promise.resolve({
      isOk: () => true,
      isErr: () => false,
      value,
      error: undefined,
      _unsafeUnwrap: () => value,
   })

const mockErrBool = (code: string) =>
   Promise.resolve({
      isOk: () => false,
      isErr: () => true,
      error: { code, message: code },
      value: undefined,
      _unsafeUnwrapErr: () => ({ code, message: code }),
   })

describe("Docker Orchestration", () => {
   beforeEach(async () => {
      vi.clearAllMocks()
      __setDocker(makeMockDocker() as never)
      const { testPostgresConnection } = await import("../drivers/postgres")
      const { testMySQLConnection } = await import("../drivers/mysql")
      ;(testPostgresConnection as Mock).mockReturnValue(mockOkBool(true))
      ;(testMySQLConnection as Mock).mockReturnValue(mockOkBool(true))
   })

   describe("createEnvironment", () => {
      it("should create a postgres environment successfully", async () => {
         ;(portModule.findAvailablePort as Mock).mockResolvedValue({
            isOk: () => true,
            isErr: () => false,
            value: 54321,
            error: undefined,
            _unsafeUnwrap: () => 54321,
         })
         ;(portModule.reservePort as Mock).mockReturnValue(true)

         const result = await createEnvironment("postgres")

         expect(result.isOk()).toBe(true)
         if (result.isOk()) {
            expect(result.value.port).toBe(54321)
            expect(result.value.containerId).toBe("mock-container-id")
            expect(result.value.connectionString).toContain("postgresql://")
         }
      })

      it("should create a mysql environment successfully", async () => {
         ;(portModule.findAvailablePort as Mock).mockResolvedValue({
            isOk: () => true,
            isErr: () => false,
            value: 33061,
            error: undefined,
            _unsafeUnwrap: () => 33061,
         })
         ;(portModule.reservePort as Mock).mockReturnValue(true)

         const result = await createEnvironment("mysql")

         expect(result.isOk()).toBe(true)
         if (result.isOk()) {
            expect(result.value.port).toBe(33061)
            expect(result.value.connectionString).toContain("mysql://")
         }
      })

      it("should handle sqlite without docker container", async () => {
         const result = await createEnvironment("sqlite")

         expect(result.isOk()).toBe(true)
         if (result.isOk()) {
            expect(result.value.port).toBe(0)
            expect(result.value.containerId).toBe("")
         }
      })

      it("should return DockerError when port allocation fails", async () => {
         ;(portModule.findAvailablePort as Mock).mockResolvedValue({
            isOk: () => false,
            isErr: () => true,
            value: undefined,
            error: new DockerError("docker:port_conflict", "No ports available"),
            _unsafeUnwrapErr: () => new DockerError("docker:port_conflict"),
         })

         const result = await createEnvironment("postgres")

         expect(result.isErr()).toBe(true)
         if (result.isErr()) {
            expect(result.error).toBeInstanceOf(DockerError)
            expect(result.error.code).toBe("docker:port_conflict")
         }
      })

      it("should return DockerError when port is already reserved", async () => {
         ;(portModule.findAvailablePort as Mock).mockResolvedValue({
            isOk: () => true,
            isErr: () => false,
            value: 54321,
            error: undefined,
            _unsafeUnwrap: () => 54321,
         })
         ;(portModule.reservePort as Mock).mockReturnValue(false)

         const result = await createEnvironment("postgres")

         expect(result.isErr()).toBe(true)
         if (result.isErr()) {
            expect(result.error).toBeInstanceOf(DockerError)
            expect(result.error.code).toBe("docker:port_conflict")
         }
      })

      it("should return DockerError when container creation fails", async () => {
         ;(portModule.findAvailablePort as Mock).mockResolvedValue({
            isOk: () => true,
            isErr: () => false,
            value: 54321,
            error: undefined,
            _unsafeUnwrap: () => 54321,
         })
         ;(portModule.reservePort as Mock).mockReturnValue(true)

         __setDocker(
            makeMockDocker({
               createContainer: vi.fn().mockRejectedValue(new Error("Docker daemon not running")),
            }) as never
         )

         const result = await createEnvironment("postgres")

         expect(result.isErr()).toBe(true)
         if (result.isErr()) {
            expect(result.error).toBeInstanceOf(DockerError)
            expect(result.error.code).toBe("docker:container_failed")
         }
      })
   })

   describe("healthCheck", () => {
      it("should return healthy for a running container", async () => {
         const result = await healthCheck("container-id")

         expect(result.isOk()).toBe(true)
         if (result.isOk()) {
            expect(result.value.healthy).toBe(true)
            expect(result.value.uptime).toBeGreaterThanOrEqual(0)
         }
      })

      it("should return healthy for empty containerId (sqlite)", async () => {
         const result = await healthCheck("")

         expect(result.isOk()).toBe(true)
         if (result.isOk()) {
            expect(result.value.healthy).toBe(true)
         }
      })

      it("should return unhealthy for missing container", async () => {
         __setDocker(
            makeMockDocker({
               getContainer: vi.fn().mockReturnValue({
                  id: "mock",
                  start: vi.fn(),
                  stop: vi.fn(),
                  restart: vi.fn(),
                  remove: vi.fn(),
                  inspect: vi.fn().mockRejectedValue({ statusCode: 404 }),
               }),
            }) as never
         )

         const result = await healthCheck("nonexistent")

         expect(result.isOk()).toBe(true)
         if (result.isOk()) {
            expect(result.value.healthy).toBe(false)
         }
      })

      it("should return DockerError on inspect failure", async () => {
         __setDocker(
            makeMockDocker({
               getContainer: vi.fn().mockReturnValue({
                  id: "mock",
                  start: vi.fn(),
                  stop: vi.fn(),
                  restart: vi.fn(),
                  remove: vi.fn(),
                  inspect: vi.fn().mockRejectedValue(new Error("Connection refused")),
               }),
            }) as never
         )

         const result = await healthCheck("bad-container")

         expect(result.isErr()).toBe(true)
         if (result.isErr()) {
            expect(result.error).toBeInstanceOf(DockerError)
            expect(result.error.code).toBe("docker:health_timeout")
         }
      })
   })

   describe("container lifecycle", () => {
      it("startEnvironment should start a container", async () => {
         const result = await startEnvironment("container-id")
         expect(result.isOk()).toBe(true)
      })

      it("startEnvironment should return error on failure", async () => {
         __setDocker(
            makeMockDocker({
               getContainer: vi.fn().mockReturnValue({
                  id: "mock",
                  start: vi.fn().mockRejectedValue(new Error("Start failed")),
                  stop: vi.fn(),
                  restart: vi.fn(),
                  remove: vi.fn(),
                  inspect: vi.fn(),
               }),
            }) as never
         )

         const result = await startEnvironment("bad-container")
         expect(result.isErr()).toBe(true)
         if (result.isErr()) {
            expect(result.error.code).toBe("env:start_failed")
         }
      })

      it("stopEnvironment should stop a container", async () => {
         const result = await stopEnvironment("container-id")
         expect(result.isOk()).toBe(true)
      })

      it("stopEnvironment should return error on failure", async () => {
         __setDocker(
            makeMockDocker({
               getContainer: vi.fn().mockReturnValue({
                  id: "mock",
                  start: vi.fn(),
                  stop: vi.fn().mockRejectedValue(new Error("Stop failed")),
                  restart: vi.fn(),
                  remove: vi.fn(),
                  inspect: vi.fn(),
               }),
            }) as never
         )

         const result = await stopEnvironment("bad-container")
         expect(result.isErr()).toBe(true)
         if (result.isErr()) {
            expect(result.error.code).toBe("env:stop_failed")
         }
      })

      it("restartEnvironment should restart a container", async () => {
         const result = await restartEnvironment("container-id")
         expect(result.isOk()).toBe(true)
      })

      it("restartEnvironment should return error on failure", async () => {
         __setDocker(
            makeMockDocker({
               getContainer: vi.fn().mockReturnValue({
                  id: "mock",
                  start: vi.fn(),
                  stop: vi.fn(),
                  restart: vi.fn().mockRejectedValue(new Error("Restart failed")),
                  remove: vi.fn(),
                  inspect: vi.fn(),
               }),
            }) as never
         )

         const result = await restartEnvironment("bad-container")
         expect(result.isErr()).toBe(true)
         if (result.isErr()) {
            expect(result.error.code).toBe("docker:container_failed")
         }
      })
   })

   describe("destroyContainer", () => {
      it("should destroy a container successfully", async () => {
         const result = await destroyContainer("container-id")
         expect(result.isOk()).toBe(true)
      })

      it("should succeed with empty containerId (sqlite)", async () => {
         const result = await destroyContainer("")
         expect(result.isOk()).toBe(true)
      })

      it("should return error on failure", async () => {
         __setDocker(
            makeMockDocker({
               getContainer: vi.fn().mockReturnValue({
                  id: "mock",
                  start: vi.fn(),
                  stop: vi.fn().mockRejectedValue(new Error("Stop failed")),
                  restart: vi.fn(),
                  remove: vi.fn().mockRejectedValue(new Error("Remove failed")),
                  inspect: vi.fn(),
               }),
            }) as never
         )

         const result = await destroyContainer("bad-container")
         expect(result.isErr()).toBe(true)
         if (result.isErr()) {
            expect(result.error.code).toBe("env:destroy_failed")
         }
      })
   })

   describe("cleanupOrphans", () => {
      it("should clean up orphaned containers", async () => {
         __setDocker(
            makeMockDocker({
               listContainers: vi.fn().mockResolvedValue([
                  { Id: "abc", Names: ["/sqlose-postgres"], State: "exited" },
                  { Id: "def", Names: ["/other-container"], State: "exited" },
                  { Id: "ghi", Names: ["/sqlose-mysql"], State: "running" },
               ]),
            }) as never
         )

         const result = await cleanupOrphans()

         expect(result.isOk()).toBe(true)
         if (result.isOk()) {
            expect(result.value).toBe(2)
         }
      })

      it("should return DockerError on failure", async () => {
         __setDocker(
            makeMockDocker({
               listContainers: vi.fn().mockRejectedValue(new Error("Docker not available")),
            }) as never
         )

         const result = await cleanupOrphans()
         expect(result.isErr()).toBe(true)
         if (result.isErr()) {
            expect(result.error.code).toBe("docker:cleanup_failed")
         }
      })
   })
})
