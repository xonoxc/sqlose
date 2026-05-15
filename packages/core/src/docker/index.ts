import type Docker from "dockerode"
import { ok, err } from "neverthrow"
import { AppError, DockerError, okResult } from "@sqlose/shared"
import type { DBType, AsyncAppResult, AppResult } from "@sqlose/shared"
import { findAvailablePort, reservePort, releasePort } from "./port"
import { loadEnvironments, saveEnvironment } from "../environment/store"

const PULL_TIMEOUT_MS = 5 * 60 * 1000
const OP_TIMEOUT_MS = 60 * 1000
const DB_READY_RETRIES = 30
const DB_READY_INTERVAL_MS = 1000

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
   return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
         setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
      ),
   ])
}

const DB_IMAGE_MAP: Record<DBType, { image: string; internalPort: number; env: string[] }> = {
   postgres: {
      image: "postgres:16-alpine",
      internalPort: 5432,
      env: ["POSTGRES_PASSWORD=sqlose", "POSTGRES_USER=sqlose", "POSTGRES_DB=sqlose"],
   },
   mysql: {
      image: "mysql:8.0",
      internalPort: 3306,
      env: [
         "MYSQL_ROOT_PASSWORD=sqlose",
         "MYSQL_DATABASE=sqlose",
         "MYSQL_USER=sqlose",
         "MYSQL_PASSWORD=sqlose",
      ],
   },
   sqlite: {
      image: "nouchka/sqlite3:latest",
      internalPort: 0,
      env: [],
   },
}

function buildConnectionString(dbType: DBType, port: number): string {
   switch (dbType) {
      case "postgres":
         return `postgresql://sqlose:sqlose@localhost:${port}/sqlose`
      case "mysql":
         return `mysql://sqlose:sqlose@localhost:${port}/sqlose`
      case "sqlite":
         return `sqlite:///data/sqlose.db`
   }
}

let _docker: Docker | null = null

export function __setDocker(mock: Docker): void {
   _docker = mock
}

function getDocker(): Docker {
   return _docker as Docker
}

export function initDocker(): AsyncAppResult<void> {
   if (_docker) return Promise.resolve(okResult(undefined))
   return import("dockerode")
      .then(mod => {
         _docker = new mod.default()
         return okResult(undefined)
      })
      .catch((e: Error) =>
         err(new DockerError("docker:container_failed", e.message ?? "Failed to initialize Docker"))
      )
}

export function pullImage(dbType: DBType): AsyncAppResult<void> {
   const config = DB_IMAGE_MAP[dbType]
   if (!config.image) return Promise.resolve(okResult(undefined))

   const docker = getDocker()
   return withTimeout(
      new Promise<void>((resolve, reject) => {
         docker.pull(config.image, {}, (err: Error | null, stream: unknown) => {
            if (err) return reject(err)
            docker.modem.followProgress(
               stream as NodeJS.ReadableStream,
               (progressErr: Error | null) => {
                  if (progressErr) reject(progressErr)
                  else resolve()
               }
            )
         })
      }),
      PULL_TIMEOUT_MS,
      `Pulling image ${config.image}`
   )
      .then(() => okResult(undefined))
      .catch((e: Error) =>
         err(
            new DockerError(
               "docker:pull_failed",
               e.message ?? `Failed to pull image ${config.image}`
            )
         )
      )
}

export function waitForDatabaseReady(
   dbType: DBType,
   connectionString: string
): AsyncAppResult<void> {
   if (dbType === "sqlite") return Promise.resolve(okResult(undefined))

   let attempt = 0

   function poll(): AsyncAppResult<void> {
      attempt++
      if (attempt > DB_READY_RETRIES) {
         return Promise.resolve(
            err(new DockerError("docker:container_failed", "Database did not become ready in time"))
         )
      }

      const testFn =
         dbType === "postgres"
            ? () =>
                 import("../drivers/postgres").then(m => m.testPostgresConnection(connectionString))
            : () => import("../drivers/mysql").then(m => m.testMySQLConnection(connectionString))

      return testFn()
         .then(result => {
            if (result.isOk() && result.value) {
               return okResult(undefined)
            }
            return new Promise<AppResult<void>>(resolve =>
               setTimeout(() => resolve(poll()), DB_READY_INTERVAL_MS)
            )
         })
         .catch(
            () =>
               new Promise<AppResult<void>>(resolve =>
                  setTimeout(() => resolve(poll()), DB_READY_INTERVAL_MS)
               )
         )
   }

   return poll()
}

export function createEnvironment(dbType: DBType): AsyncAppResult<{
   port: number
   containerId: string
   connectionString: string
}> {
   if (dbType === "sqlite") {
      return Promise.resolve(
         ok({
            port: 0,
            containerId: "",
            connectionString: buildConnectionString(dbType, 0),
         })
      )
   }

   const docker = getDocker()

   type EnvResult = AppResult<{ port: number; containerId: string; connectionString: string }>

   return findAvailablePort()
      .then(portResult => {
         if (portResult.isErr()) {
            return err(
               new DockerError("docker:port_conflict", portResult.error.message)
            ) as EnvResult
         }

         const port = portResult.value
         if (!reservePort(port)) {
            return err(
               new DockerError("docker:port_conflict", `Port ${port} is already reserved`)
            ) as EnvResult
         }

         const config = DB_IMAGE_MAP[dbType]

         return pullImage(dbType).then(pullResult => {
            if (pullResult.isErr()) {
               releasePort(port)
               return err(
                  new DockerError("docker:pull_failed", pullResult.error.message)
               ) as EnvResult
            }

            return withTimeout(
               docker
                  .createContainer({
                     Image: config.image,
                     Env: config.env,
                     ExposedPorts: { [`${config.internalPort}/tcp`]: {} },
                     HostConfig: {
                        PortBindings: {
                           [`${config.internalPort}/tcp`]: [{ HostPort: String(port) }],
                        },
                     },
                  })
                  .then(container =>
                     withTimeout(container.start(), OP_TIMEOUT_MS, "Starting container").then(
                        () => {
                           const connectionString = buildConnectionString(dbType, port)
                           return waitForDatabaseReady(dbType, connectionString).then(
                              readyResult => {
                                 if (readyResult.isErr()) {
                                    container.stop().catch(() => Promise.resolve())
                                    container
                                       .remove({ v: true, force: true })
                                       .catch(() => Promise.resolve())
                                    releasePort(port)
                                    return err(readyResult.error) as EnvResult
                                 }
                                 return ok({
                                    port,
                                    containerId: container.id,
                                    connectionString,
                                 })
                              }
                           )
                        }
                     )
                  ),
               OP_TIMEOUT_MS,
               "Creating container"
            )
         })
      })
      .catch((e: Error) =>
         err(new DockerError("docker:container_failed", e.message ?? "Failed to create container"))
      )
}

export function startEnvironment(containerId: string): AsyncAppResult<void> {
   const docker = getDocker()
   return withTimeout(docker.getContainer(containerId).start(), OP_TIMEOUT_MS, "Starting container")
      .then(() => okResult(undefined))
      .catch((e: Error) =>
         err(new AppError("env:start_failed", e.message ?? "Failed to start container"))
      )
}

export function stopEnvironment(containerId: string): AsyncAppResult<void> {
   const docker = getDocker()
   return withTimeout(docker.getContainer(containerId).stop(), OP_TIMEOUT_MS, "Stopping container")
      .then(() => okResult(undefined))
      .catch((e: Error) =>
         err(new AppError("env:stop_failed", e.message ?? "Failed to stop container"))
      )
}

export function restartEnvironment(containerId: string): AsyncAppResult<void> {
   const docker = getDocker()
   return withTimeout(
      docker.getContainer(containerId).restart(),
      OP_TIMEOUT_MS,
      "Restarting container"
   )
      .then(() => okResult(undefined))
      .catch((e: Error) =>
         err(new DockerError("docker:container_failed", e.message ?? "Failed to restart container"))
      )
}

export function healthCheck(
   containerId: string
): AsyncAppResult<{ healthy: boolean; uptime: number }> {
   if (!containerId) {
      return Promise.resolve(ok({ healthy: true, uptime: 0 }))
   }

   const docker = getDocker()
   return withTimeout(docker.getContainer(containerId).inspect(), OP_TIMEOUT_MS, "Health check")
      .then(info => {
         const running = info.State.Running
         const startedAt = info.State.StartedAt
            ? new Date(info.State.StartedAt).getTime()
            : Date.now()
         const uptime = running ? Math.floor((Date.now() - startedAt) / 1000) : 0
         return ok({ healthy: running, uptime })
      })
      .catch((e: { statusCode?: number; message?: string; code?: string }) => {
         if (e.statusCode === 404) {
            return ok({ healthy: false, uptime: 0 })
         }
         if ((e as Error).message?.includes("timed out")) {
            return err(new DockerError("docker:health_timeout", "Health check timed out"))
         }
         return err(new DockerError("docker:health_timeout", e.message ?? "Health check failed"))
      })
}

export function destroyContainer(containerId: string): AsyncAppResult<void> {
   if (!containerId) return Promise.resolve(okResult(undefined))

   const docker = getDocker()
   const container = docker.getContainer(containerId)

   return withTimeout(
      container
         .stop()
         .catch(() => Promise.resolve())
         .then(() => container.remove({ v: true, force: true })),
      OP_TIMEOUT_MS,
      "Destroying container"
   )
      .then(() => okResult(undefined))
      .catch((e: Error) =>
         err(new AppError("env:destroy_failed", e.message ?? "Failed to destroy container"))
      )
}

export function stopAllContainers(): AsyncAppResult<number> {
   const docker = getDocker()
   return docker
      .listContainers({ all: true })
      .then(containers => {
         let acted = 0
         const stopPromises: Promise<void>[] = []

         for (const containerInfo of containers) {
            const name = containerInfo.Names[0] ?? ""
            if (name.includes("sqlose") && containerInfo.State === "running") {
               const container = docker.getContainer(containerInfo.Id)
               stopPromises.push(
                  withTimeout(container.stop(), 15000, "Stopping container")
                     .then(() => {
                        acted++
                     })
                     .catch(() => {})
               )
            }
         }

         return Promise.all(stopPromises).then(() => {
            const envs = loadEnvironments()
            for (const env of envs) {
               if (env.containerId && containers.some(c => c.Id === env.containerId)) {
                  saveEnvironment({ ...env, status: "stopped", uptime: 0 })
               }
            }
            return ok(acted)
         })
      })
      .catch((e: Error) =>
         err(new DockerError("docker:stop_failed", e.message ?? "Failed to stop containers"))
      )
}

export function stopOrphanedContainers(): AsyncAppResult<number> {
   const docker = getDocker()
   return docker
      .listContainers({ all: true })
      .then(containers => {
         const envs = loadEnvironments()
         const envContainerIds = new Set(envs.filter(e => e.containerId).map(e => e.containerId))
         let stopped = 0
         const stopPromises: Promise<void>[] = []

         for (const containerInfo of containers) {
            const name = containerInfo.Names[0] ?? ""
            if (
               name.includes("sqlose") &&
               containerInfo.State === "running" &&
               !envContainerIds.has(containerInfo.Id)
            ) {
               const container = docker.getContainer(containerInfo.Id)
               stopPromises.push(
                  container
                     .stop()
                     .then(() => {
                        stopped++
                     })
                     .catch(() => {})
               )
            }
         }

         return Promise.all(stopPromises).then(() => ok(stopped))
      })
      .catch((e: Error) =>
         err(
            new DockerError(
               "docker:cleanup_failed",
               e.message ?? "Failed to stop orphaned containers"
            )
         )
      )
}

export function reconcileEnvironmentStatuses(): AsyncAppResult<number> {
   const docker = getDocker()
   let updated = 0

   const envs = loadEnvironments()
   const checks: Promise<void>[] = []

   for (const env of envs) {
      if (!env.containerId) continue

      const containerId = env.containerId

      const check = docker
         .getContainer(containerId)
         .inspect()
         .then(info => {
            if (info.State.Running) {
               const startedAt = info.State.StartedAt
                  ? new Date(info.State.StartedAt).getTime()
                  : Date.now()
               const uptime = Math.floor((Date.now() - startedAt) / 1000)
               saveEnvironment({ ...env, status: "running", uptime })
               updated++
            } else {
               saveEnvironment({ ...env, status: "stopped", uptime: 0 })
               updated++
            }
         })
         .catch((e: { statusCode?: number }) => {
            if (e.statusCode === 404) {
               saveEnvironment({ ...env, status: "error", containerId: null })
               updated++
            }
         })

      checks.push(check)
   }

   return Promise.all(checks)
      .then(() => ok(updated))
      .catch(() => ok(updated))
}
