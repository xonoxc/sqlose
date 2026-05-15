import { ipcMain, app } from "electron"
import path from "path"
import fs from "fs"
import type { Result } from "neverthrow"
import { AppError } from "@sqlose/shared"
import type { DBType, IPCRequest } from "@sqlose/shared"

import {
   createEnvironment as dockerCreateEnvironment,
   startEnvironment as dockerStartEnvironment,
   stopEnvironment as dockerStopEnvironment,
   restartEnvironment as dockerRestartEnvironment,
   healthCheck as dockerHealthCheck,
   destroyContainer as dockerDestroyContainer,
   stopOrphanedContainers as dockerStopOrphanedContainers,
   pullImage as dockerPullImage,
} from "@sqlose/core"
import {
   createEnvironmentRecord,
   getEnvironment,
   listEnvironments,
   updateEnvironment,
   destroyEnvironmentRecord,
   duplicateEnvironmentRecord,
   resetEnvironmentRecord,
   loadEnvironment,
} from "@sqlose/core"
import { releasePort } from "@sqlose/core"
import { executeQuery } from "@sqlose/core"
import { importCSV, previewCSV, parseSQLDump, extractTableNames } from "@sqlose/core"
import { listDatasets, getDatasetSQL } from "@sqlose/core"

function getSqliteDbPath(envId: string): string {
   const dbDir = path.join(app.getPath("userData"), "data")
   fs.mkdirSync(dbDir, { recursive: true })
   return path.join(dbDir, `${envId}.db`)
}

export type IPCSerializedResult<T> =
   | { success: true; data: T }
   | { success: false; error: { code: string; message: string } }

function serializeOk<T>(data: T): IPCSerializedResult<T> {
   return { success: true, data }
}

function serializeErr<T>(error: AppError): IPCSerializedResult<T> {
   return { success: false, error: { code: error.code, message: error.message } }
}

function serializeResult<T>(result: Result<T, AppError>): IPCSerializedResult<T> {
   if (result.isOk()) return serializeOk(result.value)
   return serializeErr(result.error)
}

function invalidPayload(detail: string): IPCSerializedResult<never> {
   return {
      success: false,
      error: { code: "ipc:invalid_payload", message: `Invalid payload: ${detail}` },
   }
}

function requireString(val: unknown, field: string): string | null {
   if (typeof val !== "string" || val.length === 0) return `${field} must be a non-empty string`
   return null
}

function validateRequest(
   payload: unknown,
   fields: Record<string, "string">
): IPCSerializedResult<never> | null {
   if (typeof payload !== "object" || payload === null) {
      return invalidPayload("expected an object")
   }
   for (const [field, type] of Object.entries(fields)) {
      const val = (payload as Record<string, unknown>)[field]
      if (type === "string") {
         const errMsg = requireString(val, field)
         if (errMsg) return invalidPayload(errMsg)
      }
   }
   return null
}

export function registerAllHandlers(): void {
   ipcMain.handle("docker:start-env", async (_event, payload: unknown) => {
      const validationError = validateRequest(payload, { environmentId: "string" })
      if (validationError) return validationError

      const { environmentId } = payload as IPCRequest<"docker:start-env">
      const env = loadEnvironment(environmentId)
      if (!env)
         return serializeErr(
            new AppError("env:not_found", `Environment ${environmentId} not found`)
         )

      if (env.dbType === "sqlite") {
         const updated = await updateEnvironment(environmentId, { status: "running" })
         if (updated.isErr()) return serializeErr(updated.error)
         return serializeOk({ environmentId, port: 0, connectionString: env.connectionString })
      }

      const startResult = await dockerStartEnvironment(env.containerId ?? "")
      if (startResult.isErr()) return serializeErr(startResult.error)

      const healthResult = await dockerHealthCheck(env.containerId ?? "")
      const uptime = healthResult.isOk() ? healthResult.value.uptime : 0

      await updateEnvironment(environmentId, { status: "running", uptime })
      return serializeOk({
         environmentId,
         port: env.port,
         connectionString: env.connectionString,
      })
   })

   ipcMain.handle("docker:stop-env", async (_event, payload: unknown) => {
      const validationError = validateRequest(payload, { environmentId: "string" })
      if (validationError) return validationError

      const { environmentId } = payload as IPCRequest<"docker:stop-env">
      const env = loadEnvironment(environmentId)
      if (!env)
         return serializeErr(
            new AppError("env:not_found", `Environment ${environmentId} not found`)
         )

      if (env.dbType === "sqlite") {
         await updateEnvironment(environmentId, { status: "stopped", uptime: null })
         return serializeOk({ environmentId })
      }

      const result = await dockerStopEnvironment(env.containerId ?? "")
      if (result.isErr()) return serializeErr(result.error)

      await updateEnvironment(environmentId, { status: "stopped", uptime: null })
      return serializeOk({ environmentId })
   })

   ipcMain.handle("docker:restart-env", async (_event, payload: unknown) => {
      const validationError = validateRequest(payload, { environmentId: "string" })
      if (validationError) return validationError

      const { environmentId } = payload as IPCRequest<"docker:restart-env">
      const env = loadEnvironment(environmentId)
      if (!env)
         return serializeErr(
            new AppError("env:not_found", `Environment ${environmentId} not found`)
         )

      if (env.dbType === "sqlite") {
         await updateEnvironment(environmentId, { status: "running" })
         return serializeOk({ environmentId })
      }

      const result = await dockerRestartEnvironment(env.containerId ?? "")
      if (result.isErr()) return serializeErr(result.error)

      await updateEnvironment(environmentId, { status: "running" })
      return serializeOk({ environmentId })
   })

   ipcMain.handle("docker:health", async (_event, payload: unknown) => {
      const validationError = validateRequest(payload, { environmentId: "string" })
      if (validationError) return validationError

      const { environmentId } = payload as IPCRequest<"docker:health">
      const env = loadEnvironment(environmentId)
      if (!env)
         return serializeErr(
            new AppError("env:not_found", `Environment ${environmentId} not found`)
         )

      if (env.dbType === "sqlite") {
         return serializeOk({ healthy: true, uptime: 0 })
      }

      const result = await dockerHealthCheck(env.containerId ?? "")
      return serializeResult(result)
   })

   ipcMain.handle("docker:cleanup", async () => {
      const result = await dockerStopOrphanedContainers()
      if (result.isErr()) return serializeErr(result.error)
      return serializeOk({ cleaned: result.value })
   })

   ipcMain.handle("docker:pull-image", async (_event, payload: unknown) => {
      if (typeof payload !== "object" || payload === null)
         return invalidPayload("expected an object")
      const { dbType } = payload as Record<string, unknown>
      if (typeof dbType !== "string" || !["postgres", "mysql", "sqlite"].includes(dbType)) {
         return invalidPayload("dbType must be postgres, mysql, or sqlite")
      }
      const result = await dockerPullImage(dbType as DBType)
      if (result.isErr()) return serializeErr(result.error)
      return serializeOk({ image: dbType })
   })

   ipcMain.handle("env:create", async (_event, payload: unknown) => {
      if (typeof payload !== "object" || payload === null)
         return invalidPayload("expected an object")
      const { dbType, name } = payload as Record<string, unknown>
      if (typeof dbType !== "string" || !["postgres", "mysql", "sqlite"].includes(dbType)) {
         return invalidPayload("dbType must be postgres, mysql, or sqlite")
      }
      if (name !== undefined && (typeof name !== "string" || name.length === 0)) {
         return invalidPayload("name must be a non-empty string")
      }

      const typedPayload = payload as IPCRequest<"env:create">
      const envResult = await createEnvironmentRecord(typedPayload.dbType, typedPayload.name)
      if (envResult.isErr()) return serializeErr(envResult.error)

      const env = envResult.value

      if (typedPayload.dbType === "sqlite") {
         const connectionString = getSqliteDbPath(env.id)
         const updated = await updateEnvironment(env.id, { connectionString, status: "running" })
         if (updated.isErr()) return serializeErr(updated.error)
         return serializeOk(updated.value)
      }

      return serializeOk(env)
   })

   ipcMain.handle("docker:create-container", async (_event, payload: unknown) => {
      if (typeof payload !== "object" || payload === null)
         return invalidPayload("expected an object")
      const { environmentId } = payload as Record<string, unknown>
      if (typeof environmentId !== "string" || environmentId.length === 0) {
         return invalidPayload("environmentId must be a non-empty string")
      }

      const env = loadEnvironment(environmentId)
      if (!env)
         return serializeErr(
            new AppError("env:not_found", `Environment ${environmentId} not found`)
         )

      const dockerResult = await dockerCreateEnvironment(env.dbType)
      if (dockerResult.isErr()) {
         await destroyEnvironmentRecord(environmentId)
         return serializeErr(dockerResult.error)
      }

      const { port, containerId, connectionString } = dockerResult.value
      const healthResult = await dockerHealthCheck(containerId)
      const uptime = healthResult.isOk() ? healthResult.value.uptime : 0

      const updated = await updateEnvironment(environmentId, {
         port,
         containerId,
         connectionString,
         status: "running",
         uptime,
      })
      if (updated.isErr()) return serializeErr(updated.error)

      return serializeOk(updated.value)
   })

   ipcMain.handle("env:destroy", async (_event, payload: unknown) => {
      const validationError = validateRequest(payload, { environmentId: "string" })
      if (validationError) return validationError

      const { environmentId } = payload as IPCRequest<"env:destroy">
      const env = loadEnvironment(environmentId)
      if (!env)
         return serializeErr(
            new AppError("env:not_found", `Environment ${environmentId} not found`)
         )

      await dockerDestroyContainer(env.containerId ?? "")

      if (env.port > 0) releasePort(env.port)

      if (env.dbType === "sqlite") {
         try {
            fs.unlinkSync(getSqliteDbPath(environmentId))
         } catch {
            // file may not exist if no queries were ever run
         }
      }

      await destroyEnvironmentRecord(environmentId)
      return serializeOk({ environmentId })
   })

   ipcMain.handle("env:list", async () => {
      const result = await listEnvironments()
      return serializeResult(result)
   })

   ipcMain.handle("env:get", async (_event, payload: unknown) => {
      const validationError = validateRequest(payload, { environmentId: "string" })
      if (validationError) return validationError

      const { environmentId } = payload as IPCRequest<"env:get">
      const result = await getEnvironment(environmentId)
      return serializeResult(result)
   })

   ipcMain.handle("env:duplicate", async (_event, payload: unknown) => {
      const validationError = validateRequest(payload, { environmentId: "string" })
      if (validationError) return validationError

      const { environmentId } = payload as IPCRequest<"env:duplicate">
      const env = loadEnvironment(environmentId)
      if (!env)
         return serializeErr(
            new AppError("env:not_found", `Environment ${environmentId} not found`)
         )

      const result = await duplicateEnvironmentRecord(environmentId)
      if (result.isErr()) return serializeErr(result.error)

      if (env.dbType === "sqlite") {
         const dup = result.value
         const srcPath = getSqliteDbPath(environmentId)
         const dstPath = getSqliteDbPath(dup.id)
         try {
            fs.copyFileSync(srcPath, dstPath)
         } catch {
            // source file may not exist
         }
         const updated = await updateEnvironment(dup.id, {
            connectionString: dstPath,
            status: "running",
         })
         if (updated.isErr()) return serializeErr(updated.error)
         return serializeOk(updated.value)
      }

      return serializeOk(result.value)
   })

   ipcMain.handle("env:reset", async (_event, payload: unknown) => {
      const validationError = validateRequest(payload, { environmentId: "string" })
      if (validationError) return validationError

      const { environmentId } = payload as IPCRequest<"env:reset">
      const env = loadEnvironment(environmentId)
      if (!env)
         return serializeErr(
            new AppError("env:not_found", `Environment ${environmentId} not found`)
         )

      if (env.dbType === "sqlite") {
         const dbPath = getSqliteDbPath(environmentId)
         try {
            fs.unlinkSync(dbPath)
         } catch {
            // file may not exist
         }
         const updated = await updateEnvironment(environmentId, {
            connectionString: dbPath,
            status: "running",
         })
         if (updated.isErr()) return serializeErr(updated.error)
         return serializeOk(updated.value)
      }

      const result = await resetEnvironmentRecord(environmentId)
      return serializeResult(result)
   })

   ipcMain.handle("env:nuke", async (_event, payload: unknown) => {
      const validationError = validateRequest(payload, { environmentId: "string" })
      if (validationError) return validationError

      const { environmentId } = payload as IPCRequest<"env:nuke">
      const env = loadEnvironment(environmentId)
      if (!env)
         return serializeErr(
            new AppError("env:not_found", `Environment ${environmentId} not found`)
         )

      await dockerDestroyContainer(env.containerId ?? "")

      if (env.port > 0) releasePort(env.port)

      if (env.dbType === "sqlite") {
         try {
            fs.unlinkSync(getSqliteDbPath(environmentId))
         } catch {
            // file may not exist
         }
      }

      const result = await resetEnvironmentRecord(environmentId)
      return serializeResult(result)
   })

   ipcMain.handle("query:execute", async (_event, payload: unknown) => {
      const validationError = validateRequest(payload, {
         environmentId: "string",
         sql: "string",
      })
      if (validationError) return validationError

      const { environmentId, sql } = payload as IPCRequest<"query:execute">
      const result = await executeQuery(environmentId, sql)
      return serializeResult(result)
   })

   ipcMain.handle("import:csv", async (_event, payload: unknown) => {
      if (typeof payload !== "object" || payload === null)
         return invalidPayload("expected an object")
      const p = payload as Record<string, unknown>
      const envErr =
         requireString(p.environmentId, "environmentId") ??
         requireString(p.fileName, "fileName") ??
         requireString(p.content, "content")
      if (envErr) return invalidPayload(envErr)

      const { fileName, content, tableName } = payload as IPCRequest<"import:csv">
      const name = tableName ?? fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_]/g, "_")
      const result = await importCSV(content, name)
      return serializeResult(result)
   })

   ipcMain.handle("import:sql", async (_event, payload: unknown) => {
      if (typeof payload !== "object" || payload === null)
         return invalidPayload("expected an object")
      const p = payload as Record<string, unknown>
      const envErr = requireString(p.fileName, "fileName") ?? requireString(p.content, "content")
      if (envErr) return invalidPayload(envErr)

      const { content } = payload as { content: string }
      const parseResult = await parseSQLDump(content)
      if (parseResult.isErr()) return serializeErr(parseResult.error)

      const tables = extractTableNames(parseResult.value)
      return serializeOk({ tablesCreated: tables })
   })

   ipcMain.handle("import:preview-csv", async (_event, payload: unknown) => {
      if (typeof payload !== "object" || payload === null)
         return invalidPayload("expected an object")
      const p = payload as Record<string, unknown>
      const errMsg = requireString(p.content, "content")
      if (errMsg) return invalidPayload(errMsg)

      const { content } = payload as IPCRequest<"import:preview-csv">
      const result = await previewCSV(content)
      return serializeResult(result)
   })

   ipcMain.handle("dataset:list", async () => {
      const result = await listDatasets()
      return serializeResult(result)
   })

   ipcMain.handle("dataset:import", async (_event, payload: unknown) => {
      const validationError = validateRequest(payload, {
         datasetId: "string",
         environmentId: "string",
      })
      if (validationError) return validationError

      const { datasetId, environmentId } = payload as IPCRequest<"dataset:import">

      const sqlResult = await getDatasetSQL(datasetId)
      if (sqlResult.isErr()) return serializeErr(sqlResult.error)

      const env = loadEnvironment(environmentId)
      if (!env)
         return serializeErr(
            new AppError("env:not_found", `Environment ${environmentId} not found`)
         )

      const parseResult = await parseSQLDump(sqlResult.value)
      if (parseResult.isErr()) return serializeErr(parseResult.error)

      const tables = extractTableNames(parseResult.value)

      for (const stmt of parseResult.value) {
         const queryResult = await executeQuery(environmentId, stmt.sql)
         if (queryResult.isErr()) return serializeErr(queryResult.error)
      }

      return serializeOk({ tablesCreated: tables })
   })
}
