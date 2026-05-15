/// <reference types="vite/client" />

import type { editor } from "monaco-editor"
import type {
   DBType,
   Environment,
   QueryResult,
   Dataset,
   ImportPayload,
   ImportResult,
} from "@sqlose/shared"

declare module "monaco-vim" {
   export function initVimMode(
      editor: editor.IStandaloneCodeEditor,
      statusbar?: HTMLElement | null
   ): { dispose: () => void }
}

type IPCSerializedResult<T> =
   | { success: true; data: T }
   | { success: false; error: { code: string; message: string } }

interface SqloseAPI {
   docker: {
      startEnv: (request: {
         environmentId: string
      }) => Promise<
         IPCSerializedResult<{ environmentId: string; port: number; connectionString: string }>
      >
      stopEnv: (request: {
         environmentId: string
      }) => Promise<IPCSerializedResult<{ environmentId: string }>>
      restartEnv: (request: {
         environmentId: string
      }) => Promise<IPCSerializedResult<{ environmentId: string }>>
      health: (request: {
         environmentId: string
      }) => Promise<IPCSerializedResult<{ healthy: boolean; uptime: number }>>
      cleanup: (request: Record<string, never>) => Promise<IPCSerializedResult<{ cleaned: number }>>
   }
   env: {
      create: (request: {
         dbType: DBType
         name?: string
      }) => Promise<IPCSerializedResult<Environment>>
      destroy: (request: {
         environmentId: string
      }) => Promise<IPCSerializedResult<{ environmentId: string }>>
      list: (request: Record<string, never>) => Promise<IPCSerializedResult<Environment[]>>
      get: (request: { environmentId: string }) => Promise<IPCSerializedResult<Environment>>
      duplicate: (request: { environmentId: string }) => Promise<IPCSerializedResult<Environment>>
      reset: (request: { environmentId: string }) => Promise<IPCSerializedResult<Environment>>
   }
   query: {
      execute: (request: {
         environmentId: string
         sql: string
      }) => Promise<IPCSerializedResult<QueryResult>>
   }
   import: {
      csv: (
         request: ImportPayload & { format: "csv" }
      ) => Promise<IPCSerializedResult<ImportResult>>
      sql: (
         request: ImportPayload & { format: "sql" }
      ) => Promise<IPCSerializedResult<{ tablesCreated: string[] }>>
      previewCSV: (request: {
         content: string
      }) => Promise<IPCSerializedResult<{ columns: string[]; preview: Record<string, string>[] }>>
   }
   dataset: {
      list: (request: Record<string, never>) => Promise<IPCSerializedResult<Dataset[]>>
      import: (request: {
         datasetId: string
         environmentId: string
      }) => Promise<IPCSerializedResult<{ tablesCreated: string[] }>>
   }
}

declare global {
   interface Window {
      sqlose: SqloseAPI
   }
}

export {}
